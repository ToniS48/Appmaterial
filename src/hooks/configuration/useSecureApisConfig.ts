/**
 * Hook seguro especializado para configuración de APIs
 * Utiliza el nuevo sistema de encriptación seguro basado en usuario
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { useToast } from '@chakra-ui/react';
import { SecureEncryption } from '../../services/security/SecureEncryption';

export interface ApisConfig {
  // Google APIs (no encriptadas - pueden ser públicas)
  driveApiKey: string;
  mapsEmbedApiKey: string;
  calendarApiKey: string;
  gmailApiKey: string;
  chatApiKey: string;
  cloudMessagingApiKey: string;
  
  // Weather APIs
  weatherApiUrl: string;
  aemetApiKey: string; // Esta se encripta
  
  // Cloud Functions Proxy para AEMET
  aemetFunctionUrl: string;
  aemetFunctionKey: string; // Clave para acceder a la función
}

interface SecureApisHookResult {
  data: ApisConfig;
  setData: (data: ApisConfig | ((prev: ApisConfig) => ApisConfig)) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: (newData?: Partial<ApisConfig>) => Promise<boolean>;
  reload: () => Promise<void>;
  // Métodos específicos para API keys sensibles
  setAemetApiKey: (apiKey: string) => Promise<boolean>;
  getDecryptedAemetApiKey: () => Promise<string>;
  validateAemetApiKey: () => Promise<boolean>;
}

const defaultConfig: ApisConfig = {
  driveApiKey: '',
  mapsEmbedApiKey: '',
  calendarApiKey: '',
  gmailApiKey: '',
  chatApiKey: '',
  cloudMessagingApiKey: '',
  weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
  aemetApiKey: '',
  aemetFunctionUrl: '',
  aemetFunctionKey: ''
};

/**
 * Hook seguro para configuración de APIs con encriptación automática
 */
