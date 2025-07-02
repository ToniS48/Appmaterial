/**
 * API endpoint para ejecutar scripts de Google APIs
 * Este endpoint maneja las llamadas a los scripts Node.js desde el frontend
 */

const { exec } = require('child_process');
const path = require('path');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

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

  const scriptPath = path.join(process.cwd(), 'scripts', script);
  const command = `node "${scriptPath}" ${args.join(' ')}`;

  exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
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
}
