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

// Función para limpiar imports no utilizados
function cleanUnusedImports(content) {
  const lines = content.split('\n');
  const result = [];
  let inImportBlock = false;
  let currentImport = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detectar inicio de import
    if (line.trim().startsWith('import ') && !line.includes(' from ') && line.includes('{')) {
      inImportBlock = true;
      currentImport = line;
      continue;
    }
    
    // Continuar acumulando import multilinea
    if (inImportBlock) {
      currentImport += '\n' + line;
      if (line.includes('} from ')) {
        inImportBlock = false;
        // Procesar el import completo
        const cleanedImport = cleanImportStatement(currentImport, content);
        if (cleanedImport.trim()) {
          result.push(cleanedImport);
        }
        currentImport = '';
        continue;
      } else if (!line.includes('}')) {
        continue;
      }
    }
    
    // Import de una sola línea
    if (line.trim().startsWith('import ') && line.includes(' from ') && line.includes('{')) {
      const cleanedImport = cleanImportStatement(line, content);
      if (cleanedImport.trim()) {
        result.push(cleanedImport);
      }
      continue;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// Función para limpiar un statement de import específico
function cleanImportStatement(importStatement, fullContent) {
  const fromMatch = importStatement.match(/} from ['"`]([^'"`]+)['"`]/);
  if (!fromMatch) return importStatement;
  
  const importPath = fromMatch[1];
  
  // Extraer los imports dentro de las llaves
  const importsMatch = importStatement.match(/{\s*([^}]+)\s*}/);
  if (!importsMatch) return importStatement;
  
  const imports = importsMatch[1]
    .split(',')
    .map(imp => imp.trim())
    .filter(imp => imp.length > 0);
  
  // Filtrar imports que realmente se usan
  const usedImports = imports.filter(imp => {
    // Limpiar el import (remover 'as' aliases, etc.)
    const cleanImp = imp.split(' as ')[0].trim();
    
    // Buscar uso en el contenido (excluyendo la línea de import)
    const contentWithoutImports = fullContent.replace(/import\s+.*?from\s+['"`][^'"`]+['"`];?\n?/g, '');
    
    // Patrones para buscar uso
    const patterns = [
      new RegExp(`\\b${cleanImp}\\b`, 'g'),
      new RegExp(`<${cleanImp}`, 'g'),
      new RegExp(`${cleanImp}\\(`, 'g'),
      new RegExp(`${cleanImp}\\.`, 'g')
    ];
    
    return patterns.some(pattern => pattern.test(contentWithoutImports));
  });
  
  if (usedImports.length === 0) {
    return ''; // Eliminar todo el import
  }
  
  // Reconstruir el import solo con los imports utilizados
  if (usedImports.length === imports.length) {
    return importStatement; // No hay cambios
  }
  
  const newImportList = usedImports.join(', ');
  return importStatement.replace(/{\s*[^}]+\s*}/, `{ ${newImportList} }`);
}

// Función para eliminar variables no utilizadas
function removeUnusedVariables(content) {
  let result = content;
  
  // Patrones para detectar variables no utilizadas
  const patterns = [
    // const variable = ...
    /const\s+(\w+)\s*=\s*[^;]+;?\n/g,
    // let variable = ...
    /let\s+(\w+)\s*=\s*[^;]+;?\n/g,
    // Destructuring assignments
    /const\s*{\s*([^}]+)\s*}\s*=\s*[^;]+;?\n/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const variableName = match[1];
      
      if (variableName) {
        // Verificar si la variable se usa en el resto del código
        const restOfCode = content.replace(fullMatch, '');
        const isUsed = new RegExp(`\\b${variableName}\\b`).test(restOfCode);
        
        if (!isUsed) {
          result = result.replace(fullMatch, '');
        }
      }
    }
  });
  
  return result;
}

// Función principal para limpiar un archivo
function cleanFile(filePath) {
  try {
    console.log(`Limpiando: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    let cleanedContent = content;
    
    // Limpiar imports no utilizados
    cleanedContent = cleanUnusedImports(cleanedContent);
    
    // Limpiar variables no utilizadas básicas
    cleanedContent = removeUnusedVariables(cleanedContent);
    
    // Solo escribir si hay cambios
    if (cleanedContent !== content) {
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
  console.log('🧹 Iniciando limpieza de ESLint warnings...\n');
  
  const srcPath = path.join(__dirname, 'src');
  const files = getAllTsFiles(srcPath);
  
  console.log(`Encontrados ${files.length} archivos TypeScript/React\n`);
  
  let cleanedCount = 0;
  
  files.forEach(file => {
    if (cleanFile(file)) {
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
    console.log('\n⚠️  Hay algunos errores restantes que requieren atención manual.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { cleanFile, getAllTsFiles };
