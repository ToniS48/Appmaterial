import { useState, useEffect } from 'react';
import { useUnifiedConfig } from './useUnifiedConfig';

/**
 * Hook de compatibilidad para useConfigurationData
 * Proporciona una interfaz compatible con el hook anterior
 * usando internamente el hook unificado
 */
export const useConfigurationData = (userRole: 'admin' | 'vocal') => {
  const [globalSettings, setGlobalSettings] = useState<any>({
    dropdowns: {},
    variables: {},
    apis: {},
    material: {},
    permissions: {},
    security: {}
  });

  // Usar hooks unificados para cada sección
  const { data: dropdownsData, save: saveDropdownsData, loading: loadingDropdowns } = useUnifiedConfig('dropdowns', {});
  const { data: variablesData, save: saveVariablesData, loading: loadingVariables } = useUnifiedConfig('variables', {});
  const { data: apisData, save: saveApisData, loading: loadingApis } = useUnifiedConfig('apis', {});
  const { data: materialData, save: saveMaterialData, loading: loadingMaterial } = useUnifiedConfig('material', {});
  const { data: permissionsData, save: savePermissionsData, loading: loadingPermissions } = useUnifiedConfig('permissions', {});
  const { data: securityData, save: saveSecurityData, loading: loadingSecurity } = useUnifiedConfig('security', {});

  // Consolidar todos los datos en un solo objeto settings
  useEffect(() => {
    setGlobalSettings({
      dropdowns: dropdownsData,
      variables: variablesData,
      apis: apisData,
      material: materialData,
      permissions: permissionsData,
      security: securityData
    });
  }, [dropdownsData, variablesData, apisData, materialData, permissionsData, securityData]);

  // Funciones de guardado para cada sección
  const saveDropdowns = async (data: any) => {
    await saveDropdownsData(data);
  };

  const saveVariables = async (data: any) => {
    await saveVariablesData(data);
  };

  const saveApis = async (data: any) => {
    await saveApisData(data);
  };

  const saveMaterial = async (data: any) => {
    await saveMaterialData(data);
  };

  const savePermissions = async (data: any) => {
    await savePermissionsData(data);
  };

  const saveSecurity = async (data: any) => {
    await saveSecurityData(data);
  };

  // Funciones de recarga
  const reload = () => {
    // Recargar todas las secciones
    window.location.reload();
  };

  // Determinar si está cargando alguna sección
  const isLoading = loadingDropdowns || loadingVariables || loadingApis || 
                   loadingMaterial || loadingPermissions || loadingSecurity;

  return {
    settings: globalSettings,
    isLoading,
    userRole,
    reload, // Añadir función reload
    // Funciones de guardado específicas
    saveDropdowns,
    saveVariables,
    saveApis,
    saveMaterial,
    savePermissions,
    saveSecurity
  };
};

export default useConfigurationData;
