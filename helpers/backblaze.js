const B2 = require('backblaze-b2');

const b2 = new B2({
    applicationKeyId: '322ccb664c39', // Replace with your Backblaze keyID
    applicationKey: '00523ce97722872d633a76a8d73068d9de9898c46b', // Replace with your Backblaze applicationKey
});

// Authenticate with Backblaze B2
b2.authorize()
    .then(() => {
        console.log('Connected to Backblaze B2');
    })
    .catch((err) => {
        console.error('Failed to connect to Backblaze B2:', err);
    });

module.exports = b2 ;