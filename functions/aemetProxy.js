const functions = require('firebase-functions');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');

// Inicializar Firebase Admin para acceder a Firestore
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Función proxy para solicitudes a AEMET
 * Resuelve problemas de CORS actuando como intermediario entre la app web y la API de AEMET
 * 
 * Esta función acepta todos los parámetros necesarios para la solicitud a AEMET y devuelve
 * los resultados sin restricciones CORS
 */
exports.aemetProxy = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      // Validar API key de la aplicación (para proteger el uso de la función)
      const appApiKey = request.headers['x-app-api-key'] || request.query.appApiKey;
      
      if (!appApiKey) {
        return response.status(403).json({ 
          error: 'Se requiere API key de la aplicación' 
        });
      }
      
      // Obtener la clave válida desde Firestore
      let configDoc;
      try {
        configDoc = await db.collection('configuracion').doc('apis').get();
      } catch (dbError) {
        console.error('Error al acceder a Firestore:', dbError);
        return response.status(500).json({
          error: 'Error de acceso a la configuración',
          message: 'No se pudo acceder a la base de datos de configuración'
        });
      }
      
      if (!configDoc.exists) {
        console.error('Error: No se encontró la configuración de APIs en Firestore');
        return response.status(500).json({
          error: 'Error de configuración del servidor'
        });
      }
      
      const configData = configDoc.data();
      const validApiKey = configData.aemetFunctionKey;
      
      if (!validApiKey) {
        console.error('Error: No se ha configurado una API key para el proxy AEMET');
        return response.status(500).json({
          error: 'El proxy no está correctamente configurado'
        });
      }
      
      if (appApiKey !== validApiKey) {
        console.warn('Intento de acceso con API key inválida:', appApiKey);
        return response.status(403).json({ 
          error: 'API key de la aplicación inválida' 
        });
      }
      
      // Obtener la API key de AEMET desde request
      const aemetApiKey = request.headers['x-aemet-api-key'] || request.query.aemetApiKey;
      
      if (!aemetApiKey) {
        return response.status(400).json({ 
          error: 'Se requiere API key de AEMET' 
        });
      }

      // Obtener la URL y parámetros de AEMET desde la solicitud
      const endpoint = request.query.endpoint || 'maestro/municipios';
      
      // Ruta especial para verificar el estado del proxy
      if (endpoint === 'status') {
        return response.json({
          status: 'active',
          message: 'El proxy AEMET está funcionando correctamente',
          timestamp: new Date().toISOString()
        });
      }
      
      const baseUrl = 'https://opendata.aemet.es/opendata/api';
      const fullUrl = `${baseUrl}/${endpoint}`;

      console.log(`Proxy AEMET: Solicitando ${fullUrl}`);
      console.log(`Solicitud de ${request.ip || 'IP desconocida'}`);
      
      // Realizar solicitud a AEMET
      const aemetResponse = await axios.get(fullUrl, {
        headers: {
          'api_key': aemetApiKey
        }
      });

      // Si AEMET devuelve una URL de datos, obtener esos datos automáticamente
      if (aemetResponse.data && aemetResponse.data.datos) {
        console.log(`Proxy AEMET: Obteniendo datos de ${aemetResponse.data.datos}`);
        
        const dataResponse = await axios.get(aemetResponse.data.datos);
        return response.json(dataResponse.data);
      }
      
      // Si no hay URL de datos, devolver la respuesta original
      return response.json(aemetResponse.data);
      
    } catch (error) {
      console.error('Error en proxy AEMET:', error);
      
      // Registrar más detalles para diagnóstico
      if (error.response) {
        console.error('Detalles de respuesta:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Devolver respuesta de error con formato adecuado
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data || error.message || 'Error desconocido';
      
      return response.status(statusCode).json({ 
        error: errorMessage,
        message: 'Error al comunicarse con la API de AEMET'
      });
    }
  });
});
