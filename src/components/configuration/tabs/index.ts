// Exportaciones de componentes de pestañas de configuración
export { default as VariablesTab } from './VariablesTab';
export { default as MaterialTab } from './MaterialTab';
export { default as ApisTab } from './ApisTab';
export { default as SecurityTab } from './SecurityTab';
export { default as PermissionsTab } from './PermissionsTab';
export { default as DropdownsTab } from './DropdownsTab';
export { default as SystemViewerTab } from './SystemViewerTab';

// Tipos para las pestañas
export interface TabConfig {
  id: string;
  label: string;
  roles: ('admin' | 'vocal')[];
}

export interface BaseTabProps {
  settings: any;
  userRole: 'admin' | 'vocal';
}
