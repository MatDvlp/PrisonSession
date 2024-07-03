const axios = require('axios');
const config = require('./config.json');
const chalk = require('chalk');
const Table = require('cli-table3');
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')

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

/*
 * Class
 */

class SessionManager {
    constructor(filePath) {
        this.filePath = path.resolve(filePath);
    }

    readFile() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Erreur lors de la lecture du fichier : ${err}`);
            return {};
        }
    }

    writeFile(data) {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error(`Une erreur est survenue : ${err}`);
        }
    }

    createSession(sessionId, pseudo, date, duration, token, rc, items, itemAverage, blocks) {
        const sessions = this.readFile();
        sessions[sessionId] = {
            "name": pseudo,
            "date": date,
            "duration": duration,
            "token": token,
            "rc": rc,
            "items": {
                "itemGenerate": items,
                "blocksBrokenPerItems": itemAverage
            },
            "blocks": blocks,
        };
        this.writeFile(sessions);
    }

    deleteSession(sessionId) {
        const sessions = this.readFile();
        if (sessions[sessionId]) {
            delete sessions[sessionId];
            this.writeFile(sessions);
        } else {
        }
    }

    getSession(sessionId) {
        const sessions = this.readFile();
        if (sessions[sessionId]) {
            return sessions[sessionId];
        } else {
            return null;
        }
    }
}

console.log(chalk.hex("AD4CF5")("\n" +
    "__________         .__                         .____                     __                   \n" +
    "\\______   \\_______ |__|  ______ ____    ____   |    |     ____    ____  |  | __  ____ _______ \n" +
    " |     ___/\\_  __ \\|  | /  ___//  _ \\  /    \\  |    |    /  _ \\ _/ ___\\ |  |/ /_/ __ \\\\_  __ \\\n" +
    " |    |     |  | \\/|  | \\___ \\(  <_> )|   |  \\ |    |___(  <_> )\\  \\___ |    < \\  ___/ |  | \\/\n" +
    " |____|     |__|   |__|/____  >\\____/ |___|  / |_______ \\\\____/  \\___  >|__|_ \\ \\___  >|__|   \n" +
    "                            \\/             \\/          \\/            \\/      \\/     \\/        \n"))

console.log(chalk.hex("F5944C").bold(`Génération de l'identifiant de votre session...`));
const sessionId = uuidv4()
const creationDate = Date.now()
const sessionManager = new SessionManager('./sessions/sessions.json')
sessionManager.createSession(sessionId, config.pseudo, creationDate, "0", "0", "0", "0", "0", "0")
console.log(chalk.hex("6BF54C")(`[+] L'identifiant a été généré avec succès : ${sessionId} !`))
console.log(chalk.bold("Affichage de vos statistiques dans une minute, merci de patienter."))
const { exec } = require('child_process');

let startRc;
let startTokens;
let startItemsDropped;
let startBlockMined;
let startKeys;

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

        startRc = prisonPlayerData.data.stats[8].value == "9223372036848424000"
            ? prisonPlayerData.data.currencies[0].amount
            : prisonPlayerData.data.stats[8].value;
        startTokens = prisonPlayerData.data.stats[7].value;
        startItemsDropped = prisonPlayerData.data.stats[9].value;
        startBlockMined = prisonPlayerData.data.stats[3].value
        startKeys = {
            "lunaire": prisonPlayerData.data.keys.LUNAIRE ?? 0,
            "astral": prisonPlayerData.data.keys.ASTRAL ?? 0,
            "nebuleux":  prisonPlayerData.data.keys.NEBULEUSE ?? 0
        }

    } catch (error) {
        console.error(chalk.red("Erreur lors de la récupération des données initiales :"), error);
    }
}

