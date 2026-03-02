import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    AttachmentBuilder,
    InteractionContextType,
    EmbedBuilder,
} from 'discord.js';
import { prisma } from '../utils/prisma';
import { renderRankCard } from '../utils/renderRankCard';

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Affiche ta carte de rang ou celle d\'un autre membre')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((opt) =>
        opt
            .setName('user')
            .setDescription('Membre dont tu veux voir le rang')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;

    if (!interaction.guild) {
        await interaction.editReply('Cette commande est utilisable uniquement dans un serveur.');
        return;
    }

    // Récupérer les données XP du user
    const userData = await prisma.user.findFirst({
        where: {
            discordId: targetUser.id,
            guildId: interaction.guild.id,
        },
    });

    if (!userData) {
        const embed = new EmbedBuilder()
            .setColor(0x2a2a3e)
            .setDescription(
                targetUser.id === interaction.user.id
                    ? '❌ Tu n\'as pas encore d\'XP sur ce serveur. Envoie des messages pour commencer !'
                    : `❌ **${targetUser.displayName}** n'a pas encore d'XP sur ce serveur.`
            );
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    // Calculer le rang (position dans le leaderboard)
    const rank = await prisma.user.count({
        where: {
            guildId: interaction.guild.id,
            xpTotal: { gt: userData.xpTotal },
        },
    }) + 1;

    // Construire l'URL de l'avatar
    const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 256 });

    try {
        // Générer la rank card PNG
        const pngBuffer = await renderRankCard({
            username: targetUser.displayName,
            avatarUrl,
            rank,
            level: userData.level,
            xpCurrent: userData.xpCurrent,
            xpNext: userData.xpNext,
            xpTotal: userData.xpTotal,
        });

        const attachment = new AttachmentBuilder(pngBuffer, { name: 'rank-card.png' });

        await interaction.editReply({
            files: [attachment],
        });
    } catch (error) {
        console.error('Erreur lors du rendu de la rank card:', error);
        await interaction.editReply('❌ Une erreur est survenue lors de la génération de la carte de rang.');
    }
}
