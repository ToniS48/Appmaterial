const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para actualizar la versión del proyecto de forma automática
 * Maneja versionado semántico (MAJOR.MINOR.PATCH)
 */

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '../../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function updatePackageVersion(newVersion) {
  const packagePath = path.join(__dirname, '../../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`📦 package.json actualizado a versión ${newVersion}`);
}

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

function formatVersion(major, minor, patch) {
  return `${major}.${minor}.${patch}`;
}

function incrementVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (type.toLowerCase()) {
    case 'major':
      return formatVersion(major + 1, 0, 0);
    case 'minor':
      return formatVersion(major, minor + 1, 0);
    case 'patch':
      return formatVersion(major, minor, patch + 1);
    default:
      throw new Error(`Tipo de versión inválido: ${type}. Use: major, minor, patch`);
  }
}

function createGitTag(version, message) {
  try {
    execSync(`git add package.json`, { stdio: 'inherit' });
    execSync(`git commit -m "chore: Bump version to ${version}"`, { stdio: 'inherit' });
    execSync(`git tag -a v${version} -m "${message || `Version ${version}`}"`, { stdio: 'inherit' });
    console.log(`🏷️  Tag v${version} creado`);
    console.log(`📤 Para subir el tag: git push origin v${version}`);
  } catch (error) {
    console.warn('⚠️  No se pudo crear el tag de Git:', error.message);
  }
}

function showCurrentVersionInfo() {
  const { generateVersionInfo } = require('./generate-version.js');
  const versionInfo = generateVersionInfo();
  
  console.log('\n📊 INFORMACIÓN ACTUAL DE VERSIÓN:');
  console.log(`   Versión base: ${versionInfo.version}`);
  console.log(`   Versión auto: ${versionInfo.autoVersion}`);
  console.log(`   Commits: ${versionInfo.commitCount}`);
  console.log(`   Rama: ${versionInfo.branchName}`);
  console.log(`   Último commit: ${versionInfo.commitHash.substring(0, 7)}`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
🚀 GESTIÓN DE VERSIONES DEL PROYECTO

Uso:
  node scripts/version-manager.js <comando> [opciones]

Comandos:
  info                    - Mostrar información actual de versión
  patch                   - Incrementar PATCH (0.1.0 → 0.1.1)
  minor                   - Incrementar MINOR (0.1.0 → 0.2.0)  
  major                   - Incrementar MAJOR (0.1.0 → 1.0.0)
  set <version>           - Establecer versión específica
  
Opciones:
  --tag                   - Crear tag de Git automáticamente
  --message "mensaje"     - Mensaje personalizado para el tag

Ejemplos:
  npm run version:patch                    # 0.1.0 → 0.1.1
  npm run version:minor                    # 0.1.0 → 0.2.0
  npm run version:major                    # 0.1.0 → 1.0.0
  npm run version:set 1.0.0                # Versión específica
  npm run version:patch -- --tag          # Con tag de Git
`);
    return;
  }

  const currentVersion = getCurrentVersion();
  console.log(`📋 Versión actual: ${currentVersion}`);

  try {
    switch (command) {
      case 'info':
        showCurrentVersionInfo();
        break;

      case 'patch':
      case 'minor':
      case 'major':
        const newVersion = incrementVersion(currentVersion, command);
        console.log(`🔄 Actualizando versión: ${currentVersion} → ${newVersion}`);
        updatePackageVersion(newVersion);
        
        if (args.includes('--tag')) {
          const messageIndex = args.indexOf('--message');
          const message = messageIndex !== -1 ? args[messageIndex + 1] : null;
          createGitTag(newVersion, message);
        }
        
        // Regenerar información de versión
        const { generateVersionInfo } = require('./generate-version.js');
        generateVersionInfo();
        
        console.log(`✅ Versión actualizada exitosamente a ${newVersion}`);
        break;

      case 'set':
        const targetVersion = args[1];
        if (!targetVersion) {
          console.error('❌ Error: Debe especificar la versión. Ejemplo: set 1.0.0');
          process.exit(1);
        }
        
        console.log(`🔄 Estableciendo versión: ${currentVersion} → ${targetVersion}`);
        updatePackageVersion(targetVersion);
        
        if (args.includes('--tag')) {
          const messageIndex = args.indexOf('--message');
          const message = messageIndex !== -1 ? args[messageIndex + 1] : null;
          createGitTag(targetVersion, message);
        }
        
        // Regenerar información de versión
        const { generateVersionInfo: genInfo } = require('./generate-version.js');
        genInfo();
        
        console.log(`✅ Versión establecida exitosamente a ${targetVersion}`);
        break;

      default:
        console.error(`❌ Comando desconocido: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  updatePackageVersion,
  incrementVersion,
  createGitTag,
  showCurrentVersionInfo
};
