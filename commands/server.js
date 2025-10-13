const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Affiche les informations sur le serveur.'),
    async execute(interaction) {
        await interaction.reply(`Nom du serveur: ${interaction.guild.name}\nNombre de membres: ${interaction.guild.memberCount}`);
    },
};

