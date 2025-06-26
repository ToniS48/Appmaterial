// Script para inicializar la colección 'configuracion' en Firestore con la estructura modular del componente de configuración
// Ejecutar con Node.js y tener configurado el SDK de Firebase Admin

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Reemplaza con la ruta a tu clave de servicio

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {
  // Documento: variables (ahora contiene los flags y unidades de meteo, pero NO la apiKey ni weatherApiUrl)
  await db.collection('configuracion').doc('variables').set({
    diasGraciaDevolucion: 0,
    diasMaximoRetraso: 0,
    diasBloqueoPorRetraso: 0,
    recordatorioPreActividad: 1,
    recordatorioDevolucion: 1,
    notificacionRetrasoDevolucion: 0,
    diasAntelacionRevision: 15,
    tiempoMinimoEntrePrestamos: 0,
    porcentajeStockMinimo: 10,
    diasRevisionPeriodica: 90,
    diasMinimoAntelacionCreacion: 0,
    diasMaximoModificacion: 0,
    limiteParticipantesPorDefecto: 0,
    penalizacionRetraso: 0,
    bonificacionDevolucionTemprana: 0,
    umbraLinactividadUsuario: 0,
    diasHistorialReportes: 0,
    limiteElementosExportacion: 0,
    // Meteorología
    weatherEnabled: false,
    aemetEnabled: false,
    aemetUseForSpain: false,
    temperatureUnit: '',
    windSpeedUnit: '',
    precipitationUnit: '',
    // Flags trasladados desde apis
    analyticsEnabled: false,
    notificationsEnabled: false
  });

  // Documento: apis (solo claves y weatherApiUrl)
  await db.collection('configuracion').doc('apis').set({
    googleDriveUrl: '',
    googleDriveTopoFolder: '',
    googleDriveDocFolder: '',
    weatherApiKey: '',
    weatherApiUrl: '',
    aemetApiKey: '',
    backupApiKey: '',
    emailServiceKey: '',
    smsServiceKey: '',
    // notificationsEnabled y analyticsEnabled eliminados de apis
    analyticsKey: ''
  });

  // Documento: notificaciones
  await db.collection('configuracion').doc('notificaciones').set({
    recordatorioPreActividad: 1,
    recordatorioDevolucion: 1,
    notificacionRetrasoDevolucion: 0
  });

  // Puedes añadir más documentos según los módulos/sections de tu configuración
  console.log('Colección de configuración inicializada correctamente.');
}

main().catch(console.error);
