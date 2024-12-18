const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = require('./cred.json')

initializeApp({
    credential: cert(serviceAccount)
})

const dbFireStore = getFirestore()

module.exports = { dbFireStore }