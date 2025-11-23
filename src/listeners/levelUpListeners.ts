import { prisma } from '../utils/prisma';
import {Client} from "discord.js";

type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;



export function setupLevelUpListeners(client : Client) {
    client.on('levelUp', async (user : User, newLevel: number ) => {
        if(!user) return;
        console.log(`Utilisateur ${user?.discordId} a atteint le niveau ${newLevel}`); // TODO : Message dans un channel spécifique ?

        const guild = await client.guilds.fetch(user.guildId);
        const member = await guild.members.fetch(user.discordId);

        //Récupération des rôles de l'utilisateur pour les exclure des rôles à ajouter
        const memberRoles = member.roles.cache.map(role => role.id);
        const rolesToAdd = await prisma.levelRole.findMany({
            where: {
                guildId: user.guildId,
                levelReq: { lte: newLevel },
                roleId: { notIn: memberRoles }
            }
        })

        if (rolesToAdd.length === 0) {
            console.log(`Aucun rôle à ajouter pour l'utilisateur ${user.discordId} au niveau ${newLevel}`);
            return;
        }

        for (const roles of rolesToAdd) {
            try {
                console.log(`Ajout du rôle ${roles.roleId} à l'utilisateur ${user.discordId}`); //TODO : Message dans un channel spécifique ?
                await member.roles.add(roles.roleId);
            }
            catch (error) {
                console.error(`Erreur lors de l'ajout du rôle ${roles.roleId} à l'utilisateur ${user.discordId}:`, error);
            }
        }



    });
}