/*
* MIT License
*
* Copyright © 2025 Xazitya 
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*
* https://github.com/root-xazitya
*/ 

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { format } = require('date-fns');
const { it } = require('date-fns/locale');
// const AUTHORIZED_USERS_FILE = path.join(baseDir, 'data', 'authorized_users.json');


//Licenza MIT
const license = `
/*
* MIT License
*
* Copyright © 2025 Xazitya
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*
* https://github.com/root-xazitya
*/
`

// user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function logBuilderMessage(message) {
    try {
        // i logs si trovano una directory prima di src
        const baseDir = path.join(__dirname, '..');
        const logsDir = path.join(baseDir, 'logs');
        const logPath = path.join(logsDir, 'logs.txt');
        const timestamp = format(new Date(), 'HH:mm:ss dd-MM-yyyy', { locale: it });
        const fullMessage = `[${timestamp}] ${message}\n`;

        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
        fs.appendFileSync(logPath, fullMessage);
        console.log(message);
    } catch (err) {
        console.error('Errore durante la scrittura nel log:', err.message);
    }
}

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

//restituisce true se title contiene la parola "circolare"
function isValidCircolareTitle(title) {
    const regex = /circolare\s*(n\.\s*\d+|[Nn]\s*\d+|[A-Za-z0-9-]+)\s*/i;
    return regex.test(title);
}

async function analyzeFeedContent(content) {
    // controlla se è un feed RSS
    if (content.includes('<item>')) {
        const items = content.match(/<item>[\s\S]*?<\/item>/g);
        if (!items) return "invalid";

        //controlla se almeno un item contiene la parola circolare
        const hasValid = items.some(item => {
            const titleMatch = item.match(/<title>(.*?)<\/title>/);
            return titleMatch && isValidCircolareTitle(titleMatch[1]);
        });

        return hasValid ? "valid" : "invalid";

        // se contiene <entry>, è un feed atom
    } else if (content.includes('<entry>')) {
        return "atom";
    }

    // restituito quando il feed non è ne RSS ne atom
    return "not a valid feed";
}

async function isRssFeed(url) {
    try {
        // richiesta Http
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/rss+xml',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const contentType = response.headers['content-type']; //es. application/rss+xml
        const content = response.data;

        if (contentType.includes('xml') || contentType.includes('rss+xml')) {
            if (content.includes('<rss') || content.includes('<channel>')) {
                return await analyzeFeedContent(content);
            }

        //controlla se è atom    
        } else if (contentType.includes('atom+xml')) {
            if (content.includes('<feed') && content.includes('<entry>')) {
                return "atom";
            }
        }
        return null;
    } catch {
        return null;
    }
}

function normalizzaUrl(url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}

function writeFile(fileName, content) {
    const filePath = path.join(__dirname, fileName);

    // se il file esiste lo cancella
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logBuilderMessage(`[−] ${fileName} eliminato.`);
    }

    // scrive il nuovo contenuto
    fs.writeFileSync(filePath, content.trim());
    logBuilderMessage(`[✓] ${fileName} generato.`);
}

/* funzione per costruire circolare.js
*  l'{url} (del feed RSS) è dinamico
*/
async function buildCircolareFile(url) {
    const content = `
// circolare.js
const Parser = require('rss-parser');
const parser = new Parser();
const path = require('path');
const fs = require('fs');

const sitoUrl = '${url}';
const baseDir = path.join(__dirname, '..');
const dataDir = path.join(baseDir, 'data');

async function getLastCircolare() {
    try {
        const feed = await parser.parseURL(sitoUrl);
        const item = feed.items[0];
        if (!item) return null;
        item.guid = item.guid || item.id || item.link;
        return item;
    } catch (error) {
        console.log('Errore durante la lettura del feed RSS:', error.message);
        return null;
    }
}

function getLastProcessedGuid() {
    const filePath = path.join(dataDir, 'last_processed.json');
    if (!fs.existsSync(filePath)) return null;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        return parsed.guid || null;
    } catch {
        return null;
    }
}

function saveLastProcessedGuid(guid) {
    const filePath = path.join(dataDir, 'last_processed.json');
    const content = { guid };
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

function formatItalianDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const italianMonths = {
        "January": "Gennaio", "February": "Febbraio", "March": "Marzo", "April": "Aprile",
        "May": "Maggio", "June": "Giugno", "July": "Luglio", "August": "Agosto",
        "September": "Settembre", "October": "Ottobre", "November": "Novembre", "December": "Dicembre"
    };

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    const monthInItalian = italianMonths[formattedDate.split(' ')[1]] || formattedDate.split(' ')[1];
    return formattedDate.replace(formattedDate.split(' ')[1], monthInItalian);
}

module.exports = {
    getLastCircolare,
    getLastProcessedGuid,
    saveLastProcessedGuid,
    formatItalianDate
};`;
    writeFile('circolare.js', license + content);
}

