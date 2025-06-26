import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ConfigSettings } from '../../types/configuration';

export const useConfigurationHandlers = (initialSettings: ConfigSettings) => {
  const toast = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const handleVariableChange = (variableName: string, value: number) => {
    console.log(`🔧 ConfigurationHandlers - Cambiando variable: ${variableName} = ${value}`);
    setSettings(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [variableName]: value
      }
    }));
    console.log('✅ ConfigurationHandlers - Variable actualizada en el estado local');
  };

  const handleApiChange = (apiName: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      apis: {
        ...prev.apis,
        [apiName]: value
      }
    }));
  };

  const handleSettingsChange = (newSettings: Partial<ConfigSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      console.log('💾 ConfigurationHandlers - Iniciando guardado...');
      console.log('📋 ConfigurationHandlers - Datos a guardar:', settings);
      
      // Guardar en documentos separados según la sección
      // Variables
      const variablesRef = doc(db, "configuracion", "variables");
      await setDoc(variablesRef, settings.variables, { merge: true });
      // APIs
      const apisRef = doc(db, "configuracion", "apis");
      await setDoc(apisRef, settings.apis, { merge: true });
      // Otros módulos pueden añadirse aquí
      // El guardado de notificaciones debe hacerse desde el hook/sección correspondiente, no desde aquí
      
      console.log('✅ ConfigurationHandlers - Guardado exitoso');
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("❌ ConfigurationHandlers - Error al guardar:", error);
      console.error("📋 ConfigurationHandlers - Detalles del error:", {
        code: error?.code,
        message: error?.message
      });
      
      toast({
        title: "Error al guardar",
        description: `No se pudieron guardar los cambios: ${error?.message || 'Error desconocido'}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    setSettings,
    isLoading,
    handleVariableChange,
    handleApiChange,
    handleSettingsChange,
    handleSubmit
  };
};
