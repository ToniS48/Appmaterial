// Exportaciones principales de componentes de versión
export { default as VersionDisplay } from './VersionDisplay';
export { default as AdvancedVersionDisplay, VersionInfoModal } from './AdvancedVersionDisplay';
export { default as InlineVersion } from './InlineVersion';
export { default as VersionDemo } from './VersionDemo';

// Re-exportación del hook para comodidad
export { useVersionInfo, useVersion, useVersionString } from '../../hooks/useVersionInfo';
