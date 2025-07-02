/**
 * Test simple para Google APIs
 */
import * as functions from 'firebase-functions';

// Función de prueba simple
export const testGoogleApis = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    res.status(200).json({
      success: true,
      message: 'Google APIs test function is working!',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        hasGoogleProjectId: !!process.env.GOOGLE_PROJECT_ID,
        hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY
      }
    });
  } catch (error) {
    console.error('Error in test function:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
export const googleApisHealthCheck = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  res.status(200).json({
    status: 'healthy',
    service: 'Google APIs Functions',
    timestamp: new Date().toISOString()
  });
});
