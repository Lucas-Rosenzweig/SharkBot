import {Message} from "discord.js";
import {prisma} from "../utils/prisma";

function getXpForNextLevel(level: number): number {
    return 5 * (level ** 2) + 50 * level + 100;
}

export const name = 'messageCreate';

export async function execute(message: Message) {
    if (message.author.bot) return; // Skip bot messages
    if (!message.guild) return; // Skip DMs

    const user = await prisma.user.upsert({
        where: {discordId: message.author.id},
        create: {discordId: message.author.id, guildId: message.guild.id},
        update: {},
        include: { guild: true }
    });

    const now = Date.now();
    const cooldownMs = user.guild.xpCooldown * 1000;
    const lastMessageTime = user.lastMessage ? user.lastMessage.getTime() : 0;

    //Maintenant on met a jour l'xp de l'utilisateur si son dernier message date de plus de 20 secondes
    if(!user.lastMessage || (now - lastMessageTime) >= cooldownMs) {
        //Calcul de l'xp totale et de l'xp pour le niveau suivant
        let xpForNextLevel = getXpForNextLevel(user.level);
        const newXpTotal = user.xpTotal + user.guild.xpPerMessage;

        //Mise a jour de current xp et level up si besoin
        let newLevel = user.level;
        let newXpCurrent = user.xpCurrent + user.guild.xpPerMessage;
        while(newXpCurrent >= xpForNextLevel) { //Permet de gérer le cas où on gagne plusieurs niveaux d'un coup
            console.log(newXpCurrent+" >= "+xpForNextLevel+"passage au level "+(newLevel+1));
            newXpCurrent -= xpForNextLevel;
            newLevel += 1;
            //Si le joueur doit level up une deuxième fois, on recalcule l'xp pour le niveau suivant
            if(newXpCurrent >= xpForNextLevel) xpForNextLevel = getXpForNextLevel(newLevel);
            //Emit un événement de level up ici coté node
            message.client.emit('levelUp',user, newLevel);
        }

        await prisma.user.update({
            where: {discordId: message.author.id},
            data: {
                level: newLevel,
                xpTotal: newXpTotal,
                xpCurrent: newXpCurrent,
                xpNext: getXpForNextLevel(newLevel),
                lastMessage: new Date(now)
            }
        });
        console.log(`Updated XP for user ${message.author.tag} (${message.author.id}): Level ${newLevel}, XP ${newXpCurrent}/${getXpForNextLevel(newLevel)}`);
    }
}