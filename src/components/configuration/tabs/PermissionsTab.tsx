import React, { useState } from 'react';
import {
  TabPanel,
  VStack
} from '@chakra-ui/react';
import { useSectionConfig } from '../../../hooks/configuration/useSectionConfig';
import { PermissionsSection } from '../sections';

const defaultPermissionsConfig = {
  vocalPermissions: [],
  userPermissions: [],
};

interface PermissionsTabProps {
  userRole: 'admin' | 'vocal';
}

/**
 * Pestaña de Configuración de Permisos
 * Solo disponible para administradores
 */
const PermissionsTab: React.FC<PermissionsTabProps> = ({
  userRole
}) => {
  const { data: config, setData: setConfig, loading, save } = useSectionConfig('permissions', defaultPermissionsConfig);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      await save(config);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
      setSuccess(false);
    }
  };

  if (loading) return <VStack><span>Cargando configuración...</span></VStack>;

  return (
    <TabPanel>
      <PermissionsSection
        config={config}
        setConfig={setConfig}
        userRole={userRole}
        onSave={handleSave}
        saveSuccess={success}
        saveError={error}
      />
    </TabPanel>
  );
};

export default PermissionsTab;
