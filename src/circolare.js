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

// circolare.js
const Parser = require('rss-parser');
const parser = new Parser();
const path = require('path');
const fs = require('fs');

const sitoUrl = 'https://www.torricellimi.edu.it/feed/circolari.rss';
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
};