import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    Message
} from 'discord.js';

export const data = new ContextMenuCommandBuilder()
    .setName('Créer reaction-role')
    .setType(ApplicationCommandType.Message);

const EMOJI_WAIT_TIME = 30_000; // 30 secondes

async function waitForUserEmoji(interaction: MessageContextMenuCommandInteraction): Promise<Message | null> {
    if (!interaction.channel || !('awaitMessages' in interaction.channel)) {
        console.error('✗ Channel invalide pour attendre des messages');
        return null;
    }

    const filter = (m: Message) => m.author.id === interaction.user.id;

    try {
        const collected = await interaction.channel.awaitMessages({
            filter,
            max: 1,
            time: EMOJI_WAIT_TIME,
            errors: ['time']
        });

        return collected.first() || null;
    } catch (error) {
        return null;
    }
}

async function deleteMessageSafely(message: Message): Promise<boolean> {
    try {
        await message.delete();
        console.log('✓ Message supprimé avec succès');
        return true;
    } catch (error) {
        console.error('✗ Erreur lors de la suppression du message:', error);
        return false;
    }
}

export async function execute(interaction: MessageContextMenuCommandInteraction) {
    await interaction.reply({
        content: 'Envoie l\'emoji à associer dans les 30 secondes.',
        flags: MessageFlags.Ephemeral
    });

    const emojiMessage = await waitForUserEmoji(interaction);
    if (!emojiMessage) {
        await interaction.editReply({
            content: '⏳ Temps écoulé. Veuillez réessayer.'
        });
        return;
    }

    await deleteMessageSafely(emojiMessage);

    await interaction.editReply({
        content: `✅ Emoji reçu: ${emojiMessage.content}`
    });
}
