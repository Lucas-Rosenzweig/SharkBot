import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, MessageFlags, InteractionContextType } from 'discord.js';
import { ConfigService } from '../services/ConfigService';
export const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Gestion de la configuration du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('Affiche la configuration actuelle du serveur'))
    .addSubcommand(subcommand => subcommand
    .setName('xp-cooldown')
    .setDescription('Définit le temps de recharge entre deux gains d\'XP (en secondes)')
    .addIntegerOption(option => option
    .setName('secondes')
    .setDescription('Nombre de secondes de cooldown')
    .setRequired(true)
    .setMinValue(1)))
    .addSubcommand(subcommand => subcommand
    .setName('xp-per-message')
    .setDescription('Définit le nombre d\'XP gagnés par message')
    .addIntegerOption(option => option
    .setName('xp')
    .setDescription('Nombre d\'XP par message')
    .setRequired(true)
    .setMinValue(1)))
    .addSubcommand(subcommand => subcommand
    .setName('xp-per-minute')
    .setDescription('Définit le nombre d\'XP gagnés par minute en vocal')
    .addIntegerOption(option => option
    .setName('xp')
    .setDescription('Nombre d\'XP par minute')
    .setRequired(true)
    .setMinValue(1)))
    .addSubcommand(subcommand => subcommand
    .setName('xp-channel')
    .setDescription('Définit le salon pour les notifications de level up')
    .addChannelOption(option => option
    .setName('channel')
    .setDescription('Le salon de notification (laisser vide pour désactiver)')
    .addChannelTypes(ChannelType.GuildText)
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('voice-xp-require-unmuted')
    .setDescription('Exiger que les utilisateurs ne soient pas mute/deaf serveur pour gagner de l\'XP vocal')
    .addBooleanOption(option => option
    .setName('activer')
    .setDescription('Activer ou désactiver cette condition')
    .setRequired(true)));
export async function execute(interaction) {
    if (!interaction.guildId) {
        await interaction.reply({
            content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }
    const subcommand = interaction.options.getSubcommand();
    // Pour la sous-commande list, on n'utilise pas ephemeral
    if (subcommand === 'list') {
        await interaction.deferReply();
    }
    else {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }
    const configService = ConfigService.getInstance();
    try {
        switch (subcommand) {
            case 'list': {
                const config = await configService.getConfigForGuild(interaction.guildId);
                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Configuration du serveur')
                    .setColor(0x5865F2)
                    .addFields({
                    name: '⏱️ Cooldown XP',
                    value: `${config.xpCooldown} secondes`,
                    inline: true
                }, {
                    name: '💬 XP par message',
                    value: `${config.xpPerMessage} XP`,
                    inline: true
                }, {
                    name: '🎤 XP par minute (vocal)',
                    value: `${config.xpPerMinute} XP`,
                    inline: true
                }, {
                    name: '📢 Salon de notifications',
                    value: config.xpChannelId ? `<#${config.xpChannelId}>` : 'Non défini (notifications désactivées)',
                    inline: false
                }, {
                    name: '🔇 XP vocal requiert non-mute',
                    value: config.voiceXpRequireUnmuted ? '✅ Activé' : '❌ Désactivé',
                    inline: true
                })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'xp-cooldown': {
                const seconds = interaction.options.getInteger('secondes', true);
                await configService.setXpCooldown(interaction.guildId, seconds);
                await interaction.editReply(`✅ Le cooldown XP a été défini à **${seconds} secondes**.`);
                break;
            }
            case 'xp-per-message': {
                const xp = interaction.options.getInteger('xp', true);
                await configService.setXpPerMessage(interaction.guildId, xp);
                await interaction.editReply(`✅ Le gain d'XP par message a été défini à **${xp} XP**.`);
                break;
            }
            case 'xp-per-minute': {
                const xp = interaction.options.getInteger('xp', true);
                await configService.setXpPerMinute(interaction.guildId, xp);
                await interaction.editReply(`✅ Le gain d'XP par minute en vocal a été défini à **${xp} XP**.`);
                break;
            }
            case 'xp-channel': {
                const channel = interaction.options.getChannel('channel');
                await configService.setXpChannelId(interaction.guildId, channel?.id || null);
                if (channel) {
                    await interaction.editReply(`✅ Le salon de notifications a été défini à ${channel}.`);
                }
                else {
                    await interaction.editReply(`✅ Les notifications de level up ont été désactivées.`);
                }
                break;
            }
            case 'voice-xp-require-unmuted': {
                const enabled = interaction.options.getBoolean('activer', true);
                await configService.setVoiceXpRequireUnmuted(interaction.guildId, enabled);
                await interaction.editReply(enabled
                    ? `✅ Les utilisateurs doivent maintenant **ne pas être mute/deaf serveur** pour gagner de l'XP en vocal.`
                    : `✅ Les utilisateurs **mute/deaf serveur** peuvent désormais gagner de l'XP en vocal.`);
                break;
            }
            default:
                await interaction.editReply('❌ Sous-commande inconnue.');
        }
    }
    catch (error) {
        console.error('Erreur lors de l\'exécution de la commande config:', error);
        await interaction.editReply('❌ Une erreur est survenue lors de l\'exécution de la commande.');
    }
}
