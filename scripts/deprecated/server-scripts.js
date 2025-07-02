/**
 * Servidor Express simplificado para ejecutar scripts de Google APIs
 * Solo maneja la ejecución de scripts Node.js, sin lógica compleja
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para ejecutar scripts
app.post('/api/execute-script', (req, res) => {
  const { script, args = [] } = req.body;

  if (!script) {
    return res.status(400).json({ error: 'Script es requerido' });
  }

  // Validar scripts permitidos
  const allowedScripts = [
    'google-verification-script.js',
    'google-calendar-script.js',
    'google-drive-script.js'
  ];

  if (!allowedScripts.includes(script)) {
    return res.status(400).json({ error: 'Script no permitido' });
  }

  const scriptPath = path.join(__dirname, '..', 'scripts', script);
  const command = `node "${scriptPath}" ${args.join(' ')}`;

  console.log(`Ejecutando: ${command}`);

  exec(command, { 
    timeout: 30000,
    cwd: path.join(__dirname, '..') 
  }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error ejecutando script:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        stderr: stderr
      });
    }

    try {
      // Intentar parsear la salida como JSON
      const result = JSON.parse(stdout);
      res.status(200).json(result);
    } catch (parseError) {
      // Si no es JSON válido, devolver como texto
      res.status(200).json({
        success: true,
        data: stdout,
        raw: true
      });
    }
  });
});

// Health check simplificado
app.get('/api/verification/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    environment: 'script-executor',
    version: '1.0.0'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de scripts ejecutándose en http://localhost:${PORT}`);
  console.log(`📁 Directorio de trabajo: ${__dirname}`);
});

module.exports = app;
