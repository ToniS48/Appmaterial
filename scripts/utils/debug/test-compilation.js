const { exec } = require('child_process');

console.log('🔍 Verificando la compilación de la aplicación...');
console.log('');

// Ejecutar CRACO build para verificar que no hay errores de compilación
exec('npx craco build --dry-run', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error durante la compilación:');
    console.error(error.message);
    return;
  }
  
  if (stderr) {
    console.log('⚠️ Advertencias:');
    console.log(stderr);
  }
  
  console.log('✅ Compilación exitosa!');
  console.log(stdout);
});
