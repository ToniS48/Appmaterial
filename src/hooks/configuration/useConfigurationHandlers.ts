import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ConfigSettings } from '../../types/configuration';

export const useConfigurationHandlers = (initialSettings: ConfigSettings) => {
  const toast = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleVariableChange = (variableName: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [variableName]: value
      }
    }));
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
  };
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const docRef = doc(db, "configuracion", "global");
      await updateDoc(docRef, settings as any);
      
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
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
