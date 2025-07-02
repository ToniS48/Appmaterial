const fs = require('fs');

// Leer el archivo
const filePath = './src/googleApis.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazos para agregar return
const replacements = [
  // Respuestas exitosas
  {
    from: /(\s+)res\.status\(200\)\.json\(/g,
    to: '$1return res.status(200).json('
  },
  // Respuestas de error
  {
    from: /(\s+)res\.status\(500\)\.json\(/g,
    to: '$1return res.status(500).json('
  },
  // Otros códigos de error
  {
    from: /(\s+)res\.status\(40[0-9]\)\.json\(/g,
    to: '$1return res.status(40$2).json('
  }
];

// Aplicar reemplazos
replacements.forEach(replacement => {
  content = content.replace(replacement.from, replacement.to);
});

// Escribir el archivo corregido
fs.writeFileSync(filePath, content);

console.log('Correcciones aplicadas a googleApis.ts');
