import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    MessageFlags,
    GuildEmoji,
    PermissionFlagsBits, InteractionContextType,
} from "discord.js";
import { ReactionMapService } from "../services/ReactionMapService";

export const data = new SlashCommandBuilder()
    .setName("rr")
    .setDescription("Gérer les rôles de réaction")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
        sub
            .setName("add")
            .setDescription("Ajouter un rôle de réaction à un message")
            .addStringOption((o) =>
                o
                    .setName("emoji")
                    .setDescription("L'émoji à utiliser pour le rôle de réaction")
                    .setRequired(true)
            )
            .addRoleOption((o) =>
                o.setName("role").setDescription("Le rôle à attribuer").setRequired(true)
            )
            .addBooleanOption((o) =>
                o
                    .setName("removerole")
                    .setDescription(
                        "Retirer le rôle lorsque l'utilisateur retire sa réaction"
                    )
            )
            .addStringOption((o) =>
                o
                    .setName("messageid")
                    .setDescription("ID du message cible dans ce canal")
                    .setRequired(false)
            )
    );

function parseEmoji(input: string) {
    const match = input.match(/^<a?:\w+:(\d+)>$/);
    if (match) return { type: "custom" as const, id: match[1], raw: input };
    return { type: "unicode" as const, raw: input };
}

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() !== "add") return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
        if (!interaction.guild || !interaction.channel) {
            await interaction.editReply("Commande utilisable uniquement dans un salon de serveur.");
            return;
        }

        const messageId = interaction.options.getString("messageid") ?? undefined;
        const emojiInput = interaction.options.getString("emoji", true);
        const role = interaction.options.getRole("role", true);
        const removeOnUnreact = interaction.options.getBoolean("removerole") ?? true;

        const targetMessage = messageId
            ? await interaction.channel.messages.fetch(messageId).catch(() => null)
            : await interaction.channel.messages
                .fetch({ limit: 1 })
                .then((col) => col.first() ?? null)
                .catch(() => null);

        if (!targetMessage) {
            await interaction.editReply("Message introuvable dans ce canal.");
            return;
        }

        const parsed = parseEmoji(emojiInput);
        let reactToken = parsed.raw;

        if (parsed.type === "custom") {
            const emojiObj = interaction.guild.emojis.cache.get(parsed.id);
            if (!emojiObj) {
                await interaction.editReply("Émoji personnalisé indisponible dans ce serveur.");
                return;
            }
            reactToken = (emojiObj as GuildEmoji).toString();
        }

        // Vérification si la réaction existe déjà
        const existingReaction = targetMessage.reactions.cache.find((r) =>
            r.emoji.id ? r.emoji.id === parsed.id : r.emoji.name === parsed.raw
        );

        if (existingReaction) {
            await interaction.editReply("La réaction existe déjà sur ce message.");
            return;
        }

        await targetMessage.react(reactToken).catch(() => {
            throw new Error(
                "Échec de l'ajout de la réaction. Émoji invalide ou permissions manquantes."
            );
        });

        const reactionMapState = ReactionMapService.getInstance();
        await reactionMapState.addReactionMap(interaction.guildId!, {
            id: "",
            guildId: interaction.guildId!,
            messageId: targetMessage.id,
            emoji: parsed.raw,
            roleId: role.id,
            removeOnUnreact,
        });

        console.log(reactionMapState.getReactionMapsForGuild(interaction.guildId!));
        await interaction.editReply(
            `Rôle de réaction ajouté. Lien: https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${targetMessage.id}`
        );
    } catch (err) {
        await interaction.editReply(
            err instanceof Error
                ? `Erreur: ${err.message}`
                : "Une erreur est survenue lors de l'ajout du rôle de réaction."
        );
    }
}
