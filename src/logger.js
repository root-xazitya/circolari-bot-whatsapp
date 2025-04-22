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
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);

    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.appendFileSync(LOG_FILE, `${logEntry}\n`);
}

function getLastLogLines(linesToFetch = 10) {
    if (fs.existsSync(LOG_FILE)) {
        const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
        return lines.slice(-linesToFetch).join('\n');
    }
    return 'Nessun log disponibile.';
}

module.exports = {
    logMessage,
    getLastLogLines
};