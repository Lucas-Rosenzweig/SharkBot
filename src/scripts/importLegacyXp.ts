import { Client } from 'discord.js';
import { prisma } from '../utils/prisma';
import { getXpForNextLevel } from '../utils/addXpToUser';
import { createLogger } from '../utils/logger';

const logger = createLogger('ImportLegacyXP');

/**
 * Données XP de l'ancien système à importer.
 * Les entrées avec discordId sont directement reconnues (le username affiché était "User: <id>").
 * Les autres seront résolues via une recherche par username sur le serveur Discord.
 */
const LEGACY_DATA: { name: string; xp: number; level: number; discordId?: string }[] = [
    { name: 'malefique27',          xp: 53897, level: 27 },
    { name: 'slydenfox_0_61040',    xp: 36709, level: 23 },
    { name: 'riatna',               xp: 31179, level: 22 },
    { name: 'caroryz',              xp: 21213, level: 19 },
    { name: 'matt_0622_23795',      xp: 19609, level: 18 },
    { name: 'User: 756250835234848798', xp: 9723,  level: 13, discordId: '756250835234848798' },
    { name: 'User: 314101374478712833', xp: 7856,  level: 12, discordId: '314101374478712833' },
    { name: 'User: 331305164734726146', xp: 6672,  level: 11, discordId: '331305164734726146' },
    { name: 'xeit0w',               xp: 5684,  level: 10 },
    { name: 'juliadenis',           xp: 3011,  level: 8  },
    { name: 'dod05102',             xp: 1151,  level: 5  },
    { name: 'brontoblocusse666',    xp: 1004,  level: 4  },
    { name: 'mnnbe.',               xp: 644,   level: 3  },
    { name: 'fyerdoux',             xp: 108,   level: 1  },
    { name: 'chalun3',              xp: 46,    level: 0  },
    { name: 'User: 748254951851032597', xp: 16,    level: 0, discordId: '748254951851032597' },
];

/**
 * Nettoie un nom de la forme "pseudo_0_12345" ou "pseudo_12345" en "pseudo".
 * Utile pour les noms générés par certains anciens bots Discord.
 */
function cleanUsername(name: string): string {
    return name.replace(/(_[0-9]+)+$/, '').toLowerCase();
}

/**
 * Importe les données XP legacy dans la base de données.
 * Ce script s'exécute UNE SEULE FOIS au premier démarrage, puis ne fait plus rien.
 * Le flag d'exécution est stocké dans un fichier sentinel à la racine.
 */
export async function importLegacyXp(client: Client): Promise<void> {
    // ── Flag sentinel ─────────────────────────────────────────────────────────
    // On garde une trace en DB pour éviter de ré-importer à chaque redémarrage.
    // On réutilise la table Config avec un guildId sentinel spécial.
    const SENTINEL_KEY = '__legacy_xp_import_done__';
    const alreadyDone = await prisma.config.findUnique({
        where: { guildId: SENTINEL_KEY },
    });

    if (alreadyDone) {
        logger.info('Import XP legacy déjà effectué, passage.');
        return;
    }

    logger.info('Démarrage de l\'import XP legacy...');

    // ── Récupération de tous les guilds du bot ────────────────────────────────
    const guilds = await client.guilds.fetch();
    if (guilds.size === 0) {
        logger.warn('Aucun guild trouvé, import annulé.');
        return;
    }

    // On prend le premier guild (bot mono-serveur). 
    // Si ton bot est multi-serveur, adapte ici avec l'ID du bon serveur.
    const [guildId] = [...guilds.keys()];
    const guild = await client.guilds.fetch(guildId);

    logger.info({ guildId, guildName: guild.name }, 'Guild cible pour l\'import');

    // Fetch de TOUS les membres (nécessite l'intent GuildMembers)
    const members = await guild.members.fetch();
    logger.info({ count: members.size }, 'Membres Discord récupérés');

    let imported = 0;
    let skipped = 0;

    for (const entry of LEGACY_DATA) {
        let discordId = entry.discordId;
        let resolvedUsername = entry.name;

        // ── Résolution par username si pas d'ID direct ──────────────────────
        if (!discordId) {
            const searchTerm = cleanUsername(entry.name);

            const match = members.find(m =>
                m.user.username.toLowerCase().includes(searchTerm) ||
                (m.user.globalName?.toLowerCase().includes(searchTerm) ?? false) ||
                (m.nickname?.toLowerCase().includes(searchTerm) ?? false)
            );

            if (!match) {
                logger.warn({ name: entry.name }, 'Utilisateur introuvable sur le serveur, ignoré');
                skipped++;
                continue;
            }

            discordId = match.user.id;
            resolvedUsername = match.user.username;
            logger.info({ name: entry.name, discordId, resolvedUsername }, 'Utilisateur résolu');
        }

        // ── Upsert dans la DB ─────────────────────────────────────────────────
        // Migration one-shot : on écrase toujours avec les données legacy.
        const xpNext = getXpForNextLevel(entry.level);

        await prisma.user.upsert({
            where: { guildId_discordId: { guildId, discordId } },
            update: {
                xpTotal:  entry.xp,
                xpCurrent: 0,       // On repart de 0 dans le niveau actuel par sécurité
                level:    entry.level,
                xpNext,
                username: resolvedUsername,
            },
            create: {
                guildId,
                discordId,
                xpTotal:  entry.xp,
                xpCurrent: 0,
                level:    entry.level,
                xpNext,
                username: resolvedUsername,
            },
        });

        logger.info({ discordId, resolvedUsername, xp: entry.xp, level: entry.level }, '✅ Importé');
        imported++;
    }

    // ── Marquer l'import comme terminé ───────────────────────────────────────
    // On crée une Guild sentinel + une Config sentinel pour stocker le flag.
    await prisma.guild.upsert({
        where:  { id: SENTINEL_KEY },
        update: {},
        create: { id: SENTINEL_KEY, name: '__sentinel__' },
    });
    await prisma.config.create({
        data: { guildId: SENTINEL_KEY },
    });

    logger.info({ imported, skipped, total: LEGACY_DATA.length }, '🎉 Import XP legacy terminé !');
}
