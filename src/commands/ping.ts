import {SlashCommandBuilder, Interaction} from 'discord.js';

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Pings the bot');

const command = async (interaction: Interaction): Promise<void> => {
    if (interaction.isChatInputCommand()) {
        await interaction.reply(`Pong! (${Date.now() - interaction.createdTimestamp}ms)`);
    }
};

export default {data, command};
