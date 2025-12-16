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

// commands.js
const { getAuthorizedUsers, addAuthorizedUser, removeAuthorizedUser } = require('./utils');
const { logMessage, getLastLogLines } = require('./logger');
const { getLastCircolare, formatItalianDate } = require('./circolare');
const { sendMessageToAll, getGroupList } = require('./invia');

async function handleMessage(client, message) {
    const authorizedUsers = getAuthorizedUsers();
    const chat = await message.getChat();

    // workaround per message.getContact() e Client.getContactById 
    // attualmente rotto a causa dei cambi di API interni di whatsapp
    const fromId = message.from || '';
    const senderNumber = fromId.split('@')[0] || '';
    const senderName = "Sconosciuto";
    const senderInfo = `${senderName} - ${senderNumber}`;
    const senderNumberOnly = senderNumber.replace(/\D/g, '');
    const isAdmin = authorizedUsers.includes(senderNumberOnly);

    logMessage(`Messaggio ricevuto da ${senderInfo} (${message.from}) - Admin: ${isAdmin}`);
    if (!isAdmin) return;

    const command = message.body.trim().toLowerCase();

    if (command.startsWith('!log')) {
        const parts = message.body.split(' ');
        let linesToFetch = 10;
        if (parts.length > 1 && !isNaN(parts[1])) {
            linesToFetch = parseInt(parts[1], 10);
        }
        const logs = getLastLogLines(linesToFetch);
        await message.reply(`Ultime ${linesToFetch} linee di log:

${logs}`);
        logMessage(`Inviato log a ${senderInfo}`);
    }

    if (command === '!ping') {
        await message.reply('Online');
        logMessage(`Comando !ping eseguito da ${senderInfo}`);
    }

    if (command.startsWith('!sendall')) {
        const msgContent = message.body.replace('!sendall', '').trim();
        if (msgContent) {
            const chats = await client.getChats();
            const groups = chats.filter(chat => chat.isGroup && chat.name);
            await sendMessageToAll(client, groups, msgContent);
            logMessage(`Comando !sendall eseguito da ${senderInfo}. Messaggio: "${msgContent}"`);
        } else {
            logMessage(`Comando !sendall ricevuto da ${senderInfo} senza messaggio.`);
        }
    }

    if (command === '!latest') {
        const latestCircolare = await getLastCircolare();
        if (latestCircolare) {
            const formattedDate = formatItalianDate(latestCircolare.pubDate);
            const latestMessage = `Ultima circolare 📢:

*Data*: ${formattedDate}
*Titolo*: ${latestCircolare.title}

> Leggi la circolare completa: ${latestCircolare.link}`;
            await message.reply(latestMessage);
            logMessage(`Comando !latest eseguito da ${senderInfo}`);
        } else {
            await message.reply('Nessuna circolare disponibile.');
        }
    }

    if (command.startsWith('!admin add')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
            const numberRaw = parts[2].startsWith('@') ? parts[2].slice(1) : parts[2]; // rimuove la chiocciola se presente
            const numberToAdd = numberRaw.replace(/\D/g, '');
            if (numberToAdd) {
                const added = addAuthorizedUser(numberToAdd);
                if (added) {
                    await message.reply(`✅ Numero ${numberToAdd} aggiunto agli admin.`);
                    logMessage(`Admin aggiunto: ${numberToAdd} da ${senderInfo}`);
                } else {
                    await message.reply(`⚠️ Il numero ${numberToAdd} è già presente tra gli admin.`);
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
                    await message.reply(`✅ Numero ${numberToRemove} rimosso dagli admin.`);
                    logMessage(`Admin rimosso: ${numberToRemove} da ${senderInfo}`);
                } else {
                    await message.reply(`⚠️ Il numero ${numberToRemove} non è presente tra gli admin.`);
                }
            } else {
                await message.reply('⚠️ Numero non valido.');
            }
        } else {
            await message.reply('❌ Uso corretto: !admin remove <numero>');
        }
    }    

    if (command === '!admin list') {
        const admins = getAuthorizedUsers();
        if (admins.length > 0) {
            const adminList = admins.map(num => `• ${num}`).join(`\n`);
            await message.reply(`👑 Lista admin:\n\n${adminList}`);
        } else {
            await message.reply('⚠️ Nessun admin configurato.');
        }
    }

    // if (command === '!groups') {
    //     const groupNames = await getGroupList(client);
    //     if (groupNames.length > 0) {
    //         const groupList = groupNames.map(name => `• ${name}`).join(`\n`);
    //         await message.reply(`Lista gruppi:\n\n${groupList}`);
    //     } else {
    //         await message.reply(`⚠️ Nessun gruppo trovato.`);
    //     }
    // }
}

module.exports = { handleMessage };