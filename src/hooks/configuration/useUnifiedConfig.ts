import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToast } from '@chakra-ui/react';

/**
 * Hook unificado para gestión de configuración
 * Elimina duplicaciones y proporciona una interfaz consistente
 */
export const useUnifiedConfig = <T>(
  documentId: string,
  defaultConfig: T,
  section?: string
) => {
  const [data, setData] = useState<T>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Cargar configuración
  const loadConfig = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'configuracion', documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const configData = docSnap.data();
        // Si hay una sección específica, extraerla; sino usar todo el documento
        const finalData = section ? configData[section] || defaultConfig : configData;
        setData({ ...defaultConfig, ...finalData });
      } else {
        setData(defaultConfig);
      }
    } catch (error) {
      console.error(`Error loading config from ${documentId}:`, error);
      setData(defaultConfig);
      toast({
        title: 'Error al cargar configuración',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración
  const saveConfig = async (newData?: T) => {
    try {
      setSaving(true);
      const dataToSave = newData || data;
      const docRef = doc(db, 'configuracion', documentId);
      
      if (section) {
        // Guardar en una sección específica del documento
        const currentDoc = await getDoc(docRef);
        const currentData = currentDoc.exists() ? currentDoc.data() : {};
        await setDoc(docRef, {
          ...currentData,
          [section]: dataToSave
        }, { merge: true });      } else {
        // Guardar todo el documento
        await setDoc(docRef, dataToSave as any, { merge: true });
      }
      
      toast({
        title: 'Configuración guardada',
        status: 'success',
        duration: 2000,
      });
      
      return true;
    } catch (error) {
      console.error(`Error saving config to ${documentId}:`, error);
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar la configuración',
        status: 'error',
        duration: 3000,
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Recargar configuración
  const reload = () => {
    loadConfig();
  };

  useEffect(() => {
    loadConfig();
  }, [documentId, section]);

  return {
    data,
    setData,
    loading,
    saving,
    save: saveConfig,
    reload
  };
};

/**
 * Hook específico para configuración de APIs
 */
export const useApisConfig = () => {
  return useUnifiedConfig('apis', {
    // Google APIs
    driveApiKey: '',
    mapsEmbedApiKey: '',
    calendarApiKey: '',
    gmailApiKey: '',
    chatApiKey: '',
    cloudMessagingApiKey: '',
    
    // Weather APIs
    weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
    aemetApiKey: '',
  });
};

/**
 * Hook específico para variables del sistema
 */
export const useVariablesConfig = () => {
  return useUnifiedConfig('variables', {
    // Gestión de préstamos
    diasGraciaDevolucion: 3,
    diasMaximoRetraso: 15,
    diasBloqueoPorRetraso: 30,
    tiempoMinimoEntrePrestamos: 0,
    
    // Notificaciones
    recordatorioPreActividad: 1,
    recordatorioDevolucion: 1,
    notificacionRetrasoDevolucion: 0,
    
    // Gestión de actividades
    diasAntelacionRevision: 15,
    diasMinimoAntelacionCreacion: 0,
    diasMaximoModificacion: 0,
    limiteParticipantesPorDefecto: 0,
    
    // Material
    porcentajeStockMinimo: 10,
    diasRevisionPeriodica: 90,
    
    // Sistema de reputación
    penalizacionRetraso: 0,
    bonificacionDevolucionTemprana: 0,
    umbraLinactividadUsuario: 0,
    
    // Reportes
    diasHistorialReportes: 90,
    limiteElementosExportacion: 1000,
    
    // Meteorología
    weatherEnabled: false,
    aemetEnabled: false,
    aemetUseForSpain: false,
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    precipitationUnit: 'mm'
  });
};

/**
 * Hook específico para configuración de material
 */
export const useMaterialConfig = () => {
  return useUnifiedConfig('material', {
    porcentajeStockMinimo: 10,
    diasRevisionPeriodica: 90,
    tiempoMinimoEntrePrestamos: 0,
  });
};
