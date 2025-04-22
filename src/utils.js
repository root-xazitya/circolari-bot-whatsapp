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
            logMessage(`Errore nel parsing di ${AUTHORIZED_USERS_FILE}: ${error.message}`);
            return [];
        }
    } else {
        logMessage(`File ${AUTHORIZED_USERS_FILE} non trovato. Nessun utente autorizzato configurato.`);
        return [];
    }
}

function ensureValidAuthorizedUsersFile() {
    if (!fs.existsSync(AUTHORIZED_USERS_FILE)) {
        const defaultContent = { authorizedNumbers: [] };
        fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(defaultContent, null, 2));
        logMessage(`File ${AUTHORIZED_USERS_FILE} creato con contenuto vuoto.`);
    } else {
        try {
            const content = fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8');
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed.authorizedNumbers)) {
                throw new Error("Campo 'authorizedNumbers' non è un array.");
            }
        } catch (error) {
            logMessage(`File ${AUTHORIZED_USERS_FILE} corrotto, verrà ripristinato. Errore: ${error.message}`);
            const defaultContent = { authorizedNumbers: [] };
            fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(defaultContent, null, 2));
        }
    }
}

function addAuthorizedUser(number) {
    const data = fs.existsSync(AUTHORIZED_USERS_FILE)
        ? JSON.parse(fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8'))
        : { authorizedNumbers: [] };

    const cleanedNumber = number.replace(/D/g, '');

    if (!data.authorizedNumbers.includes(cleanedNumber)) {
        data.authorizedNumbers.push(cleanedNumber);
        fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(data, null, 2));
        logMessage(`Numero ${cleanedNumber} aggiunto agli admin.`);
        return true;
    }
    return false;
}

function removeAuthorizedUser(number) {
    const data = fs.existsSync(AUTHORIZED_USERS_FILE)
        ? JSON.parse(fs.readFileSync(AUTHORIZED_USERS_FILE, 'utf8'))
        : { authorizedNumbers: [] };

    const cleanedNumber = number.replace(/D/g, '');
    const index = data.authorizedNumbers.indexOf(cleanedNumber);

    if (index !== -1) {
        data.authorizedNumbers.splice(index, 1);
        fs.writeFileSync(AUTHORIZED_USERS_FILE, JSON.stringify(data, null, 2));
        logMessage(`Numero ${cleanedNumber} rimosso dagli admin.`);
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