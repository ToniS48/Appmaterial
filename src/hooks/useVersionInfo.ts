import { useMemo } from 'react';
import packageJson from '../../package.json';

interface VersionInfo {
  version: string;
  autoVersion: string;
  displayVersion: string;
  commitHash: string;
  buildNumber: string;
  commitDate: string;
  branchName: string;
  buildDate: string;
  shortHash: string;
}

/**
 * Hook para obtener información de versión del proyecto
 * Combina información del package.json con variables de entorno del build
 */
export const useVersionInfo = (): VersionInfo => {  const versionInfo = useMemo(() => {
    // Información básica del package.json
    const baseVersion = packageJson.version;
    
    // Variables de entorno del build (generadas por el script)
    const autoVersion = process.env.REACT_APP_AUTO_VERSION || baseVersion;
    const displayVersion = process.env.REACT_APP_DISPLAY_VERSION || autoVersion;
    const commitHash = process.env.REACT_APP_COMMIT_HASH || 'dev';
    const buildNumber = process.env.REACT_APP_BUILD_NUMBER || '0';
    const commitDate = process.env.REACT_APP_COMMIT_DATE || new Date().toISOString().split('T')[0];
    const branchName = process.env.REACT_APP_BRANCH_NAME || 'local';
    const buildDate = process.env.REACT_APP_BUILD_DATE || new Date().toISOString();
    
    // Hash corto para mostrar
    const shortHash = commitHash.substring(0, 7);
    
    return {
      version: baseVersion,
      autoVersion,
      displayVersion,
      commitHash,
      buildNumber,
      commitDate,
      branchName,
      buildDate,
      shortHash
    };
  }, []);

  return versionInfo;
};

/**
 * Hook para obtener solo la versión básica
 */
export const useVersion = (): string => {
  return `v${useVersionInfo().displayVersion}`;
};

/**
 * Hook para obtener información extendida de versión como string formateado
 */
export const useVersionString = (format: 'short' | 'full' | 'build' = 'short'): string => {
  const info = useVersionInfo();
  
  switch (format) {
    case 'short':
      return `v${info.displayVersion} (${info.shortHash})`;
    case 'full':
      return `v${info.displayVersion} - Build ${info.buildNumber} - ${info.commitDate}`;
    case 'build':
      return `v${info.displayVersion}.${info.buildNumber}`;
    default:
      return `v${info.displayVersion}`;
  }
};