async function main() {
    console.clear();
    console.log(chalk.hex("AD4CF5")("\n" +
        "__________         .__                         .____                     __                   \n" +
        "\\______   \\_______ |__|  ______ ____    ____   |    |     ____    ____  |  | __  ____ _______ \n" +
        " |     ___/\\_  __ \\|  | /  ___//  _ \\  /    \\  |    |    /  _ \\ _/ ___\\ |  |/ /_/ __ \\\\_  __ \\\n" +
        " |    |     |  | \\/|  | \\___ \\(  <_> )|   |  \\ |    |___(  <_> )\\  \\___ |    < \\  ___/ |  | \\/\n" +
        " |____|     |__|   |__|/____  >\\____/ |___|  / |_______ \\\\____/  \\___  >|__|_ \\ \\___  >|__|   \n" +
        "                            \\/             \\/          \\/            \\/      \\/     \\/        \n"))
    try {
        const prisonPlayerData = await axios({
            url: `https://api.rinaorc.com/prison/${config.pseudo}`,
            method: 'GET',
            headers: {
                'API-Key': config['api-token']
            }
        });

        /*
         * Time manager
         */
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime - scriptStartTime) / 1000);
        const elapsedMinutes = Math.floor(elapsedTime / 60);
        const elapsedSeconds = elapsedTime % 60;

        /*
         * Ressources
         */
        const generateRc = prisonPlayerData.data.stats[8].value == "9223372036848424000"
            ? prisonPlayerData.data.currencies[0].amount - startRc
            : prisonPlayerData.data.stats[8].value - startRc;
        const generateTokens = prisonPlayerData.data.stats[7].value - startTokens;
        const minedBlocks = prisonPlayerData.data.stats[3].value - startBlockMined

        /*
         * Scanner proc
         */
        const generateItems = prisonPlayerData.data.stats[9].value - startItemsDropped;
        let itemAverage;
        if (generateItems > 0 && !isNaN(minedBlocks)) {
            itemAverage = minedBlocks / generateItems
        } else {
            itemAverage =  0
        }

        /*
         * Keys
         */
        const generateKeys = {
            "lunaire": (prisonPlayerData.data.keys.LUNAIRE ?? 0) - startKeys.lunaire,
            "astral": (prisonPlayerData.data.keys.ASTRAL ?? 0) - startKeys.astral,
            "nebuleux": (prisonPlayerData.data.keys.NEBULEUSE ?? 0) - startKeys.nebuleux
        }
        const totalKeysGenerated = Object.values(generateKeys).reduce((sum, value) => sum + value, 0);
        const keysNotSavedDetected = (prisonPlayerData.data.keys.LUNAIRE ?? 0) < startKeys.lunaire ||
            (prisonPlayerData.data.keys.ASTRAL ?? 0) < startKeys.astral ||
            (prisonPlayerData.data.keys.NEBULEUSE ?? 0) < startKeys.nebuleux;

        let averageKeys;
        if (totalKeysGenerated > 0 && !isNaN(minedBlocks)) {
            averageKeys = {
                perBlocks: minedBlocks / totalKeysGenerated
            };
        } else {
            averageKeys = {
                perBlocks: 0
            };
        }

        const firstTable = new Table({
            head: ['Temps écoulé', 'Blocs minés', 'RC générés', 'Tokens générés', 'Items proc'],
            colWidths: [20, 20, 20, 30],
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

        firstTable.push([
            `${elapsedMinutes}m ${elapsedSeconds}s`,
            formatNumber(minedBlocks),
            formatNumber(generateRc),
            formatNumber(generateTokens),
            `${formatNumber(generateItems)} | ` +
            (itemAverage !== 0
                ? `${chalk.hex("edaaf8")(`1 proc / ${formatNumber(Math.round(itemAverage))} blocks`)}`
                : `${chalk.hex("edaaf8")(`Aucune valeur`)}`)
        ]);

        const secondTable = new Table({
            head: ['Clef Lunaire', 'Clef Astrale', 'Clef nébuleuse', 'Total'],
            colWidths: [20, 20, 20, 30],
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

        console.log(chalk.hex("F062BB")(`Session de ${config.pseudo} - UUID: ${sessionId}`));
        console.log(`\n`)
        console.log(firstTable.toString());

        if (config.module.keys) {
            if(!keysNotSavedDetected) {
                secondTable.push([
                    generateKeys.lunaire,
                    generateKeys.astral,
                    generateKeys.nebuleux,
                    `${Object.values(generateKeys).reduce((sum, value) => sum + value, 0)} | ` +
                    (averageKeys.perBlocks !== 0
                        ? `${chalk.hex("edaaf8")(`1 keys / ${formatNumber(Math.round(averageKeys.perBlocks))} blocks`)}`
                        : `${chalk.hex("edaaf8")(`Aucune valeur`)}`)
                ]);
                console.log(secondTable.toString());
            } else {
                console.log(chalk.white("\n" + chalk.hex("f78891")(`Nous avons détecté que vous n'économisiez pas vos keys, il est impossible d'utiliser cette fonction sans garder ses keys. Merci de relancer une session si vous souhaitez économiser vos keys.`)))
            }
        }

        sessionManager.deleteSession(sessionId)
        sessionManager.createSession(sessionId, config.pseudo, creationDate, elapsedMinutes, generateTokens, generateRc, generateItems, itemAverage, minedBlocks)
    } catch (error) {
        console.error(chalk.red("Erreur lors de la récupération des données :"), error);
    }

    console.log("\n")
    progressBar(60)
}

async function startMonitoring() {
    await axiosPing();
    setInterval(main, 60000);
}

function showQuestionPopup(message, callback) {
    const command = `powershell -command "Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show('${message}', 'Sauvegarde de vos statistiques', 'YesNo', 'Question')"`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de l'affichage de la pop-up: ${error}`);
            callback(false);
            return;
        }
        const response = stdout.trim();
        callback(response === 'Yes');
    });
}

process.on('SIGINT', () => {
    showQuestionPopup('Voulez-vous sauvegarder cette session ? Cela vous permettra de pouvoir comparer vos statistiques dans le futur.', (response) => {
        response ? null : sessionManager.deleteSession(sessionId);
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    showQuestionPopup('Voulez-vous sauvegarder cette session ? Cela vous permettra de pouvoir comparer vos statistiques dans le futur.', (response) => {
        response ? null : sessionManager.deleteSession(sessionId);
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red("Une exception non gérée a été détectée :"), error);
    showQuestionPopup('Voulez-vous sauvegarder cette session ? Cela vous permettra de pouvoir comparer vos statistiques dans le futur.', (response) => {
        response ? null : sessionManager.deleteSession(sessionId);
        process.exit(1);
    });
});

startMonitoring();