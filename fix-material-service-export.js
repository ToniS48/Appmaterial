// Este script corrige la exportación de materialService para usar MaterialService
// Ajusta el archivo src/services/MaterialService.ts para exportar el servicio con mayúscula
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ruta al archivo principal
const materialServicePath = path.join(__dirname, 'src', 'services', 'MaterialService.ts');

console.log('Corrigiendo exportación de MaterialService...');

try {
  // Leer el contenido del archivo
  let content = fs.readFileSync(materialServicePath, 'utf8');
  
  // Buscar y reemplazar la exportación
  const originalContent = content;
  
  // Corregir el nombre de la instancia
  content = content.replace(
    'const materialService = new MaterialService();',
    'const MaterialService = new MaterialService();'
  );
  
  // Corregir todas las referencias a materialService en funciones exportadas
  content = content.replace(/materialService\./g, 'MaterialService.');
  
  // Corregir la exportación del servicio
  content = content.replace(
    'export { materialService };',
    'export { MaterialService };'
  );
  
  // Si se hicieron cambios, escribir el archivo actualizado
  if (content !== originalContent) {
    fs.writeFileSync(materialServicePath, content);
    console.log('✅ Archivo MaterialService.ts actualizado correctamente');
    
    console.log('Realizando commit de los cambios...');
    execSync('git add src/services/MaterialService.ts', { stdio: 'inherit' });
    execSync('git commit -m "fix: Corregir exportación de MaterialService con mayúscula"', { stdio: 'inherit' });
    console.log('✅ Commit realizado correctamente');
  } else {
    console.log('⚠️ No se detectaron cambios necesarios en MaterialService.ts');
  }
} catch (error) {
  console.error('❌ Error:', error);
}