/* funzione per costruire client.js
*  il sistema operativo {osConfig} e il {delay} delle circolari sono dinamici
*/

async function buildClientFile(osConfig, delay, welcomeEnabled, botName) {
    // logBuilderMessage(`[DEBUG] buildClientFile chiamato con delay = ${delay}`);

    const content = `
// client.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./commands');
const { getLastProcessedGuid, saveLastProcessedGuid, getLastCircolare, formatItalianDate } = require('./circolare');
const { ensureValidAuthorizedUsersFile, getAuthorizedUsers } = require('./utils');
const { logMessage } = require('./logger');
const { sendMessageToAll, checkActiveGroups } = require('./invia');

const WELCOME_ENABLED = ${welcomeEnabled};
const BOT_NAME = '${botName}';

const client = new Client({
    authStrategy: new LocalAuth(),
    ${osConfig}
});

client.on('qr', (qr) => {
    logMessage('Scansiona il codice QR con WhatsApp');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    logMessage("Il bot si è collegato con successo all'account WhatsApp.");
    ensureValidAuthorizedUsersFile();

    const admins = getAuthorizedUsers();
    if (admins.length === 0) {
        logMessage("⚠️ Nessun numero admin presente in 'authorized_users.json'.");
    } else {
        logMessage(\`Admin autorizzati: \${admins.join(', ')}\`);
        logMessage(\'Inizio controllo delle circolari.\');
    }

    setInterval(async () => {
        const latest = await getLastCircolare();
        if (!latest) return;

        const currentGuid = getLastProcessedGuid();
        const latestGuid = latest.guid || latest.id || latest.link;

        if (latestGuid !== currentGuid) {
            saveLastProcessedGuid(latestGuid);
            logMessage(\`Nuova circolare trovata: \${latest.title}\`);

            const formattedDate = formatItalianDate(latest.pubDate || latest.isoDate || 'Data sconosciuta');
            const message = \`Nuova circolare pubblicata! 📢\\n\\n*Data*: \${formattedDate}\\n*Titolo*: \${latest.title}\\n\\n> Leggi la circolare completa: \${latest.link}\`;

            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup);

            await sendMessageToAll(client, groups, message);
        } else {
            logMessage(\`Nessuna nuova circolare trovata.\`);
        }
    }, ${delay});
});

if (WELCOME_ENABLED) {
    client.on('group_join', async (notification) => {
        try {
            const botId = client.info.wid._serialized;

            if (notification.recipientIds.includes(botId)) {
                const chat = await client.getChatById(notification.id.remote);
                logMessage(\`Il bot è stato aggiunto nel gruppo: \${chat.name}\`);

                const latestCircolare = await getLastCircolare();
                if (latestCircolare) {
                    await sendWelcomeMessageWithCircolare(chat, latestCircolare);
                }
            }
        } catch (error) {
            logMessage(\`Errore durante l'invio del messaggio di benvenuto: \${error.message}\`);
        }
    });

    async function sendWelcomeMessageWithCircolare(chat, circolare) {
        const formattedDate = formatItalianDate(circolare.pubDate);
        const welcomeMessage = \`Ciao a tutti i partecipanti del gruppo \${chat.name}! 🎉\\nSono \${BOT_NAME}, un chatbot che fornirà aggiornamenti sulle circolari della scuola.\\n\\nEcco l'ultima circolare 📢:\\n\\n*Data*: \${formattedDate}\\n*Titolo*: \${circolare.title}\\n\\n> Leggi la circolare completa: \${circolare.link}\`;
        
        await chat.sendMessage(welcomeMessage);
        logMessage(\`Messaggio di benvenuto con circolare inviato al gruppo: \${chat.name}\`);
    }
}

client.on('message', (msg) => handleMessage(client, msg));
client.initialize();
`;

    writeFile('client.js', license + content);
}


