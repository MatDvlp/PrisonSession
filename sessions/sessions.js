const chalk = require('chalk');
const Table = require('cli-table3');
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


console.log(chalk.hex("AD4CF5")("\n" +
    "__________         .__                         .____                     __                   \n" +
    "\\______   \\_______ |__|  ______ ____    ____   |    |     ____    ____  |  | __  ____ _______ \n" +
    " |     ___/\\_  __ \\|  | /  ___//  _ \\  /    \\  |    |    /  _ \\ _/ ___\\ |  |/ /_/ __ \\\\_  __ \\\n" +
    " |    |     |  | \\/|  | \\___ \\(  <_> )|   |  \\ |    |___(  <_> )\\  \\___ |    < \\  ___/ |  | \\/\n" +
    " |____|     |__|   |__|/____  >\\____/ |___|  / |_______ \\\\____/  \\___  >|__|_ \\ \\___  >|__|   \n" +
    "                            \\/             \\/          \\/            \\/      \\/     \\/        \n"))

console.log(chalk.hex("F5944C").bold(`Vérification des séances de minage...`));

const filePath = path.join(__dirname, 'sessions.json');

function readFile() {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Erreur lors de la lecture du fichier : ${err}`);
        return {};
    }
}

function writeFile(data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error(`Erreur lors de l'écriture dans le fichier : ${err}`);
    }
}

const jsonData = readFile();

let count = 0;
let oldCount = 0;
for (const id in jsonData) {
    count++
    if (jsonData[id].duration === 0 || jsonData[id].duration === "0") {
        oldCount++
        delete jsonData[id];
        console.log(chalk.hex("f78891")(`Suppression de ${id} - Durée inférieur à une minute`))
    } else if (jsonData[id].blocks === 0 || jsonData[id].blocks === "0") {
        oldCount++
        delete jsonData[id];
        console.log(chalk.hex("f78891")(`Suppression de ${id} - Aucun blocks minés`))
    }
}

console.log(chalk.hex("6BF54C")(`[+] Vous avez ${count - oldCount} sessions de minage ! \n`))
console.log(chalk.hex("F062BB")(`Voici la moyenne de toutes vos séances de minages: `));

function calculateAverages(data) {
    const sums = {};
    const counts = {};

    for (const id in data) {
        const session = data[id];

        for (const key in session) {
            if (typeof session[key] === 'number') {
                if (!sums[key]) {
                    sums[key] = 0;
                    counts[key] = 0;
                }

                sums[key] += session[key];
                counts[key] += 1;
            } else if (typeof session[key] === 'object' && session[key] !== null) {
                for (const subKey in session[key]) {
                    if (typeof session[key][subKey] === 'number') {
                        const compositeKey = `${key}.${subKey}`;
                        if (!sums[compositeKey]) {
                            sums[compositeKey] = 0;
                            counts[compositeKey] = 0;
                        }
                        sums[compositeKey] += session[key][subKey];
                        counts[compositeKey] += 1;
                    }
                }
            }
        }
    }

    const averages = {};
    for (const key in sums) {
        averages[key] = Math.round(sums[key] / counts[key])
    }

    return averages;
}
const averages = calculateAverages(jsonData);

const averageTable = new Table({
    head: ['Durée (minute)', 'Blocs minés', 'RC générés', 'Tokens générés', 'Items proc'],
    colWidths: [20, 20, 20, 20, 30],
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

writeFile(jsonData);

averageTable.push([
    averages.duration,
    formatNumber(averages.blocks),
    formatNumber(averages.rc),
    formatNumber(averages.token),
    averages['items.itemGenerate']  + " | " + `${chalk.hex("edaaf8")(`1 item / ${formatNumber(Math.round(averages['items.blocksBrokenPerItems']))} blocks`)}`,
])

console.log(averageTable.toString() + "\n")

console.log(chalk.hex("F062BB")(`Voici toutes vos séances de minage de la plus récente à la plus ancienne: `));

const sessionTable = new Table({
    head: ['Date de la session', 'Durée', 'Tokens générés', 'RC générés', 'Blocs minés', 'Items proc'],
    colWidths: [25, 10, 20, 20, 20, 30],
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

const miningSessions = require('./sessions.json')
const sortedSessions = Object.values(miningSessions).sort((a, b) => b.date - a.date);

for (const session of sortedSessions) {
    const startTime = new Date(session.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const duration = session.duration;
    const tokensGenerated = formatNumber(session.token);
    const rcGenerated = formatNumber(session.rc);
    const blocksMined = formatNumber(session.blocks);
    const itemsGenerated = session.items.itemGenerate;
    const blocksPerItem = Math.round(session.items.blocksBrokenPerItems);

    sessionTable.push([
        startTime,
        duration + `m`,
        tokensGenerated,
        rcGenerated,
        blocksMined,
        `${itemsGenerated} | ${chalk.hex("edaaf8")(`1 item / ${blocksPerItem} blocks`)}`
    ]);
}

console.log(sessionTable.toString());

