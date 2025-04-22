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

// client.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./commands');
const { getLastProcessedGuid, saveLastProcessedGuid, getLastCircolare, formatItalianDate } = require('./circolare');
const { ensureValidAuthorizedUsersFile, getAuthorizedUsers } = require('./utils');
const { logMessage } = require('./logger');
const { sendMessageToAll, checkActiveGroups } = require('./invia');

const WELCOME_ENABLED = true;

const client = new Client({
    authStrategy: new LocalAuth(),
    // setup per UserLAnd
    // puppeteer: {
    //    executablePath: '/usr/bin/chromium',
    //    args: ['--no-sandbox', '--disable-setuid-sandbox']
    // }
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
        logMessage(`Admin autorizzati: ${admins.join(', ')}`);
        logMessage('Inizio controllo delle circolari.');
    }

    setInterval(async () => {
        const latest = await getLastCircolare();
        if (!latest) return;

        const currentGuid = getLastProcessedGuid();
        const latestGuid = latest.guid || latest.id || latest.link;

        if (latestGuid !== currentGuid) {
            saveLastProcessedGuid(latestGuid);
            logMessage(`Nuova circolare trovata: ${latest.title}`);

            const formattedDate = formatItalianDate(latest.pubDate || latest.isoDate || 'Data sconosciuta');
            const message = `Nuova circolare pubblicata! 📢\n\n*Data*: ${formattedDate}\n*Titolo*: ${latest.title}\n\n> Leggi la circolare completa: ${latest.link}`;

            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup);

            await sendMessageToAll(client, groups, message);
        } else {
            logMessage(`Nessuna nuova circolare trovata.`);
        }
    }, 15000);
});

if (WELCOME_ENABLED) {
    client.on('group_join', async (notification) => {
        try {
            const botId = client.info.wid._serialized;

            if (notification.recipientIds.includes(botId)) {
                const chat = await client.getChatById(notification.id.remote);
                logMessage(`Il bot è stato aggiunto nel gruppo: ${chat.name}`);

                const latestCircolare = await getLastCircolare();
                if (latestCircolare) {
                    await sendWelcomeMessageWithCircolare(chat, latestCircolare);
                }
            }
        } catch (error) {
            logMessage(`Errore durante l'invio del messaggio di benvenuto: ${error.message}`);
        }
    });

    async function sendWelcomeMessageWithCircolare(chat, circolare) {
        const formattedDate = formatItalianDate(circolare.pubDate);
        const welcomeMessage = `Ciao a tutti i partecipanti del gruppo ${chat.name}! 🎉\nSono TorriBot, un chatbot che fornirà aggiornamenti sulle circolari della scuola.\n\nEcco l'ultima circolare 📢:\n\n*Data*: ${formattedDate}\n*Titolo*: ${circolare.title}\n\n> Leggi la circolare completa: ${circolare.link}`;
        
        await chat.sendMessage(welcomeMessage);
        logMessage(`Messaggio di benvenuto con circolare inviato al gruppo: ${chat.name}`);
    }
}

client.on('message', (msg) => handleMessage(client, msg));
client.initialize();