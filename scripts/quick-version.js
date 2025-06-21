const readline = require('readline');
const { getCurrentVersion, updatePackageVersion, incrementVersion, createGitTag } = require('./version-manager');

/**
 * Script simplificado para cambio de versión después de push
 * Interfaz rápida y directa para actualizar versiones
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function showQuickVersionMenu() {
  const currentVersion = getCurrentVersion();
  
  console.log(colorize('\n🎯 CAMBIO RÁPIDO DE VERSIÓN', 'cyan'));
  console.log(colorize('============================', 'cyan'));
  console.log(`   Versión actual: ${colorize(currentVersion, 'green')}`);
  
  console.log(colorize('\n📋 Opciones:', 'blue'));
  console.log(`   ${colorize('1', 'cyan')} PATCH: ${currentVersion} → ${colorize(incrementVersion(currentVersion, 'patch'), 'green')} (Correcciones, bugs)`);
  console.log(`   ${colorize('2', 'cyan')} MINOR: ${currentVersion} → ${colorize(incrementVersion(currentVersion, 'minor'), 'green')} (Nuevas funcionalidades)`);
  console.log(`   ${colorize('3', 'cyan')} MAJOR: ${currentVersion} → ${colorize(incrementVersion(currentVersion, 'major'), 'green')} (Cambios importantes)`);
  console.log(`   ${colorize('4', 'cyan')} CUSTOM: Especificar versión manualmente`);
  console.log(`   ${colorize('0', 'cyan')} SALIR: No cambiar versión`);
  
  return currentVersion;
}

function promptQuickChoice() {
  return new Promise((resolve) => {
    rl.question(colorize('\n❓ Selecciona opción [1]: ', 'bright'), (answer) => {
      const choice = answer.trim() || '1';
      
      switch (choice) {
        case '1':
        case 'p':
        case 'patch':
          resolve({ type: 'patch' });
          break;
        case '2':
        case 'm':
        case 'minor':
          resolve({ type: 'minor' });
          break;
        case '3':
        case 'M':
        case 'major':
          resolve({ type: 'major' });
          break;
        case '4':
        case 'c':
        case 'custom':
          promptCustomVersion().then(resolve);
          break;
        case '0':
        case 'q':
        case 'quit':
        case 'exit':
          resolve({ type: 'exit' });
          break;
        default:
          console.log(colorize('❌ Opción inválida. Intenta de nuevo.', 'yellow'));
          promptQuickChoice().then(resolve);
      }
    });
  });
}

function promptCustomVersion() {
  return new Promise((resolve) => {
    rl.question(colorize('📝 Versión personalizada (ej: 1.2.3): ', 'bright'), (answer) => {
      const version = answer.trim();
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        console.log(colorize('❌ Formato inválido. Debe ser X.Y.Z', 'yellow'));
        promptCustomVersion().then(resolve);
      } else {
        resolve({ type: 'custom', version });
      }
    });
  });
}

function promptCreateTag() {
  return new Promise((resolve) => {
    rl.question(colorize('🏷️  ¿Crear tag de Git? [y/N]: ', 'bright'), (answer) => {
      const createTag = answer.toLowerCase().startsWith('y');
      resolve(createTag);
    });
  });
}

function executeQuickVersionUpdate(choice, currentVersion) {
  try {
    if (choice.type === 'exit') {
      console.log(colorize('\n👋 Sin cambios. ¡Hasta luego!', 'yellow'));
      return null;
    }
    
    const newVersion = choice.type === 'custom' 
      ? choice.version 
      : incrementVersion(currentVersion, choice.type);
    
    console.log(colorize(`\n🔄 ${currentVersion} → ${newVersion}`, 'blue'));
    
    updatePackageVersion(newVersion);
    
    // Regenerar información de versión
    const { generateVersionInfo } = require('./generate-version.js');
    generateVersionInfo();
    
    console.log(colorize(`✅ Versión actualizada a ${newVersion}`, 'green'));
    
    return newVersion;
  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, 'red'));
    return null;
  }
}

async function quickVersionUpdate() {
  try {
    const currentVersion = showQuickVersionMenu();
    const choice = await promptQuickChoice();
    
    if (choice.type === 'exit') {
      rl.close();
      return;
    }
    
    const newVersion = executeQuickVersionUpdate(choice, currentVersion);
    
    if (newVersion) {
      const shouldCreateTag = await promptCreateTag();
      
      if (shouldCreateTag) {
        try {
          createGitTag(newVersion);
          console.log(colorize(`🏷️  Tag v${newVersion} creado`, 'green'));
          console.log(colorize(`💡 Push tag: git push origin v${newVersion}`, 'blue'));
        } catch (error) {
          console.log(colorize(`⚠️  Error creando tag: ${error.message}`, 'yellow'));
        }
      }
      
      console.log(colorize('\n🎉 ¡Proceso completado!', 'green'));
    }
    
  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, 'red'));
  } finally {
    rl.close();
  }
}

// Manejo de interrupción
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Proceso cancelado.', 'yellow'));
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  quickVersionUpdate().catch(error => {
    console.error(colorize(`❌ Error fatal: ${error.message}`, 'red'));
    rl.close();
    process.exit(1);
  });
}

module.exports = { quickVersionUpdate };
