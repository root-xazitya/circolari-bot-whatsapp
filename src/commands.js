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

async function safeReply(message, text, client) {
    const chat = await message.getChat();
    const chatId = chat.id._serialized || message.from || (message.id && message.id.remote);
    
    if (!chatId) {
        logMessage(`Errore: impossibile determinare chatId per il messaggio`);
        return;
    }
    
    try {
        await client.sendMessage(chatId, text, { sendSeen: false });
        const contextInfo = chat.isGroup ? `nel gruppo "${chat.name}"` : 'in chat privata';
        logMessage(`Messaggio inviato con successo ${contextInfo} (${chatId})`);
    } catch (error) {
        logMessage(`Errore nell'invio del messaggio a ${chatId}: ${error.message || String(error)}`);
        throw error;
    }
}

async function handleMessage(client, message) {
    const authorizedUsers = getAuthorizedUsers();
    const chat = await message.getChat();
    const isGroup = chat.isGroup;
    
    let senderId = '';
    if (isGroup) {
        senderId = message.author || (message.id && message.id.participant) || message.from;
    } else {
        senderId = message.from || '';
    }
    
    let senderNumber = '';
    let senderName = "Sconosciuto";
    const isLid = senderId && senderId.includes('@lid');
    
    try {
        if (senderId) {
            const contact = await message.getContact();
            if (contact) {
                senderNumber = contact.number || contact.id.user || '';
                senderName = contact.pushname || contact.name || "Sconosciuto";
            }
        }
    } catch (error) {
        try {
            if (senderId) {
                const contact = await client.getContactById(senderId);
                if (contact) {
                    senderNumber = contact.number || contact.id.user || '';
                    senderName = contact.pushname || contact.name || "Sconosciuto";
                }
            }
        } catch (error2) {
            if (isLid && senderId) {
                try {
                    const lidResult = await client.getContactLidAndPhone([senderId]);
                    if (lidResult && lidResult.length > 0 && lidResult[0].pn) {
                        senderNumber = lidResult[0].pn;
                    }
                } catch (error3) {
                    // Fallback
                }
            }
        }
    }
    
    if (!senderNumber && senderId) {
        const extractedNumber = senderId.split('@')[0] || '';
        if (/^\d+$/.test(extractedNumber)) {
            senderNumber = extractedNumber;
        }
    }
    
    const senderInfo = `${senderName} - ${senderNumber || 'N/A'}`;
    const senderNumberOnly = senderNumber.replace(/\D/g, '');
    const isAdmin = authorizedUsers.includes(senderNumberOnly);

    const contextInfo = isGroup ? `nel gruppo "${chat.name}"` : 'in chat privata';
    logMessage(`Messaggio ricevuto da ${senderInfo} (${senderId}) ${contextInfo} - Admin: ${isAdmin}`);
    if (!isAdmin) return;

    const command = message.body.trim().toLowerCase();

    if (command.startsWith('!log')) {
        const parts = message.body.split(' ');
        let linesToFetch = 10;
        if (parts.length > 1 && !isNaN(parts[1])) {
            linesToFetch = parseInt(parts[1], 10);
        }
        const logs = getLastLogLines(linesToFetch);
        await safeReply(message, `Ultime ${linesToFetch} linee di log:

${logs}`, client);
        logMessage(`Inviato log a ${senderInfo}`);
    }

    if (command === '!ping') {
        await safeReply(message, 'Online', client);
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
            await safeReply(message, latestMessage, client);
            logMessage(`Comando !latest eseguito da ${senderInfo}`);
        } else {
            await safeReply(message, 'Nessuna circolare disponibile.', client);
        }
    }

    if (command.startsWith('!admin add')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
            const numberRaw = parts[2].startsWith('@') ? parts[2].slice(1) : parts[2];
            const numberToAdd = numberRaw.replace(/\D/g, '');
            if (numberToAdd) {
                const added = addAuthorizedUser(numberToAdd);
                if (added) {
                    await safeReply(message, `✅ Numero ${numberToAdd} aggiunto agli admin.`, client);
                    logMessage(`Admin aggiunto: ${numberToAdd} da ${senderInfo}`);
                } else {
                    await safeReply(message, `⚠️ Il numero ${numberToAdd} è già presente tra gli admin.`, client);
                }
                } else {
                    await safeReply(message, '⚠️ Numero non valido.', client);
                }
            } else {
                await safeReply(message, '❌ Uso corretto: !admin add <numero>', client);
        }
    }

    if (command.startsWith('!admin remove')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
            const numberRaw = parts[2].startsWith('@') ? parts[2].slice(1) : parts[2];
            const numberToRemove = numberRaw.replace(/\D/g, '');
            if (numberToRemove) {
                if (numberToRemove === senderNumberOnly) {
                    await safeReply(message, '⚠️ Non puoi rimuovere te stesso dagli admin.', client);
                    return;
                }
    
                const removed = removeAuthorizedUser(numberToRemove);
                if (removed) {
                    await safeReply(message, `✅ Numero ${numberToRemove} rimosso dagli admin.`, client);
                    logMessage(`Admin rimosso: ${numberToRemove} da ${senderInfo}`);
                } else {
                    await safeReply(message, `⚠️ Il numero ${numberToRemove} non è presente tra gli admin.`, client);
                }
                } else {
                    await safeReply(message, '⚠️ Numero non valido.', client);
                }
            } else {
                await safeReply(message, '❌ Uso corretto: !admin remove <numero>', client);
        }
    }    

    if (command === '!admin list') {
        const admins = getAuthorizedUsers();
        if (admins.length > 0) {
            const adminList = admins.map(num => `• ${num}`).join(`\n`);
            await safeReply(message, `👑 Lista admin:\n\n${adminList}`, client);
        } else {
            await safeReply(message, '⚠️ Nessun admin configurato.', client);
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