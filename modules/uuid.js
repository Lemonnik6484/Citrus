const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');

module.exports = {
    name: "uuid",

    slash: {
        data: new SlashCommandBuilder()
            .setName('uuid')
            .setDescription('Generates random UUID'),

        async execute(interaction) {
            const value = crypto.randomUUID();
            await interaction.reply(`UUID: \`${value}\``);
        }
    }
};