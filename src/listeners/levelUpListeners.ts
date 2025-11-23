import { prisma } from '../utils/prisma';
import {Client} from "discord.js";

type User = Awaited<ReturnType<typeof prisma.user.findUnique>>;



export function setupLevelUpListeners(client : Client) {
    client.on('levelUp', (user : User, newLevel: number ) => {
        console.log(`Utilisateur ${user?.discordId} a atteint le niveau ${newLevel}`);
        //Todo ici implémenter l'envoi d'un message de félicitations dans un channel spécifique si besoin et les eventuelles récompenses de role
    });
}