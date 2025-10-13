const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Affiche les informations sur un utilisateur.'),
    async execute(interaction) {
        await interaction.reply(`Commande exécutée par ${interaction.user.tag}, qui a rejoint le ${interaction.member.joinedAt}.`);
    },
};

