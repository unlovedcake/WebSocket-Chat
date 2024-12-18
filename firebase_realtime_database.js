

const admin = require('firebase-admin');
const serviceAccount = require('./cred.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const dbRealTimeDatabase = admin.database();

module.exports = { dbRealTimeDatabase }