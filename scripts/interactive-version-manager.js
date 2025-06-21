const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getCurrentVersion, updatePackageVersion, incrementVersion, createGitTag } = require('./version-manager');

/**
 * Script interactivo para gestión de versiones semi-automática
 * Se ejecuta después de un push para seleccionar el tipo de cambio de versión
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function showBanner() {
  console.log(colorize('\n🚀 GESTOR INTERACTIVO DE VERSIONES (POST-PUSH)', 'cyan'));
  console.log(colorize('===============================================', 'cyan'));
  console.log(colorize('💡 Selecciona el tipo de cambio de versión después del push', 'blue'));
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (status) {
      console.log(colorize('\n📝 Info: Hay cambios pendientes en el repositorio:', 'blue'));
      console.log(status);
      console.log(colorize('💡 Puedes continuar con el versionado. Los cambios se pueden confirmar después.', 'yellow'));
    }
    return true; // Siempre permitir continuar
  } catch (error) {
    console.log(colorize('\n⚠️  No se pudo verificar el estado de Git, continuando...', 'yellow'));
    return true;
  }
}

function getLastCommits(count = 5) {
  try {
    const commits = execSync(`git log --oneline -${count}`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return {
          hash: hash.substring(0, 7),
          message: messageParts.join(' ')
        };
      });
    return commits;
  } catch (error) {
    console.log(colorize('❌ Error al obtener commits:', 'red'), error.message);
    return [];
  }
}

function analyzeCommits(commits) {
  const keywords = {
    major: ['breaking', 'major', 'BREAKING CHANGE', 'breaking change'],
    minor: ['feat', 'feature', 'add', 'new', 'minor'],
    patch: ['fix', 'patch', 'bug', 'hotfix', 'correction', 'update']
  };

  const suggestions = {
    major: 0,
    minor: 0,
    patch: 0
  };

  commits.forEach(commit => {
    const message = commit.message.toLowerCase();
    
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => message.includes(word.toLowerCase()))) {
        suggestions[type]++;
      }
    }
  });

  // Determinar sugerencia basada en prioridad
  if (suggestions.major > 0) return 'major';
  if (suggestions.minor > 0) return 'minor';
  if (suggestions.patch > 0) return 'patch';
  return 'patch'; // Default
}

function showVersionInfo() {
  const currentVersion = getCurrentVersion();
  const commits = getLastCommits();
  const suggestion = analyzeCommits(commits);
  
  console.log(colorize('\n📊 INFORMACIÓN ACTUAL:', 'blue'));
  console.log(`   Versión actual: ${colorize(currentVersion, 'green')}`);
  
  if (commits.length > 0) {
    console.log(colorize('\n📝 Últimos commits:', 'blue'));
    commits.forEach((commit, index) => {
      const prefix = index === 0 ? '→' : ' ';
      console.log(`   ${prefix} ${colorize(commit.hash, 'yellow')} ${commit.message}`);
    });
  }
  
  console.log(colorize(`\n💡 Sugerencia basada en commits: ${suggestion.toUpperCase()}`, 'magenta'));
  
  // Mostrar preview de versiones
  console.log(colorize('\n🎯 Opciones de versionado:', 'blue'));
  console.log(`   ${colorize('1', 'cyan')} PATCH: ${currentVersion} → ${colorize(incrementVersion(currentVersion, 'patch'), 'green')} (Correcciones, bugs)`);
  console.log(`   ${colorize('2', 'cyan')} MINOR: ${currentVersion} → ${colorize(incrementVersion(currentVersion, 'minor'), 'green')} (Nuevas funcionalidades)`);
  console.log(`   ${colorize('3', 'cyan')} MAJOR: ${currentVersion} → ${colorize(incrementVersion(currentVersion, 'major'), 'green')} (Cambios importantes/breaking)`);
  console.log(`   ${colorize('4', 'cyan')} CUSTOM: Especificar versión manualmente`);
  console.log(`   ${colorize('5', 'cyan')} SKIP: No cambiar versión ahora`);
  
  return { currentVersion, suggestion };
}

function promptVersionType(suggestion) {
  return new Promise((resolve) => {
    const defaultOption = suggestion === 'patch' ? '1' : suggestion === 'minor' ? '2' : '3';
    
    rl.question(colorize(`\n❓ Selecciona tipo de versión [${defaultOption}]: `, 'bright'), (answer) => {
      const choice = answer.trim() || defaultOption;
      
      switch (choice) {
        case '1':
        case 'patch':
        case 'p':
          resolve({ type: 'patch' });
          break;
        case '2':
        case 'minor':
        case 'm':
          resolve({ type: 'minor' });
          break;
        case '3':
        case 'major':
        case 'M':
          resolve({ type: 'major' });
          break;
        case '4':
        case 'custom':
        case 'c':
          promptCustomVersion().then(resolve);
          break;
        case '5':
        case 'skip':
        case 's':
          resolve({ type: 'skip' });
          break;
        default:
          console.log(colorize('❌ Opción inválida. Intenta de nuevo.', 'red'));
          promptVersionType(suggestion).then(resolve);
      }
    });
  });
}

function promptCustomVersion() {
  return new Promise((resolve) => {
    rl.question(colorize('📝 Introduce la versión personalizada (ej: 1.2.3): ', 'bright'), (answer) => {
      const version = answer.trim();
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        console.log(colorize('❌ Formato inválido. Debe ser X.Y.Z (ej: 1.2.3)', 'red'));
        promptCustomVersion().then(resolve);
      } else {
        resolve({ type: 'custom', version });
      }
    });
  });
}

function promptGitTag() {
  return new Promise((resolve) => {
    rl.question(colorize('🏷️  ¿Crear tag de Git? [Y/n]: ', 'bright'), (answer) => {
      const createTag = !answer.trim() || answer.toLowerCase().startsWith('y');
      
      if (createTag) {
        rl.question(colorize('📝 Mensaje del tag (opcional): ', 'bright'), (message) => {
          resolve({ createTag: true, message: message.trim() || null });
        });
      } else {
        resolve({ createTag: false });
      }
    });
  });
}

function promptPushTag() {
  return new Promise((resolve) => {
    rl.question(colorize('📤 ¿Hacer push del tag a origin? [Y/n]: ', 'bright'), (answer) => {
      const shouldPush = !answer.trim() || answer.toLowerCase().startsWith('y');
      resolve(shouldPush);
    });
  });
}

function executeVersionUpdate(versionChoice, currentVersion) {
  try {
    let newVersion;
    
    if (versionChoice.type === 'skip') {
      console.log(colorize('\n⏭️  Versionado omitido.', 'yellow'));
      return null;
    }
    
    if (versionChoice.type === 'custom') {
      newVersion = versionChoice.version;
    } else {
      newVersion = incrementVersion(currentVersion, versionChoice.type);
    }
    
    console.log(colorize(`\n🔄 Actualizando versión: ${currentVersion} → ${newVersion}`, 'blue'));
    
    updatePackageVersion(newVersion);
    
    // Regenerar información de versión
    const { generateVersionInfo } = require('./generate-version.js');
    generateVersionInfo();
    
    console.log(colorize(`✅ Versión actualizada exitosamente a ${newVersion}`, 'green'));
    
    return newVersion;
  } catch (error) {
    console.log(colorize(`❌ Error al actualizar versión: ${error.message}`, 'red'));
    return null;
  }
}

function handleGitTag(newVersion, tagOptions) {
  if (!tagOptions.createTag) return null;
  
  try {
    createGitTag(newVersion, tagOptions.message);
    return newVersion;
  } catch (error) {
    console.log(colorize(`❌ Error al crear tag: ${error.message}`, 'red'));
    return null;
  }
}

function pushTag(version) {
  try {
    execSync(`git push origin v${version}`, { stdio: 'inherit' });
    console.log(colorize(`✅ Tag v${version} enviado a origin`, 'green'));
  } catch (error) {
    console.log(colorize(`❌ Error al hacer push del tag: ${error.message}`, 'red'));
  }
}

async function main() {
  showBanner();
  
  // Verificar estado de Git (informativo solamente)
  checkGitStatus();
  
  // Mostrar información y obtener sugerencia
  const { currentVersion, suggestion } = showVersionInfo();
  
  try {
    // Prompts interactivos
    const versionChoice = await promptVersionType(suggestion);
    
    if (versionChoice.type === 'skip') {
      console.log(colorize('\n👋 ¡Hasta luego!', 'cyan'));
      rl.close();
      return;
    }
    
    const tagOptions = await promptGitTag();
    
    // Ejecutar actualización
    const newVersion = executeVersionUpdate(versionChoice, currentVersion);
    
    if (!newVersion) {
      rl.close();
      return;
    }
    
    // Manejar tag de Git
    const tagCreated = handleGitTag(newVersion, tagOptions);
    
    // Preguntar sobre push del tag
    if (tagCreated) {
      const shouldPush = await promptPushTag();
      if (shouldPush) {
        pushTag(newVersion);
      } else {
        console.log(colorize(`💡 Para hacer push del tag más tarde: git push origin v${newVersion}`, 'yellow'));
      }
    }
    
    console.log(colorize('\n🎉 ¡Proceso completado exitosamente!', 'green'));
    
  } catch (error) {
    console.log(colorize(`❌ Error: ${error.message}`, 'red'));
  } finally {
    rl.close();
  }
}

// Manejo de señales para cerrar readline apropiadamente
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Proceso cancelado por el usuario.', 'yellow'));
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`❌ Error fatal: ${error.message}`, 'red'));
    rl.close();
    process.exit(1);
  });
}

module.exports = { main };
