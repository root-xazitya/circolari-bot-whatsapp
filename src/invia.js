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
    logMessage(`Invio circolare ai gruppi: ${groupNames}`);
}

module.exports = {
    sendMessageToAll
};