const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Script para generar información de versión durante el build
 * Captura información del commit actual y la hace disponible para la aplicación
 */

function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    const commitDate = execSync('git log -1 --format=%cd --date=short', { encoding: 'utf8' }).trim();
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim().split('\n')[0];
    
    return {
      commitHash,
      commitCount,
      commitDate,
      branchName,
      commitMessage,
      buildDate: new Date().toISOString()
    };
  } catch (error) {
    console.warn('No se pudo obtener información de Git:', error.message);
    return {
      commitHash: 'unknown',
      commitCount: '0',
      commitDate: 'unknown',
      branchName: 'unknown',
      commitMessage: 'unknown',
      buildDate: new Date().toISOString()
    };
  }
}

function generateVersionInfo() {
  const packageJson = require('../package.json');
  const gitInfo = getGitInfo();
  
  // Generar versión automática basada en commits
  const baseVersion = packageJson.version; // 0.1.0
  const majorMinor = baseVersion.split('.').slice(0, 2).join('.'); // 0.1
  const autoVersion = `${majorMinor}.${gitInfo.commitCount}`; // 0.1.65
  
  const versionInfo = {
    version: baseVersion, // Versión original del package.json
    autoVersion: autoVersion, // Versión automática con build
    displayVersion: autoVersion, // Versión que se mostrará
    name: packageJson.name,
    ...gitInfo
  };
  
  // Crear el archivo de información de versión
  const versionFilePath = path.join(__dirname, '../src/version-info.json');
  fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2));
    // Crear archivo .env.local para variables de entorno
  const envContent = `REACT_APP_VERSION=${versionInfo.version}
REACT_APP_AUTO_VERSION=${versionInfo.autoVersion}
REACT_APP_DISPLAY_VERSION=${versionInfo.displayVersion}
REACT_APP_COMMIT_HASH=${versionInfo.commitHash}
REACT_APP_BUILD_NUMBER=${versionInfo.commitCount}
REACT_APP_COMMIT_DATE=${versionInfo.commitDate}
REACT_APP_BRANCH_NAME=${versionInfo.branchName}
REACT_APP_BUILD_DATE=${versionInfo.buildDate}
`;
  
  const envFilePath = path.join(__dirname, '../.env.local');
  fs.writeFileSync(envFilePath, envContent);
    console.log('✅ Información de versión generada:');
  console.log(`   Versión base: ${versionInfo.version}`);
  console.log(`   Versión auto: ${versionInfo.autoVersion}`);
  console.log(`   Commit: ${versionInfo.commitHash.substring(0, 7)}`);
  console.log(`   Build: ${versionInfo.commitCount}`);
  console.log(`   Rama: ${versionInfo.branchName}`);
  console.log(`   Fecha: ${versionInfo.commitDate}`);
  
  return versionInfo;
}

if (require.main === module) {
  generateVersionInfo();
}

module.exports = { generateVersionInfo, getGitInfo };
