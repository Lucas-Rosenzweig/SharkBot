import { prisma } from '../utils/prisma';
import {Client} from "discord.js";
import {ConfigService} from "../services/ConfigService";

type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;



export function setupLevelUpListeners(client : Client) {
    client.on('levelUp', async (user : User, newLevel: number ) => {
        if(!user) return;
        const configService = ConfigService.getInstance()
        const guildConfig = await configService.getConfigForGuild(user.guildId);

        //Envoie un message dans le channel de xp si configuré
        if (guildConfig.xpChannelId) {
            try {
                const guild = await client.guilds.fetch(user.guildId);
                const channel = await guild.channels.fetch(guildConfig.xpChannelId);
                if (channel && channel.isTextBased()) {
                    await channel.send(`🎉 <@${user.discordId}> a atteint le niveau ${newLevel} ! Félicitations !`);
                }
            } catch (error) {
                console.error(`Erreur lors de l'envoi du message de level up pour l'utilisateur ${user.discordId}:`, error);
            }
        }

        //Attribution des rôles liés au niveau

        const guild = await client.guilds.fetch(user.guildId);
        const member = await guild.members.fetch(user.discordId);

        //Récupération des rôles de l'utilisateur pour les exclure des rôles à ajouter
        const memberRoles = member.roles.cache.map(role => role.id);
        const rolesToAdd = await prisma.levelRole.findMany({
            where: {
                guildId: user.guildId,
                levelReq: { lte: newLevel },
                roleId: { notIn: memberRoles }
            }
        })

        if (rolesToAdd.length === 0) {
            return;
        }

        for (const roles of rolesToAdd) {
            try {
                await member.roles.add(roles.roleId);
            }
            catch (error) {
                console.error(`Erreur lors de l'ajout du rôle ${roles.roleId} à l'utilisateur ${user.discordId}:`, error);
            }
        }
    });
}