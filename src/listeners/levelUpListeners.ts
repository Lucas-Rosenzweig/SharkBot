import { prisma } from '../utils/prisma';
import { AttachmentBuilder, Client } from 'discord.js';
import { ConfigService } from '../services/ConfigService';
import { renderLevelUpCard } from '../utils/renderLevelUpCard';
import { parseLevelUpMessage } from '../utils/parseLevelUpMessage';
import { createLogger } from '../utils/logger';

const logger = createLogger('LevelUp');

type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;

export function setupLevelUpListeners(client: Client) {
    client.on('levelUp', async (user: User, newLevel: number) => {
        if (!user) return;

        const configService = ConfigService.getInstance();
        const guildConfig = await configService.getConfigForGuild(user.guildId);

        // Send level-up message if a channel is configured
        if (guildConfig.xpChannelId) {
            try {
                const guild = await client.guilds.fetch(user.guildId);
                const channel = await guild.channels.fetch(guildConfig.xpChannelId);

                if (channel && channel.isTextBased()) {
                    const member = await guild.members.fetch(user.discordId);
                    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });

                    const pngBuffer = await renderLevelUpCard({
                        username: member.user.displayName,
                        avatarUrl,
                        newLevel,
                    });
                    const attachment = new AttachmentBuilder(pngBuffer, { name: 'level-up.png' });

                    const content = parseLevelUpMessage(guildConfig.levelUpMessage, {
                        user: member.user.displayName,
                        level: newLevel,
                        mention: `<@${user.discordId}>`,
                        server: guild.name,
                    });

                    await channel.send({
                        ...(content ? { content } : {}),
                        files: [attachment],
                    });
                }
            } catch (error) {
                logger.error({ error, guildId: user.guildId }, 'Failed to send level-up message');
            }
        }

        // Assign level roles
        try {
            const rolesToAdd = await prisma.levelRole.findMany({
                where: {
                    guildId: user.guildId,
                    levelReq: { lte: newLevel },
                },
            });

            if (rolesToAdd.length === 0) return;

            const guild = await client.guilds.fetch(user.guildId);
            const member = await guild.members.fetch(user.discordId);

            for (const lr of rolesToAdd) {
                if (member.roles.cache.has(lr.roleId)) continue;
                try {
                    await member.roles.add(lr.roleId);
                    logger.info({ roleId: lr.roleId, discordId: user.discordId }, 'Added level role');
                } catch (error) {
                    logger.error({ error, roleId: lr.roleId, discordId: user.discordId }, 'Failed to add level role');
                }
            }
        } catch (error) {
            logger.error({ error, discordId: user.discordId }, 'Failed to process level roles');
        }
    });
}