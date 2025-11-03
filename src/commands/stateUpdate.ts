import {ChatInputCommandInteraction, InteractionContextType ,MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';
import {ReactionMapState} from "../state/reactionMapState";

export const data = new SlashCommandBuilder()
    .setName('reload')
    .setDescription("Met a jour l'état interne en récupérant les données depuis la base de donnée")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild);

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({flags: MessageFlags.Ephemeral});
    const reactionMapState = ReactionMapState.getInstance();
    await reactionMapState.load();
    await interaction.editReply({content : "État mis à jour avec succès."});
}