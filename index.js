const axios = require('axios');
const config = require('./config.json');
const chalk = require('chalk');
const Table = require('cli-table3');

function formatNumber(number) {
    if (number === undefined || number === null) return 'N/A';

    const thresholds = [
        { value: 1e15, suffix: 'Q' },
        { value: 1e12, suffix: 'T' },
        { value: 1e9, suffix: 'B' },
        { value: 1e6, suffix: 'M' },
        { value: 1e3, suffix: 'k' }
    ];

    for (const threshold of thresholds) {
        if (number >= threshold.value) {
            return (number / threshold.value).toFixed(1) + threshold.suffix;
        }
    }

    return number.toString();
}

function progressBar(durationInSeconds) {
    const totalSeconds = durationInSeconds;
    let currentSecond = 0;

    const progressBarLength = 40;
    const interval = 1000;

    const progressBarChar = '█';
    const emptyBarChar = '░';

    function drawProgressBar(percent) {
        const filledLength = Math.round(progressBarLength * (percent / 100));
        const emptyLength = progressBarLength - filledLength;
        const progressBar = progressBarChar.repeat(filledLength) + emptyBarChar.repeat(emptyLength);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Mise à jour... [${progressBar}] ${percent}%`);
    }

    const progressInterval = setInterval(() => {
        currentSecond++;
        const percent = Math.round((currentSecond / totalSeconds) * 100);
        drawProgressBar(percent);

        if (currentSecond >= totalSeconds) {
            clearInterval(progressInterval);
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
    }, interval);

    drawProgressBar(0);
}

console.log(chalk.magenta("\n" +
    "__________         .__                         .____                     __                   \n" +
    "\\______   \\_______ |__|  ______ ____    ____   |    |     ____    ____  |  | __  ____ _______ \n" +
    " |     ___/\\_  __ \\|  | /  ___//  _ \\  /    \\  |    |    /  _ \\ _/ ___\\ |  |/ /_/ __ \\\\_  __ \\\n" +
    " |    |     |  | \\/|  | \\___ \\(  <_> )|   |  \\ |    |___(  <_> )\\  \\___ |    < \\  ___/ |  | \\/\n" +
    " |____|     |__|   |__|/____  >\\____/ |___|  / |_______ \\\\____/  \\___  >|__|_ \\ \\___  >|__|   \n" +
    "                            \\/             \\/          \\/            \\/      \\/     \\/        \n"))

console.log(chalk.bold("Affichage de vos statistiques dans une minute, merci de patienter."))
let startRc;
let startTokens;
let startItemsDropped;
let startBlockMined;

const scriptStartTime = new Date();

async function axiosPing() {
    try {
        const prisonPlayerData = await axios({
            url: `https://api.rinaorc.com/prison/${config.pseudo}`,
            method: 'GET',
            headers: {
                'API-Key': config['api-token']
            }
        });

        startRc = prisonPlayerData.data.stats[8].value;
        startTokens = prisonPlayerData.data.stats[7].value;
        startItemsDropped = prisonPlayerData.data.stats[9].value;
        startBlockMined = prisonPlayerData.data.stats[3].value

    } catch (error) {
        console.error(chalk.red("Erreur lors de la récupération des données initiales :"), error);
    }
}

async function main() {
    console.clear();
    console.log(chalk.magenta("\n" +
        "__________        .__                         .____                  __                 \n" +
        "\\______   \\_______|__| __________   ____      |    |    ____   ____ |  | __ ___________ \n" +
        " |     ___/\\_  __ \\  |/  ___/  _ \\ /    \\     |    |   /  _ \\_/ ___\\|  |/ // __ \\_  __ \\\n" +
        " |    |     |  | \\/  |\\___ (  <_> )   |  \\    |    |__(  <_> )  \\___|    <\\  ___/|  | \\/\n" +
        " |____|     |__|  |__/____  >____/|___|  /    |_______ \\____/ \\___  >__|_ \\\\___  >__|   \n" +
        "                          \\/           \\/             \\/          \\/     \\/    \\/       \n"))
    try {
        const prisonPlayerData = await axios({
            url: `https://api.rinaorc.com/prison/${config.pseudo}`,
            method: 'GET',
            headers: {
                'API-Key': config['api-token']
            }
        });

        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime - scriptStartTime) / 1000);
        const elapsedMinutes = Math.floor(elapsedTime / 60);
        const elapsedSeconds = elapsedTime % 60;

        const generateRc = prisonPlayerData.data.stats[8].value - startRc;
        const generateTokens = prisonPlayerData.data.stats[7].value - startTokens;
        const generateItems = prisonPlayerData.data.stats[9].value - startItemsDropped;
        const minedBlocks = prisonPlayerData.data.stats[3].value - startBlockMined

       /*  console.log(chalk.blue("Mise à jour des statistiques de votre session"));
        console.log(`RC généré: ${formatNumber(generateRc)}`);
        console.log(`Tokens générés: ${formatNumber(generateTokens)}`);
        console.log(`Items proc: ${formatNumber(generateItems)}`); */
        const table = new Table({
            head: ['Temps écoulé', 'Blocs minés', 'RC générés', 'Tokens générés', 'Items proc'],
            colWidths: [20, 20, 20, 20],
            chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
                , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
                , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
                , 'right': '║' , 'right-mid': '╢' , 'middle': '│' },
            style: {
                head: ['magenta'],
                border: [],
                compact: false
            }
        });

        // Ajouter une ligne au tableau avec les données actuelles
        table.push([
            `${elapsedMinutes}m ${elapsedSeconds}s`,
            formatNumber(minedBlocks),
            formatNumber(generateRc),
            formatNumber(generateTokens),
            formatNumber(generateItems)
        ]);

        console.log(chalk.bold(`Statistiques de la session de minage de ${config.pseudo}:`));
        console.log(table.toString());
    } catch (error) {
        console.error(chalk.red("Erreur lors de la récupération des données :"), error);
    }

    progressBar(60)
}

async function startMonitoring() {
    await axiosPing();
    setInterval(main, 60000);
}

startMonitoring();