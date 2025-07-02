const functions = require('firebase-functions');
const admin = require('firebase-admin');
const aemetProxy = require('./aemetProxy');

// Inicializar Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Exportar todas las funciones
exports.aemetProxy = aemetProxy.aemetProxy;
