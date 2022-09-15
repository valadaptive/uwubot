import {REST} from '@discordjs/rest';
import {
    Routes,
    GatewayIntentBits,
    Client,
    RESTPostAPIApplicationCommandsJSONBody,
    SlashCommandBuilder,
    Interaction
} from 'discord.js';

import {readdir} from 'node:fs/promises';
import {fileURLToPath} from 'url';
import {join} from 'path';

import dotenv from 'dotenv';
dotenv.config();

type Command = {
    data: RESTPostAPIApplicationCommandsJSONBody | SlashCommandBuilder,
    command: (interaction: Interaction) => Promise<void>
};

const loadCommands = async (): Promise<Command[]> => {
    const commandsPath = fileURLToPath(new URL('commands', import.meta.url));
    const commandFiles = await readdir(commandsPath);

    const commandPromises = [];
    for (const commandFilename of commandFiles) {
        if (!commandFilename.endsWith('.js')) continue;
        const absoluteFile = join(commandsPath, commandFilename);
        commandPromises.push((import(absoluteFile) as Promise<{default: Command}>).then(m => m.default));
    }
    return Promise.all(commandPromises);
};

const main = async (): Promise<void> => {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error('No token provided');
    const clientId = process.env.CLIENT_ID;
    if (!clientId) throw new Error('No client ID provided');

    const rest = new REST({version: '9'}).setToken(token);

    const commands = await loadCommands();
    const commandMap: Partial<Record<string, Command>> = {};
    for (const commandInfo of commands) {
        commandMap[commandInfo.data.name] = commandInfo;
    }

    if (process.env.GUILD_ID) {
        // eslint-disable-next-line no-console
        console.log('Updating guild slash commands');
        await rest.put(
            Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
            {body: commands.map(cmd => cmd.data)}
        );
    } else {
        // eslint-disable-next-line no-console
        console.log('Updating global slash commands');
        await rest.put(
            Routes.applicationCommands(clientId),
            {body: commands.map(cmd => cmd.data)}
        );
    }

    // eslint-disable-next-line no-console
    console.log('Updated slash commands');

    const client = new Client({intents: [GatewayIntentBits.Guilds]});

    client.on('interactionCreate', async interaction => {
        let command;
        if (interaction.isChatInputCommand()) {
            command = commandMap[interaction.commandName];
        } else if ('customId' in interaction) {
            const idMatch = interaction.customId.match(/[^$]+/);
            if (idMatch) {
                command = commandMap[idMatch[0]];
            }
        }

        if (!command) {
            if (interaction.isChatInputCommand()) await interaction.reply('Command not found');
            return;
        }

        try {
            await command.command(interaction);
        } catch (err) {
            if ('update' in interaction) {
                await interaction.update(`Error running command: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    });

    await client.login(process.env.BOT_TOKEN);
    // eslint-disable-next-line no-console
    console.log('Logged in');
};

void main();
