import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    MessageFlags,
    PermissionFlagsBits,
    InteractionContextType,
} from "discord.js";
import { prisma } from "../utils/prisma";
import { createLogger } from "../utils/logger";

const logger = createLogger('LevelRoleCommand');

export const data = new SlashCommandBuilder()
    .setName("levelrole")
    .setDescription("Gérer les rôles de niveau")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
        sub
            .setName("add")
            .setDescription("Ajouter un rôle a l'obtention d'un niveau")
            .addIntegerOption((o) =>
                o.setName("level").setDescription("Le niveau requis pour obtenir le rôle").setRequired(true)
            )
            .addRoleOption((o) =>
                o.setName("role").setDescription("Le rôle à attribuer").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("remove")
            .setDescription("Retirer un rôle de niveau")
            .addRoleOption((o) =>
                o.setName("role").setDescription("Le rôle à retirer").setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub.setName("list").setDescription("Lister les rôles de niveau configurés")
    );

async function handleAddLevelRole(interaction: ChatInputCommandInteraction): Promise<void> {
    const level = interaction.options.getInteger("level", true);
    const role = interaction.options.getRole("role", true);

    const existing = await prisma.levelRole.findFirst({
        where: { guildId: interaction.guild!.id, roleId: role.id },
    });

    if (existing) {
        await interaction.editReply(`Le rôle ${role.name} est déjà attribué au niveau ${existing.levelReq}.`);
        return;
    }

    await prisma.levelRole.create({
        data: { guildId: interaction.guild!.id, roleId: role.id, levelReq: level },
    });

    logger.info({ guildId: interaction.guild!.id, roleId: role.id, level }, 'Level role added');
    await interaction.editReply(`Le rôle ${role.name} sera désormais attribué aux utilisateurs atteignant le niveau ${level}.`);
}

async function handleRemoveLevelRole(interaction: ChatInputCommandInteraction): Promise<void> {
    const role = interaction.options.getRole("role", true);

    await prisma.levelRole.deleteMany({
        where: { guildId: interaction.guild!.id, roleId: role.id },
    });

    logger.info({ guildId: interaction.guild!.id, roleId: role.id }, 'Level role removed');
    await interaction.editReply(`Le rôle ${role.name} ne sera plus attribué en fonction du niveau.`);
}

async function handleListLevelRoles(interaction: ChatInputCommandInteraction): Promise<void> {
    const levelRoles = await prisma.levelRole.findMany({
        where: { guildId: interaction.guild!.id },
    });

    if (levelRoles.length === 0) {
        await interaction.editReply("Aucun rôle de niveau configuré pour ce serveur.");
        return;
    }

    let reply = "Rôles de niveau configurés:\n";
    for (const lr of levelRoles) {
        const role = await interaction.guild!.roles.fetch(lr.roleId);
        if (role) {
            reply += `Niveau ${lr.levelReq} : ${role.name}\n`;
        }
    }

    await interaction.editReply(reply);
}

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Single guild guard for all subcommands
    if (!interaction.guild) {
        await interaction.editReply("Commande utilisable uniquement dans un serveur.");
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case "add":
                await handleAddLevelRole(interaction);
                break;
            case "remove":
                await handleRemoveLevelRole(interaction);
                break;
            case "list":
                await handleListLevelRoles(interaction);
                break;
            default:
                await interaction.editReply("Sous-commande inconnue.");
                break;
        }
    } catch (error) {
        logger.error({ error }, 'Level role command failed');
        await interaction.editReply("Une erreur est survenue lors de l'exécution de la commande.");
    }
}
