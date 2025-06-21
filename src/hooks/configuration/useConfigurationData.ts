import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ConfigSettings } from '../../types/configuration';

export const useConfigurationData = (userRole: 'admin' | 'vocal') => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ConfigSettings>({
    // Variables del sistema configurables
    variables: {
      // Gestión de préstamos y devoluciones
      diasGraciaDevolucion: 3,
      diasMaximoRetraso: 15,
      diasBloqueoPorRetraso: 30,
      // Notificaciones automáticas
      recordatorioPreActividad: 7,
      recordatorioDevolucion: 1,
      notificacionRetrasoDevolucion: 3,
      diasAntelacionRevision: 30,
      
      // Gestión de material
      tiempoMinimoEntrePrestamos: 1,
      porcentajeStockMinimo: 20,
      diasRevisionPeriodica: 180,
      
      // Gestión de actividades
      diasMinimoAntelacionCreacion: 3,
      diasMaximoModificacion: 2,
      limiteParticipantesPorDefecto: 20,
      
      // Sistema de puntuación y reputación
      penalizacionRetraso: 5,
      bonificacionDevolucionTemprana: 2,
      umbraLinactividadUsuario: 365,
      // Configuración de reportes
      diasHistorialReportes: 365,
      limiteElementosExportacion: 1000,
    },
    
    // Configuración de APIs y servicios externos
    apis: {
      // URLs de Google Drive del club
      googleDriveUrl: '',
      googleDriveTopoFolder: '',
      googleDriveDocFolder: '',
      
      // Servicios meteorológicos
      weatherEnabled: true,
      weatherApiKey: '',
      weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
      aemetEnabled: false,
      aemetApiKey: '',
      aemetUseForSpain: true,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      precipitationUnit: 'mm',
      
      // Configuración de backup
      backupApiKey: '',
      
      // Servicios de notificaciones
      emailServiceKey: '',
      smsServiceKey: '',
      notificationsEnabled: true,
      
      // Analytics
      analyticsKey: '',
      analyticsEnabled: false,
    },
    
    // Configuraciones adicionales solo para admin
    ...(userRole === 'admin' && {
      backupAutomatico: true,
      frecuenciaBackup: 'semanal'
    })
  });

  // Cargar configuraciones desde Firebase
  useEffect(() => {
    const cargarConfiguraciones = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, "configuracion", "global");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error al cargar la configuración:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración",
          status: "error",
          duration: 5000,
          isClosable: true,
        });      } finally {
        setIsLoading(false);
      }
    };

    cargarConfiguraciones();
  }, [toast]);

  return {
    settings,
    isLoading
  };
};
