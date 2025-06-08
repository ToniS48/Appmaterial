const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Función para obtener todos los archivos .tsx y .ts
function getAllTsFiles(dir, files = []) {
  const dirFiles = fs.readdirSync(dir);
  
  for (const file of dirFiles) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
      getAllTsFiles(filePath, files);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      files.push(filePath);
    }
  }
  
  return files;
}

// Función más conservadora para limpiar imports
function cleanUnusedImports(content) {
  const lines = content.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Solo procesar imports simples de una línea con destructuring
    if (line.trim().startsWith('import {') && line.includes('} from ') && !line.includes('\n')) {
      const cleanedImport = cleanSingleLineImport(line, content);
      if (cleanedImport.trim()) {
        result.push(cleanedImport);
      }
      continue;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// Función para limpiar un import de una sola línea
function cleanSingleLineImport(importLine, fullContent) {
  const fromMatch = importLine.match(/} from ['"`]([^'"`]+)['"`]/);
  if (!fromMatch) return importLine;
  
  // Extraer los imports dentro de las llaves
  const importsMatch = importLine.match(/{\s*([^}]+)\s*}/);
  if (!importsMatch) return importLine;
  
  const imports = importsMatch[1]
    .split(',')
    .map(imp => imp.trim())
    .filter(imp => imp.length > 0);
  
  // Filtrar imports que realmente se usan
  const usedImports = imports.filter(imp => {
    // Limpiar el import (remover 'as' aliases, etc.)
    const cleanImp = imp.split(' as ')[0].trim();
    
    // Buscar uso en el contenido (excluyendo líneas de import)
    const contentLines = fullContent.split('\n');
    const contentWithoutImports = contentLines
      .filter(line => !line.trim().startsWith('import '))
      .join('\n');
    
    // Patrones más específicos para buscar uso
    const patterns = [
      new RegExp(`\\b${cleanImp}\\s*\\(`, 'g'), // Función llamada
      new RegExp(`<${cleanImp}[\\s>]`, 'g'), // Componente JSX
      new RegExp(`\\b${cleanImp}\\.`, 'g'), // Propiedad/método
      new RegExp(`\\b${cleanImp}\\s*=`, 'g'), // Asignación
      new RegExp(`\\b${cleanImp}\\s*,`, 'g'), // En lista
      new RegExp(`\\b${cleanImp}\\s*}`, 'g'), // En destructuring
      new RegExp(`\\b${cleanImp}\\s*\\]`, 'g'), // En array
      new RegExp(`typeof\\s+${cleanImp}\\b`, 'g'), // typeof
      new RegExp(`\\b${cleanImp}\\s*:`, 'g'), // En objeto/type
    ];
    
    return patterns.some(pattern => pattern.test(contentWithoutImports));
  });
  
  if (usedImports.length === 0) {
    return ''; // Eliminar todo el import
  }
  
  if (usedImports.length === imports.length) {
    return importLine; // No hay cambios
  }
  
  // Reconstruir el import solo con los imports utilizados
  const newImportList = usedImports.join(', ');
  return importLine.replace(/{\s*[^}]+\s*}/, `{ ${newImportList} }`);
}

// Función para eliminar variables no utilizadas (más conservadora)
function removeSimpleUnusedVariables(content) {
  let result = content;
  
  // Solo eliminar variables const simples que claramente no se usan
  const lines = content.split('\n');
  const linesToRemove = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Buscar const variables simples
    const constMatch = trimmedLine.match(/^const\s+(\w+)\s*=\s*[^;]+;?\s*$/);
    if (constMatch) {
      const variableName = constMatch[1];
      
      // Verificar si la variable se usa en el resto del archivo
      const restOfContent = lines.slice(i + 1).join('\n');
      const isUsed = new RegExp(`\\b${variableName}\\b`).test(restOfContent);
      
      if (!isUsed) {
        linesToRemove.push(i);
      }
    }
  }
  
  // Remover líneas en orden inverso para no afectar los índices
  for (let i = linesToRemove.length - 1; i >= 0; i--) {
    lines.splice(linesToRemove[i], 1);
  }
  
  return lines.join('\n');
}

// Función principal para limpiar un archivo de forma segura
function cleanFileSafely(filePath) {
  try {
    console.log(`Limpiando: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    let cleanedContent = content;
    
    // Solo limpiar imports no utilizados
    cleanedContent = cleanUnusedImports(cleanedContent);
    
    // Solo escribir si hay cambios significativos
    if (cleanedContent !== content && cleanedContent.length > content.length * 0.8) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`✅ Limpiado: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error limpiando ${filePath}:`, error.message);
    return false;
  }
}

// Función principal
function main() {
  console.log('🧹 Iniciando limpieza segura de ESLint warnings...\n');
  
  const srcPath = path.join(__dirname, 'src');
  const files = getAllTsFiles(srcPath);
  
  console.log(`Encontrados ${files.length} archivos TypeScript/React\n`);
  
  let cleanedCount = 0;
  
  files.forEach(file => {
    if (cleanFileSafely(file)) {
      cleanedCount++;
    }
  });
  
  console.log(`\n✨ Limpieza completada!`);
  console.log(`📊 Archivos modificados: ${cleanedCount}/${files.length}`);
  
  // Ejecutar build para verificar
  console.log('\n🔍 Ejecutando build para verificar...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('\n✅ Build exitoso!');
  } catch (error) {
    console.log('\n⚠️  Hay algunos errores que requieren atención manual.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { cleanFileSafely, getAllTsFiles };
