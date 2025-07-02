const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'googleApis.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Corregir 40$2 a 401
content = content.replace(/40\$2/g, '401');

// Corregir return return a return
content = content.replace(/return return/g, 'return');

// Escribir el archivo corregido
fs.writeFileSync(filePath, content, 'utf8');

console.log('Errores corregidos en googleApis.ts');
