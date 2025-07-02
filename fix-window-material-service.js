// Este script corrige las referencias a window.materialService
// con la correcta capitalización en los archivos de prueba
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Carpeta de tests
const testsDir = path.join(__dirname, 'tests');

// Función para buscar archivos de manera recursiva
function findFiles(dir, pattern) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Buscar todos los archivos JS en la carpeta tests
const jsFiles = findFiles(testsDir, /\.js$/);
console.log(`Encontrados ${jsFiles.length} archivos JS para procesar`);

// Contador de archivos modificados
let modifiedCount = 0;

// Procesar cada archivo
for (const filePath of jsFiles) {
  try {
    // Leer el contenido del archivo
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar referencias a window.materialService
    const originalContent = content;
    content = content.replace(/window\.materialService/g, 'window.MaterialService');
    
    // Si se hicieron cambios, escribir el archivo actualizado
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      modifiedCount++;
      console.log(`✅ Actualizado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error al procesar ${filePath}:`, error);
  }
}

console.log(`\nResumen:`);
console.log(`- ${modifiedCount} archivos actualizados`);
console.log(`- ${jsFiles.length - modifiedCount} archivos sin cambios`);

if (modifiedCount > 0) {
  try {
    console.log('\nRealizando commit de los cambios...');
    execSync('git add tests/', { stdio: 'inherit' });
    execSync('git commit -m "fix: Corregir capitalización de window.MaterialService en archivos de test"', { stdio: 'inherit' });
    console.log('✅ Commit realizado correctamente');
  } catch (error) {
    console.error('❌ Error al realizar commit:', error);
  }
}

console.log('\n✅ Proceso completado');
