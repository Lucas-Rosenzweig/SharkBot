import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionContextType,
    ComponentType,
} from 'discord.js';
import { prisma } from '../utils/prisma';
import { progressBar } from '../utils/progressBar';
import { formatK } from '../utils/svgHelpers';
import { getXpForNextLevel } from '../utils/addXpToUser';
import { LEADERBOARD_PAGE_SIZE, COLLECTOR_TIMEOUT_MS } from '../utils/constants';
import { createLogger } from '../utils/logger';

const logger = createLogger('LeaderboardCommand');
const PAGE_SIZE = LEADERBOARD_PAGE_SIZE;

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement XP du serveur')
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((opt) =>
        opt
            .setName('page')
            .setDescription('Numéro de page')
            .setRequired(false)
            .setMinValue(1)
    );

async function buildLeaderboardEmbed(
    guildId: string,
    guildName: string,
    guildIcon: string | null,
    page: number,
    callerId: string,
) {
    const totalUsers = await prisma.user.count({ where: { guildId } });
    const totalPages = Math.max(Math.ceil(totalUsers / PAGE_SIZE), 1);
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const users = await prisma.user.findMany({
        where: { guildId },
        orderBy: { xpTotal: 'desc' },
        skip: (safePage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
    });

    // Trouver le rang du caller
    const callerRank = await prisma.user.count({
        where: {
            guildId,
            xpTotal: {
                gt: (await prisma.user.findFirst({
                    where: { discordId: callerId, guildId },
                    select: { xpTotal: true },
                }))?.xpTotal ?? 0,
            },
        },
    }) + 1;

    const medals = ['🥇', '🥈', '🥉'];

    let description = '';

    if (users.length === 0) {
        description = '*Aucun utilisateur n\'a encore d\'XP sur ce serveur.*';
    } else {
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const globalIdx = (safePage - 1) * PAGE_SIZE + i;
            const rankDisplay = globalIdx < 3 ? medals[globalIdx] : `\`#${globalIdx + 1}\``;
            const name = user.username || `<@${user.discordId}>`;
            const bar = progressBar(user.xpCurrent, user.xpNext, 8);
            const isCaller = user.discordId === callerId;

            const line = [
                rankDisplay,
                isCaller ? `**${name}** ⭐` : `**${name}**`,
                `┃ Niv. **${user.level}**`,
                `• ${formatK(user.xpTotal)} XP`,
                `\n${isCaller ? '> ' : '  '}${bar} \`${user.xpCurrent}/${user.xpNext}\``,
            ].join(' ');

            description += line + '\n\n';
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0x00d2ff)
        .setTitle('🏆  Classement XP')
        .setDescription(description.trim())
        .setFooter({
            text: `Page ${safePage}/${totalPages} • ${totalUsers} membre${totalUsers > 1 ? 's' : ''} • Ton rang : #${callerRank}`,
            iconURL: guildIcon ?? undefined,
        })
        .setTimestamp();

    if (guildIcon) {
        embed.setThumbnail(guildIcon);
    }

    return { embed, safePage, totalPages };
}

function buildButtons(page: number, totalPages: number, disabled = false) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('lb_first')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page <= 1),
        new ButtonBuilder()
            .setCustomId('lb_prev')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || page <= 1),
        new ButtonBuilder()
            .setCustomId('lb_page')
            .setLabel(`${page} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('lb_next')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || page >= totalPages),
        new ButtonBuilder()
            .setCustomId('lb_last')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page >= totalPages),
    );
}

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    if (!interaction.guild) {
        await interaction.editReply('Cette commande est utilisable uniquement dans un serveur.');
        return;
    }

    const startPage = interaction.options.getInteger('page') || 1;
    const guildIcon = interaction.guild.iconURL({ size: 128 });

    try {
        let { embed, safePage, totalPages } = await buildLeaderboardEmbed(
            interaction.guild.id,
            interaction.guild.name,
            guildIcon,
            startPage,
            interaction.user.id,
        );

        const message = await interaction.editReply({
            embeds: [embed],
            components: totalPages > 1 ? [buildButtons(safePage, totalPages)] : [],
        });

        if (totalPages <= 1) return;

        // Collector de boutons — 2 minutes
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.user.id === interaction.user.id,
            time: COLLECTOR_TIMEOUT_MS,
        });

        let currentPage = safePage;

        collector.on('collect', async (i) => {
            switch (i.customId) {
                case 'lb_first':
                    currentPage = 1;
                    break;
                case 'lb_prev':
                    currentPage = Math.max(1, currentPage - 1);
                    break;
                case 'lb_next':
                    currentPage = Math.min(totalPages, currentPage + 1);
                    break;
                case 'lb_last':
                    currentPage = totalPages;
                    break;
            }

            const result = await buildLeaderboardEmbed(
                interaction.guild!.id,
                interaction.guild!.name,
                guildIcon,
                currentPage,
                interaction.user.id,
            );

            // Met à jour totalPages au cas où un user a été ajouté
            totalPages = result.totalPages;
            currentPage = result.safePage;

            await i.update({
                embeds: [result.embed],
                components: [buildButtons(currentPage, totalPages)],
            });
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({
                    components: [buildButtons(currentPage, totalPages, true)],
                });
            } catch {
                // Le message a peut-être été supprimé
            }
        });
    } catch (error) {
        logger.error({ error }, 'Leaderboard generation failed');
        await interaction.editReply('❌ Une erreur est survenue lors de la génération du classement.');
    }
}