export const useSecureApisConfig = (): SecureApisHookResult => {
  const { currentUser: user } = useAuth();
  const [data, setData] = useState<ApisConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  // Cache para datos desencriptados
  const decryptedCacheRef = useRef<{ [key: string]: string }>({});
  
  // Función para cargar configuración
  const loadConfig = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, 'configuracion', 'apis');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        
        // Datos que se almacenan sin encriptar
        const unencryptedData = {
          driveApiKey: firestoreData.driveApiKey || '',
          mapsEmbedApiKey: firestoreData.mapsEmbedApiKey || '',
          calendarApiKey: firestoreData.calendarApiKey || '',
          gmailApiKey: firestoreData.gmailApiKey || '',
          chatApiKey: firestoreData.chatApiKey || '',
          cloudMessagingApiKey: firestoreData.cloudMessagingApiKey || '',
          weatherApiUrl: firestoreData.weatherApiUrl || defaultConfig.weatherApiUrl,
          aemetApiKey: '' // Se manejará por separado
        };
        
        // Manejar API key encriptada de AEMET
        let decryptedAemetKey = '';
        if (firestoreData.aemetApiKey) {
          try {
            // Verificar si necesita actualización
            if (SecureEncryption.needsUpdate(firestoreData.aemetApiKey)) {
              console.log('API key de AEMET necesita actualización, reencriptando...');
              const reencrypted = await SecureEncryption.reencryptApiKey(
                firestoreData.aemetApiKey, 
                user, 
                'aemet'
              );
              
              // Actualizar en Firestore
              await updateDoc(docRef, { aemetApiKey: reencrypted });
              decryptedAemetKey = await SecureEncryption.decryptApiKey(reencrypted, user, 'aemet');
            } else {
              decryptedAemetKey = await SecureEncryption.decryptApiKey(
                firestoreData.aemetApiKey, 
                user, 
                'aemet'
              );
            }
            
            // Guardar en cache
            decryptedCacheRef.current['aemet'] = decryptedAemetKey;
          } catch (decryptError) {
            console.error('Error desencriptando API key de AEMET:', decryptError);
            toast({
              title: 'Advertencia',
              description: 'No se pudo desencriptar la API key de AEMET. Puede necesitar reconfigurarla.',
              status: 'warning',
              duration: 5000,
            });
          }
        }
        
        const completeData = {
          ...unencryptedData,
          aemetApiKey: decryptedAemetKey,
          // Añadir datos de proxy AEMET
          aemetFunctionUrl: firestoreData.aemetFunctionUrl || '',
          aemetFunctionKey: firestoreData.aemetFunctionKey || ''
        };
        
        setData(completeData);
      } else {
        // Crear documento con configuración por defecto
        await setDoc(docRef, defaultConfig);
        setData(defaultConfig);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar configuración';
      setError(errorMessage);
      console.error('Error loading APIs config:', err);
      toast({
        title: 'Error al cargar',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Función para guardar configuración
  const saveConfig = useCallback(async (newData?: Partial<ApisConfig>): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para guardar la configuración',
        status: 'error',
        duration: 5000,
      });
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      
      const dataToSave = newData ? { ...data, ...newData } : data;
      const docRef = doc(db, 'configuracion', 'apis');
      
      // Separar datos encriptados de no encriptados
      const { aemetApiKey, ...unencryptedData } = dataToSave;
      
      // Preparar datos para Firestore
      const firestoreData = {
        ...unencryptedData,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.uid
      };
      
      // Encriptar API key de AEMET si existe
      if (aemetApiKey && aemetApiKey.trim()) {
        const encryptedAemetKey = await SecureEncryption.encryptApiKey(
          aemetApiKey.trim(), 
          user, 
          'aemet'
        );
        (firestoreData as any).aemetApiKey = encryptedAemetKey;
        
        // Actualizar cache
        decryptedCacheRef.current['aemet'] = aemetApiKey.trim();
      } else {
        // Si se vacía la API key, eliminarla
        (firestoreData as any).aemetApiKey = '';
        delete decryptedCacheRef.current['aemet'];
      }
      
      await setDoc(docRef, firestoreData, { merge: true });
      
      // Actualizar estado local
      setData(dataToSave);
      
      toast({
        title: 'Configuración guardada',
        description: 'La configuración de APIs se ha guardado correctamente',
        status: 'success',
        duration: 2000,
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar';
      setError(errorMessage);
      console.error('Error saving APIs config:', err);
      toast({
        title: 'Error al guardar',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, user, toast]);

  // Función específica para establecer API key de AEMET
  const setAemetApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    if (!user) return false;
    
    const newData = { ...data, aemetApiKey: apiKey };
    const success = await saveConfig(newData);
    
    if (success) {
      setData(newData);
    }
    
    return success;
  }, [data, saveConfig, user]);

  // Función para obtener API key desencriptada de AEMET
  const getDecryptedAemetApiKey = useCallback(async (): Promise<string> => {
    if (!user) return '';
    
    // Verificar cache primero
    if (decryptedCacheRef.current['aemet']) {
      return decryptedCacheRef.current['aemet'];
    }
    
    // Si no está en cache, intentar cargar de Firestore
    try {
      const docRef = doc(db, 'configuracion', 'apis');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        if (firestoreData.aemetApiKey) {
          const decrypted = await SecureEncryption.decryptApiKey(
            firestoreData.aemetApiKey, 
            user, 
            'aemet'
          );
          decryptedCacheRef.current['aemet'] = decrypted;
          return decrypted;
        }
      }
    } catch (error) {
      console.error('Error obteniendo API key desencriptada:', error);
    }
    
    return '';
  }, [user]);

  // Función para validar API key de AEMET
  const validateAemetApiKey = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const docRef = doc(db, 'configuracion', 'apis');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        if (firestoreData.aemetApiKey) {
          return await SecureEncryption.validateEncryptedApiKey(
            firestoreData.aemetApiKey, 
            user
          );
        }
      }
    } catch (error) {
      console.error('Error validando API key:', error);
    }
    
    return false;
  }, [user]);

  // Cargar configuración al montar y cuando cambie el usuario
  useEffect(() => {
    if (user) {
      loadConfig();
    } else {
      // Limpiar datos si no hay usuario
      setData(defaultConfig);
      decryptedCacheRef.current = {};
      setLoading(false);
    }
  }, [user, loadConfig]);

  // Limpiar cache al desmontar
  useEffect(() => {
    return () => {
      decryptedCacheRef.current = {};
    };
  }, []);

  return {
    data,
    setData,
    loading,
    saving,
    error,
    save: saveConfig,
    reload: loadConfig,
    setAemetApiKey,
    getDecryptedAemetApiKey,
    validateAemetApiKey
  };
};

export default useSecureApisConfig;
