import {SlashCommandBuilder, Interaction} from 'discord.js';
import markovData from '../markov.json' assert { type: 'json' };

/**
 * Generates a random integer between two values.
 * @param min Minimum integer (inclusive)
 * @param max Maximum integer (exclusive)
 * @returns A random integer between [min, max)
 */
const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min)) + min;
};

const {catnonsense, keysmash, scrunkly} = markovData;

type MarkovData = {
    table: {
        choices: {
            nextNgram: number,
            nextChar: string,
            cumulativeProbability: number
        }[],
        totalProbability: number
    }[],
    ngrams: string[]
};

const generateMarkov = (table: MarkovData, numChars: number, initNgram: number): string => {
    let result = table.ngrams[initNgram];
    let ngramIndex = initNgram;
    for (let i = 0; i < numChars; i++) {
        const ngram = table.table[ngramIndex];
        const random = randomInt(0, ngram.totalProbability);
        for (let j = 0; j < ngram.choices.length; j++) {
            const choice = ngram.choices[j];
            if (random < choice.cumulativeProbability) {
                ngramIndex = choice.nextNgram;
                result += choice.nextChar;
                break;
            }
        }
    }

    return result;
};

const actions = [
    '\\*tilts head\\*',
    '\\*twitches ears slightly\\*',
    '\\*purrs\\*',
    '\\*falls asleep\\*',
    '\\*sits on ur keyboard\\*',
    '\\*nuzzles\\*',
    '\\*stares at u\\*',
    '\\*points towards case of monster zero ultra\\*',
    '\\*sneezes\\*',
    '\\*plays with yarn\\*',
    '\\*eats all ur doritos\\*',
    '\\*lies down on a random surfac\\e*'
];

const NUM_OPS = 10;
const generateMore = (state: {prevOp?: number}, remainingLength: number): string => {
    let random;
    if (typeof state.prevOp === 'number') {
        // don't repeat previous op
        random = randomInt(0, NUM_OPS - 1);
        if (random >= state.prevOp) random++;
    } else {
        random = randomInt(0, NUM_OPS - 1);
    }

    state.prevOp = random;

    switch (random) {
        case 0: return 'uwu';
        case 1: return generateMarkov(
            catnonsense,
            Math.min(randomInt(25, 150), remainingLength - 3),
            7 /* mr */
        ) + 'nya';
        case 2: return 'ny' + 'a'.repeat(randomInt(1, 8));
        case 3: return `>${'/'.repeat(randomInt(3, 7))}<`;
        case 4: return ':3';
        case 5: return actions[Math.floor(Math.random() * actions.length)];
        case 6: return generateMarkov(
            keysmash,
            Math.min(randomInt(25, 150), remainingLength),
            randomInt(0, keysmash.ngrams.length)
        );
        case 7: return 'A'.repeat(randomInt(5, 17));
        case 8: return generateMarkov(
            scrunkly,
            Math.min(randomInt(25, 100), remainingLength),
            37 /* aw */
        );
        case 9: return 'uwu';
        default: throw new Error(`Unhandled op ${random}`);
    }
};

const data = new SlashCommandBuilder()
    .setName('uwu')
    .setDescription('Generates catgirl nonsense')
    .addIntegerOption(option => option
        .setName('length')
        .setDescription('The length of the catgirl nonsense')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(2000));

const command = async (interaction: Interaction): Promise<void> => {
    if (interaction.isChatInputCommand()) {
        let length = interaction.options.get('length')?.value;
        if (typeof length !== 'number') {
            length = 250;
        }
        let result = '';
        const state = {};
        while (result.length < length) {
            result += generateMore(state, length - result.length - 1) + ' ';
        }
        await interaction.reply(result.slice(0, 2000));
    }
};

export default {data, command};
