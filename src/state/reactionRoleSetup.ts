import {
    ContainerBuilder,
    RoleSelectMenuBuilder,
    MessageFlags
} from 'discord.js';

type RoleEntry = { emoji: string; roleId: string | null };

export type Setup = {
    ownerId: string
    guildId: string
    channelId: string
    targetMessageId: string
    setupMessageId: string
    roles: Record<string, RoleEntry>
}

// Stockage central des setups en cours (clé = setupMessageId)
const setups = new Map<string, Setup>();

const header = 'Réagissez au message pour rajouter des réaction roles :\n\n';

export function buildUi(setup: Setup): ContainerBuilder {
    const container = new ContainerBuilder().setAccentColor(0xff0000)
        .addTextDisplayComponents(text =>
            text.setContent(header)
        );

    Object.entries(setup.roles).forEach(([key, { emoji, roleId }]) => {
        const placeholder = roleId
            ? `${emoji} Rôle sélectionné : <@&${roleId}>`
            : `${emoji} Aucun rôle`;

        // texte descriptif (affiche l'émoji de façon persistante)
        const displayLine = roleId ? `${emoji}  ${key} — <@&${roleId}>\n` : `${emoji}  ${key}\n`;
        container.addTextDisplayComponents(text => text.setContent(displayLine));

        // utilise la forme callback attendue par addActionRowComponents
        container.addActionRowComponents(actionRow =>
            actionRow.setComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(key)
                    .setMinValues(0)
                    .setMaxValues(1)
                    .setPlaceholder(placeholder)
            )
        );
    });

    return container;
}

// Crée un setup si il n'existe pas encore. Ne réécrase pas un setup existant.
export function createSetup(setup: Setup) {
    if (!setup || !setup.setupMessageId) return null;
    if (setups.has(setup.setupMessageId)) {
        // merge shallow pour garder le setup existant si déjà présent
        const existing = setups.get(setup.setupMessageId)!;
        const merged: Setup = { ...existing, ...setup, roles: { ...existing.roles, ...setup.roles } };
        setups.set(setup.setupMessageId, merged);
        return merged;
    }
    setups.set(setup.setupMessageId, setup);
    return setup;
}

export function deleteSetup(setupMessageId: string) {
    return setups.delete(setupMessageId);
}

export function getSetupBySetupMessageId(setupMessageId: string) {
    return setups.get(setupMessageId) ?? null;
}

export function findSetupByTargetMessageId(targetMessageId: string) {
    for (const setup of setups.values()) {
        if (setup.targetMessageId === targetMessageId) return setup;
    }
    return null;
}

export function updateRoleForSetup(setupMessageId: string, key: string, roleId: string | null) {
    const setup = setups.get(setupMessageId);
    if (!setup) return null;
    if (!setup.roles[key]) return null;
    setup.roles[key].roleId = roleId;
    setups.set(setupMessageId, setup);
    return setup;
}

// Gérer une interaction de select (RoleSelect) : met à jour le state et édite le message de setup
export async function handleSelectInteraction(interaction: any) {
    const setupMessageId = interaction.message?.id;
    if (!setupMessageId) return;
    const setup = getSetupBySetupMessageId(setupMessageId);
    if (!setup) {
        // Si le setup n'existe pas, ne pas créer un setup vide automatiquement.
        // Renvoyer un message éphemère pour demander d'utiliser la commande de création de setup.
        try {
            if (!interaction.replied) {
                await interaction.reply({ content: 'Setup introuvable. Veuillez d\'abord créer le setup avec la commande appropriée.', ephemeral: true });
            }
        } catch (err) {
            console.error('Impossible d\'envoyer la réponse au select lorsque le setup est manquant:', err);
        }
        return;
    }

    const key = interaction.customId;
    const selected = (interaction.values && interaction.values.length > 0) ? interaction.values[0] : null;

    updateRoleForSetup(setupMessageId, key, selected);

    // Reconstruire le container et éditer le message
    const container = buildUi(setup);
    try {
        await interaction.message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
        await interaction.reply({ content: 'Configuration mise à jour.', ephemeral: true });
    } catch (error) {
        console.error('Erreur lors de l\'édition du message de setup :', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'Impossible de mettre à jour le setup.', ephemeral: true });
        }
    }
}