// funzione per costruire i file statici (mancanti o diversi)
function buildStaticFiles() {
    const files = {

// ---- INIZIO COSTRUZIONE DI invia.js ----

        'auth.js': `
// auth.js
const fs = require('fs');
const path = require('path');

function isUserAuthorized(userId) {
    const filePath = path.join(__dirname, '..', 'data', 'authorized_users.json');
    if (!fs.existsSync(filePath)) return false;
    const users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return users.includes(userId);
}

module.exports = { isUserAuthorized };`,

// ---- INIZIO COSTRUZIONE DI invia.js ----

        'invia.js': `
// invia.js
const { logMessage } = require('./logger'); // Usa il logger personalizzato

//  invia un messaggio a tutti i gruppi validi
async function sendMessageToAll(client, groups, message) {
    if (!groups || groups.length === 0) {
        logMessage('Nessun gruppo valido trovato per inviare il messaggio.');
        return;
    }

    await Promise.all(groups.map(group =>
        client.sendMessage(group.id._serialized, message)
    ));

    const groupNames = groups.map(group => group.name).join(", ");
    logMessage(\`Invio circolare ai gruppi: \${groupNames}\`);
}

module.exports = {
    sendMessageToAll
};

`,

// ---- INIZIO COSTRUZIONE DI commands.js ----

        'commands.js': `
// commands.js
const { getAuthorizedUsers, addAuthorizedUser, removeAuthorizedUser } = require('./utils');
const { logMessage, getLastLogLines } = require('./logger');
const { getLastCircolare, formatItalianDate } = require('./circolare');
const { sendMessageToAll, getGroupList } = require('./invia');

async function handleMessage(client, message) {
    const authorizedUsers = getAuthorizedUsers();
    const chat = await message.getChat();
    // workaround per message.getContact() / Client.getContactById che
    // attualmente rotto a causa dei cambi di API interni di WhatsApp Web.
    const fromId = message.from || '';
    const senderNumber = fromId.split('@')[0] || '';
    const senderName = "Sconosciuto";
    const senderInfo = \`\${senderName} - \${senderNumber}\`;
    const senderNumberOnly = senderNumber.replace(/\\D/g, '');
    const isAdmin = authorizedUsers.includes(senderNumberOnly);

    logMessage(\`Messaggio ricevuto da \${senderInfo} (\${message.from}) - Admin: \${isAdmin}\`);
    if (!isAdmin) return;

    const command = message.body.trim().toLowerCase();

    if (command.startsWith('!log')) {
        const parts = message.body.split(' ');
        let linesToFetch = 10;
        if (parts.length > 1 && !isNaN(parts[1])) {
            linesToFetch = parseInt(parts[1], 10);
        }
        const logs = getLastLogLines(linesToFetch);
        await message.reply(\`Ultime \${linesToFetch} linee di log:\n\n\${logs}\`);
        logMessage(\`Inviato log a \${senderInfo}\`);
    }

    if (command === '!ping') {
        await message.reply('Online');
        logMessage(\`Comando !ping eseguito da \${senderInfo}\`);
    }

    if (command.startsWith('!sendall')) {
        const msgContent = message.body.replace('!sendall', '').trim();
        if (msgContent) {
            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup && chat.name);
            await sendMessageToAll(client, groups, msgContent);
            logMessage(\`Comando !sendall eseguito da \${senderInfo}. Messaggio: "\${msgContent}"\`);
        } else {
            logMessage(\`Comando !sendall ricevuto da \${senderInfo} senza messaggio.\`);
        }
    }

    if (command === '!latest') {
        const latestCircolare = await getLastCircolare();
        if (latestCircolare) {
            const formattedDate = formatItalianDate(latestCircolare.pubDate);
            const latestMessage = \`Ultima circolare 📢:\n\n*Data*: \${formattedDate}\n*Titolo*: \${latestCircolare.title}\n\n> Leggi la circolare completa: \${latestCircolare.link}\`;
            await message.reply(latestMessage);
            logMessage(\`Comando !latest eseguito da \${senderInfo}\`);
        } else {
            await message.reply('Nessuna circolare disponibile.');
        }
    }

    if (command.startsWith('!admin add')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
            const numberRaw = parts[2].startsWith('@') ? parts[2].slice(1) : parts[2]; // rimuove la chiocciola se presente
            const numberToAdd = numberRaw.replace(/\\D/g, '');
            if (numberToAdd) {
                const added = addAuthorizedUser(numberToAdd);
                if (added) {
                    await message.reply(\`✅ Numero \${numberToAdd} aggiunto agli admin.\`);
                    logMessage(\`Admin aggiunto: \${numberToAdd} da \${senderInfo}\`);
                } else {
                    await message.reply(\`⚠️ Il numero \${numberToAdd} è già presente tra gli admin.\`);
                }
            } else {
                await message.reply('⚠️ Numero non valido.');
            }
        } else {
            await message.reply('❌ Uso corretto: !admin add <numero>');
        }
    }

    if (command.startsWith('!admin remove')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
            const numberRaw = parts[2].startsWith('@') ? parts[2].slice(1) : parts[2]; // rimuove la chiocciola se presente
            const numberToRemove = numberRaw.replace(/\D/g, '');
            if (numberToRemove) {
                if (numberToRemove === senderNumberOnly) {
                    await message.reply('⚠️ Non puoi rimuovere te stesso dagli admin.');
                    return;
                }
    
                const removed = removeAuthorizedUser(numberToRemove);
                if (removed) {
                    await message.reply(\`✅ Numero \${numberToRemove} rimosso dagli admin.\`);
                    logMessage(\`Admin rimosso: \${numberToRemove} da \${senderInfo}\`);
                } else {
                    await message.reply(\`⚠️ Il numero \${numberToRemove} non è presente tra gli admin.\`);
                }
            } else {
                await message.reply(\'⚠️ Numero non valido.\');
            }
        } else {
            await message.reply(\'❌ Uso corretto: !admin remove <numero>\');
        }
    }    

    if (command === '!admin list') {
        const admins = getAuthorizedUsers();
        if (admins.length > 0) {
            const adminList = admins.map(num => \`• \${num}\`).join(\`\\n\`);
            await message.reply(\`👑 Lista admin:\\n\\n\${adminList}\`);
        } else {
            await message.reply('⚠️ Nessun admin configurato.');
        }
    }

    // if (command === '!groups') {
    //     const groupNames = await getGroupList(client);
    //     if (groupNames.length > 0) {
    //         const groupList = groupNames.map(name => \`• \${name}\`).join(\`\\n\`);
    //         await message.reply(\`Lista gruppi:\\n\\n\${groupList}\`);
    //     } else {
    //         await message.reply(\`⚠️ Nessun gruppo trovato.\`);
    //     }
    // }
}

module.exports = { handleMessage };
`,


// ---- INIZIO COSTRUZIONE DI logger.js ----

        'logger.js': `
// logger.js
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { it } = require('date-fns/locale');

const baseDir = path.join(__dirname, '..');
const logsDir = path.join(baseDir, 'logs');
const LOG_FILE = path.join(logsDir, 'logs.txt');

function logMessage(message) {
    const timestamp = format(new Date(), 'dd-MM-yyyy HH:mm:ss', { locale: it });
    const logEntry = \`[\${timestamp}] \${message}\`;
    console.log(logEntry);

    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.appendFileSync(LOG_FILE, \`\${logEntry}\\n\`);
}

function getLastLogLines(linesToFetch = 10) {
    if (fs.existsSync(LOG_FILE)) {
        const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\\n').filter(Boolean);
        return lines.slice(-linesToFetch).join('\\n');
    }
    return 'Nessun log disponibile.';
}

module.exports = {
    logMessage,
    getLastLogLines
};
`,
// ---- INIZIO COSTRUZIONE DI utils.js ----

        'utils.js': `
// utils.js
const fs = require('fs');
const path = require('path');
const { logMessage } = require('./logger');

// percorso del file nella cartella data (una directory sopra src)
const baseDir = path.join(__dirname, '..');
const AUTHORIZED_USERS_FILE = path.join(baseDir, 'data', 'authorized_users.json');

function getAuthorizedUsers() {
    if (fs.existsSync(AUTHORIZED_USERS_FILE)) {
        try {
            const data = fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.authorizedNumbers || [];
        } catch (error) {
            logMessage(\`Errore nel parsing di \${AUTHORIZED_USERS_FILE}: \${error.message}\`);
            return [];
        }
    } else {
        logMessage(\`File \${AUTHORIZED_USERS_FILE} non trovato. Nessun utente autorizzato configurato.\`);
        return [];
    }
}

function ensureValidAuthorizedUsersFile() {
    if (!fs.existsSync(AUTHORIZED_USERS_FILE)) {
        const defaultContent = { authorizedNumbers: [] };
        fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(defaultContent, null, 2));
        logMessage(\`File \${AUTHORIZED_USERS_FILE} creato con contenuto vuoto.\`);
    } else {
        try {
            const content = fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8');
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed.authorizedNumbers)) {
                throw new Error("Campo 'authorizedNumbers' non è un array.");
            }
        } catch (error) {
            logMessage(\`File \${AUTHORIZED_USERS_FILE} corrotto, verrà ripristinato. Errore: \${error.message}\`);
            const defaultContent = { authorizedNumbers: [] };
            fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(defaultContent, null, 2));
        }
    }
}

function addAuthorizedUser(number) {
    const data = fs.existsSync(AUTHORIZED_USERS_FILE)
        ? JSON.parse(fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8'))
        : { authorizedNumbers: [] };

    const cleanedNumber = number.replace(/\D/g, '');

    if (!data.authorizedNumbers.includes(cleanedNumber)) {
        data.authorizedNumbers.push(cleanedNumber);
        fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(data, null, 2));
        logMessage(\`Numero \${cleanedNumber} aggiunto agli admin.\`);
        return true;
    }
    return false;
}

function removeAuthorizedUser(number) {
    const data = fs.existsSync(AUTHORIZED_USERS_FILE)
        ? JSON.parse(fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8'))
        : { authorizedNumbers: [] };

    const cleanedNumber = number.replace(/\D/g, '');
    const index = data.authorizedNumbers.indexOf(cleanedNumber);

    if (index !== -1) {
        data.authorizedNumbers.splice(index, 1);
        fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(data, null, 2));
        logMessage(\`Numero \${cleanedNumber} rimosso dagli admin.\`);
        return true;
    }
    return false;
}

module.exports = {
    getAuthorizedUsers,
    ensureValidAuthorizedUsersFile,
    addAuthorizedUser,
    removeAuthorizedUser
};
`
    };

    for (const [file, content] of Object.entries(files)) {
        writeFile(file, license + content);
    }
}

