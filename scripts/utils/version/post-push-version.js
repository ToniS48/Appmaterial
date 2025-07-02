const { execSync } = require('child_process');
const path = require('path');

/**
 * Script para ejecutar después de un push exitoso
 * Detecta si hubo un push y pregunta si se quiere actualizar la versión
 */

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function checkIfRecentPush() {
  try {
    // Verificar si el último commit local coincide con el remoto
    const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const remoteCommit = execSync('git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null || echo "no-remote"', { encoding: 'utf8' }).trim();
    
    if (localCommit === remoteCommit && remoteCommit !== 'no-remote') {
      return true;
    }
    
    // Verificar si hay commits locales que no están en remoto
    const unpushedCommits = execSync('git log origin/main..HEAD --oneline 2>/dev/null || git log origin/master..HEAD --oneline 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
    
    return unpushedCommits === '';
  } catch (error) {
    console.log(colorize('⚠️  No se pudo verificar el estado del push', 'yellow'));
    return false;
  }
}

function getLastPushInfo() {
  try {
    const lastCommit = execSync('git log -1 --pretty=format:"%h %s (%cr)"', { encoding: 'utf8' }).trim();
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    return {
      lastCommit,
      currentBranch
    };
  } catch (error) {
    return {
      lastCommit: 'Desconocido',
      currentBranch: 'Desconocido'
    };
  }
}

function showPushStatus() {
  const { lastCommit, currentBranch } = getLastPushInfo();
  const isUpToDate = checkIfRecentPush();
  
  console.log(colorize('\n📤 ESTADO DEL PUSH', 'cyan'));
  console.log(colorize('=================', 'cyan'));
  console.log(`   Rama actual: ${colorize(currentBranch, 'green')}`);
  console.log(`   Último commit: ${lastCommit}`);
  console.log(`   Estado: ${isUpToDate ? colorize('✅ Sincronizado con remoto', 'green') : colorize('⚠️  Puede haber commits sin push', 'yellow')}`);
  
  return isUpToDate;
}

function runInteractiveVersionManager() {
  try {
    const scriptPath = path.join(__dirname, 'interactive-version-manager.js');
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.log(colorize('❌ Error al ejecutar el gestor de versiones:', 'red'), error.message);
  }
}

function main() {
  console.log(colorize('\n🔄 POST-PUSH: Verificando estado del repositorio...', 'blue'));
  
  const isUpToDate = showPushStatus();
  
  if (isUpToDate) {
    console.log(colorize('\n🎯 El repositorio está actualizado.', 'green'));
    console.log(colorize('💡 ¿Te gustaría actualizar la versión del proyecto?', 'yellow'));
    
    runInteractiveVersionManager();
  } else {
    console.log(colorize('\n⚠️  Parece que hay commits pendientes de push.', 'yellow'));
    console.log(colorize('💡 Haz push de tus cambios y luego ejecuta este script.', 'blue'));
    console.log(colorize('\nComandos sugeridos:', 'cyan'));
    console.log('   git push');
    console.log('   npm run version:post-push');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, checkIfRecentPush, showPushStatus };
