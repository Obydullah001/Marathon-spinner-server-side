const fs = require('fs');
const key = fs.readFileSync('./firebase-adminsdk-servicekey-fbsvc-249b1b4609.json','utf-8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64);