// funzione per aggiungere un numero in authorized_users.json (che si trova fuori da src)
function addAdminToAuthorizedUsers(adminNumber) {
    const baseDir = path.join(__dirname, '..');
    const AUTHORIZED_USERS_FILE = path.join(baseDir, 'data', 'authorized_users.json');
    const data = fs.existsSync(AUTHORIZED_USERS_FILE)
        ? JSON.parse(fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8'))
        : { authorizedNumbers: [] };

    const cleanedNumber = adminNumber.replace(/\D/g, '');

    if (!data.authorizedNumbers.includes(cleanedNumber)) {
        data.authorizedNumbers.push(cleanedNumber);
        fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(data, null, 2));
        logBuilderMessage(`${cleanedNumber} aggiunto agli admin.`);
        return true;
    }
    return false;
}
async function buildFile() {
    console.log("Copyright © 2025 Xazitya (MIT License)\n");

    // -inizio configurazione interattiva del bot con cli-


    // -- 1) FEED URL --
    let rawUrl = await askQuestion("Inserire URL del sito istituzionale (es: liceo.edu.it): ");
    if (!rawUrl.startsWith('http')) rawUrl = 'https://' + rawUrl;

    //aggiunge www.
    if (!rawUrl.includes('www.')) rawUrl = rawUrl.replace('https://', 'https://www.');
    let url = normalizzaUrl(rawUrl);
    if (!rawUrl.includes('www.')) {
        rawUrl = rawUrl.replace('https://', 'https://www.');
    }
    
    // lista dei feed più comuni    
    const possibleFeeds = [
        `${url}/rss/`,
        `${url}/rss/comunicati`,
        `${url}/comunicati/rss`,
        `${url}/feed/rss`,
        `${url}/rss/feed`,
        `${url}/feed/circolari.rss`,
        `${url}/feed?view=comunicati`,
        `${url}/rss/avvisi`
    ];

    logBuilderMessage('[!] Il feed RSS è necessario per controllare le circolari.');
    logBuilderMessage('\nVerifica automatica dei feed RSS in corso...');
    
    let selectedFeed = null;

    for (const feed of possibleFeeds) {
        const result = await isRssFeed(feed);
        if (result === 'valid') {
            logBuilderMessage(`Feed valido trovato: ${feed}\n`);
            selectedFeed = feed;
            break;
        } else if (result === 'invalid') {
            logBuilderMessage(`[!] Feed RSS trovato ma non sembra valido: ${feed}`);
            const proceed = await askQuestion("[!] Vuoi comunque usarlo (potrebbe non funzionare)? (y/n): ");
            if (proceed.toLowerCase() === 'y') {
                selectedFeed = feed;
                logBuilderMessage("[✓] Il feed verrà usato per controllare le circolari."); 
                break;
            }
        } else if (result === 'atom') {
            logBuilderMessage(`[!] Trovato feed RSS Atom (non supportato direttamente): ${feed}`); //per adesso
        }
    }

    if (!selectedFeed) {
        logBuilderMessage('[!] Nessun feed RSS valido trovato. Per maggiori informazioni:');
		logBuilderMessage('https://github.com/root-xazitya/circolari-bot-whatsapp?tab=readme-ov-file#supporto');
        rl.close();
        return;
    }

    // -- 2) DISPOSITIVO --
    const osChoice = await askQuestion("Piattaforma deploy (1 = Windows/Linux, 2 = Android): ");
    const osConfig = osChoice.trim() === '2'
        ? `puppeteer: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-setuid-sandbox'] },`
        : `\// setup per UserLAnd\n    \// puppeteer: {\n    \//    executablePath: '/usr/bin/chromium',\n    \//    args: ['--no-sandbox', '--disable-setuid-sandbox']\n    \// }`;

    // -- 3) DELAY --
    const delayInput = await askQuestion("Inserire il delay (in ms) per controllare il feed (default 30000ms): ");
    const delay = delayInput && !isNaN(delayInput) ? parseInt(delayInput) : 30000; // 30 secondi

    // -- 4) ADMIN --
    logBuilderMessage('[!] Solo gli admin potranno usare i comandi del bot.');
    const adminNumber = await askQuestion("Inserisci il numero dell'admin (es: +39 388 123 4567 -> 39388123567): ");

    const baseDir = path.join(__dirname, '..');
    const dataDir = path.join(baseDir, 'data');
    const authorizedUsersPath = path.join(dataDir, 'authorized_users.json');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
        //[debug]
        // logBuilderMessage('[−] authorized_users.json eliminato.');
    }

    if (fs.existsSync(authorizedUsersPath)) {
        fs.unlinkSync(authorizedUsersPath);
        //[debug]
        // logBuilderMessage('[−] authorized_users.json eliminato.');
    }

    const initialData = { authorizedNumbers: [] };
    fs.writeFileSync(authorizedUsersPath, JSON.stringify(initialData, null, 2));
    // [debug]
    // logBuilderMessage('[✓] authorized_users.json creato.');

    await addAdminToAuthorizedUsers(adminNumber);
    // aggiunge il numero inserito in authorized_users.json, che si trova in: circolari-bot-whatsapp > data 


    // -- 5) WELCOME MESSAGE --
    logBuilderMessage('Il messaggio di benvenuto include anche l\'ultima circolare trovata.');
    const welcomeEnabledAnswer = await askQuestion("Vuoi attivare il messaggio di benvenuto se il bot entra in un gruppo? (s/n): ");
    const welcomeEnabled = welcomeEnabledAnswer.trim().toLowerCase() === 's';

    // -- 6) BOT NAME --
    let botName = "Il bot della scuola"; // di default
    if (welcomeEnabled) {
        botName = await askQuestion("Come vuoi chiamare il bot? (default: Il bot della scuola): ");
        if (!botName.trim()) {
            botName = "Il bot della scuola";
        }
    }

    // -- INIZIO COSTRUZIONE --
    logBuilderMessage("\nInizio costruzione con le seguenti impostazioni: ");
    logBuilderMessage(`[FEED]     ${selectedFeed}`);
    logBuilderMessage(`[DEVICE]   ${osChoice.trim() === '2' ? 'UserLAnd' : 'Windows/Linux'}`);
    logBuilderMessage(`[DELAY]    ${delay}ms`);
    logBuilderMessage(`[WELCOME]  ${welcomeEnabled ? 'Attivo' : 'Disattivo'}`);
    logBuilderMessage(`[BOT NAME] ${botName}\n`);

    //delay di 2 secondi per guardare le impostazioni
    await new Promise(resolve => setTimeout(resolve, 2000))

    // const baseDir = path.join(__dirname, '..');
    if (!fs.existsSync(path.join(baseDir, 'data'))) fs.mkdirSync(path.join(baseDir, 'data'));
    if (!fs.existsSync(path.join(baseDir, 'logs'))) fs.mkdirSync(path.join(baseDir, 'logs'));

    await buildCircolareFile(selectedFeed);
    await buildClientFile(osConfig, delay, welcomeEnabled, botName);

    buildStaticFiles();
    
    logBuilderMessage('\nCostruzione completata\n');
    logBuilderMessage('Prova ad avviare il bot con \'npm start\'');
	logBuilderMessage('(se invece sei su Android segui la guida per avviarlo)');
    rl.close();
}

buildFile();
