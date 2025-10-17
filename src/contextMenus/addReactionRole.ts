import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    MessageContextMenuCommandInteraction,
    Message,
    ContainerBuilder,
    MessageFlags
} from 'discord.js';
import { buildUi, createSetup, Setup } from "../state/reactionRoleSetup";

export const data = new ContextMenuCommandBuilder()
    .setName('Créer reaction-role')
    .setType(ApplicationCommandType.Message);

const EMOJI_WAIT_TIME = 300_000; // 5 minutes


async function deleteMessageSafely(message: Message): Promise<boolean> {
    try {
        await message.delete();
        return true;
    } catch (error) {
        console.error('✗ Erreur lors de la suppression du message:', error);
        return false;
    }
}

export async function execute(interaction: MessageContextMenuCommandInteraction) {
    const targetMessage = interaction.options.getMessage('message') || interaction.targetMessage;

    const setup: Setup = {
        ownerId: interaction.user.id,
        guildId: interaction.guildId!,
        channelId: interaction.channelId,
        targetMessageId: targetMessage?.id ?? '',
        setupMessageId: '',
        roles: {}
    }

    const container: ContainerBuilder = buildUi(setup as any);

    // Répondre à l'interaction et récupérer le message envoyé (fetchReply)
    const sent = await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        fetchReply: true,
    }) as any;

    // stocker le setup avec l'ID du message de setup réel
    setup.setupMessageId = sent.id;
    createSetup(setup);
}
