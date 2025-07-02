// Este script resuelve el conflicto de casing en MaterialService.ts
// Ejecutar con: node fix-material-service-casing.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Rutas de archivos
const materialServicePath = path.join(__dirname, 'src', 'services', 'MaterialService.ts');
const materialServiceTempPath = path.join(__dirname, 'src', 'services', 'MaterialService_TEMP.ts');
const prestamoServicePath = path.join(__dirname, 'src', 'services', 'prestamoService.ts');
const actividadServicePath = path.join(__dirname, 'src', 'services', 'actividadService.ts');

console.log('Iniciando corrección de casing en MaterialService.ts...');

// 1. Renombrar el archivo MaterialService.ts a un nombre temporal
try {
  if (fs.existsSync(materialServicePath)) {
    console.log('Renombrando MaterialService.ts a MaterialService_TEMP.ts...');
    fs.renameSync(materialServicePath, materialServiceTempPath);
    console.log('✅ Archivo renombrado correctamente');
  } else {
    console.log('⚠️ El archivo MaterialService.ts no existe, creando uno nuevo...');
  }
} catch (err) {
  console.error('❌ Error al renombrar el archivo:', err);
  process.exit(1);
}

// 2. Crear un nuevo archivo MaterialService.ts con el mismo contenido
try {
  console.log('Creando nuevo archivo MaterialService.ts...');
  const content = fs.existsSync(materialServiceTempPath) 
    ? fs.readFileSync(materialServiceTempPath, 'utf8')
    : '// Archivo generado para resolver conflicto de casing\n';
  
  fs.writeFileSync(materialServicePath, content);
  console.log('✅ Nuevo archivo creado correctamente');
} catch (err) {
  console.error('❌ Error al crear el nuevo archivo:', err);
  process.exit(1);
}

// 3. Modificar referencias en prestamoService.ts
try {
  console.log('Actualizando importación en prestamoService.ts...');
  let prestamoContent = fs.readFileSync(prestamoServicePath, 'utf8');
  prestamoContent = prestamoContent.replace(
    /import \{ actualizarCantidadDisponible \} from ['"]\.\/MaterialService['"]/,
    'import { actualizarCantidadDisponible } from \'./MaterialService.js\''
  );
  fs.writeFileSync(prestamoServicePath, prestamoContent);
  console.log('✅ prestamoService.ts actualizado correctamente');
} catch (err) {
  console.error('❌ Error al actualizar prestamoService.ts:', err);
}

// 4. Modificar referencias en actividadService.ts
try {
  console.log('Actualizando importación en actividadService.ts...');
  let actividadContent = fs.readFileSync(actividadServicePath, 'utf8');
  actividadContent = actividadContent.replace(
    /import \{ obtenerMaterial \} from ['"]\.\/MaterialService['"]/,
    'import { obtenerMaterial } from \'./MaterialService.js\''
  );
  fs.writeFileSync(actividadServicePath, actividadContent);
  console.log('✅ actividadService.ts actualizado correctamente');
} catch (err) {
  console.error('❌ Error al actualizar actividadService.ts:', err);
}

// 5. Limpiar archivo temporal
try {
  if (fs.existsSync(materialServiceTempPath)) {
    console.log('Eliminando archivo temporal...');
    fs.unlinkSync(materialServiceTempPath);
    console.log('✅ Archivo temporal eliminado correctamente');
  }
} catch (err) {
  console.error('❌ Error al eliminar archivo temporal:', err);
}

console.log('Commit de los cambios...');
try {
  execSync('git add src/services/MaterialService.ts src/services/prestamoService.ts src/services/actividadService.ts', { stdio: 'inherit' });
  execSync('git commit -m "fix: Solución final al conflicto de casing entre MaterialService.ts y materialService.ts"', { stdio: 'inherit' });
  console.log('✅ Cambios commiteados correctamente');
} catch (err) {
  console.error('❌ Error al hacer commit de los cambios:', err);
}

console.log('✅ Proceso completado. Ahora puedes hacer push de los cambios.');
