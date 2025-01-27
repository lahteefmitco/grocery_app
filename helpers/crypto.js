
const crypto = require('crypto');
require('dotenv').config();
// Access environment variables
const algorithm = 'aes-256-cbc';

const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

const secretKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex')



// Encryption function
function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decryption function
function decrypt(encryptedText) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}




module.exports = { encrypt, decrypt }