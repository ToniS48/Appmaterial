import React, { useEffect, Suspense } from 'react';
import { ChakraProvider, ColorModeScript, Box, Center, Spinner, Text } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import theme from './styles/theme';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacionProvider } from './contexts/NotificacionContext';
import { MensajeriaProvider } from './contexts/MensajeriaContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GoogleApisProvider } from './contexts/GoogleApisContext';
import AppRoutes from './routes';
import { iniciarTareasProgramadas } from './services/programacionService';
import { useVerificacionAutomaticaPrestamos } from './hooks/useVerificacionAutomaticaPrestamos';
import ErrorBoundary from './components/common/ErrorBoundary';
// Importar el servicio meteorológico para inicializarlo
import { weatherService } from './services/weatherService';
import { obtenerConfiguracionMeteorologica } from './services/configuracionService';
// Importar diagnósticos para depuración
import './utils/browser-diagnostics';
// Importar servicio de encriptación seguro
import SecureEncryption from './services/security/SecureEncryption';
// Importar Firebase para las funciones de migración
import { auth, db } from './config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// DebugHelper removido - problema MaterialSelector resuelto

// Hacer disponible el servicio de encriptación seguro globalmente
declare global {
  interface Window {
    SecureEncryption: typeof SecureEncryption;
    migrarApiKeysSeguras: () => Promise<void>;
    diagnosticarSistemaSeguro: () => Promise<void>;
    firebase: any;
    CryptoJS: any;
  }
}

// Componente de carga inicial
const LoadingFallback = () => (
  <Center h="100vh" w="100vw">
    <Box textAlign="center">
      <Spinner size="xl" color="brand.500" mb={4} />
      <Text>Iniciando aplicación...</Text>
    </Box>
  </Center>
);

// Componente interno para gestionar verificación automática
const VerificacionAutomaticaManager: React.FC = () => {
  useVerificacionAutomaticaPrestamos();
  return null; // No renderiza nada, solo ejecuta la lógica
};

function App() {
  useEffect(() => {
    // Hacer disponible el servicio de encriptación seguro
    window.SecureEncryption = SecureEncryption;
    
    // Función de migración de API keys
    window.migrarApiKeysSeguras = async () => {
      try {
        console.log('🔄 MIGRACIÓN: API Keys a Sistema Seguro');
        console.log('=====================================\n');

        console.log('1️⃣ VERIFICANDO DEPENDENCIAS...');
        console.log('✅ Firebase disponible como módulo');

        // Esperar a que el usuario esté disponible
        let currentUser = auth.currentUser;
        let attempts = 0;
        
        while (!currentUser && attempts < 10) {
          console.log(`⏳ Esperando autenticación... (intento ${attempts + 1}/10)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          currentUser = auth.currentUser;
          attempts++;
        }
        
        if (!currentUser) {
          console.error('❌ Usuario no autenticado después de esperar');
          console.log('💡 Inicia sesión antes de ejecutar la migración');
          console.log('💡 Si acabas de iniciar sesión, espera unos segundos y vuelve a intentar');
          return;
        }
        console.log('✅ Usuario autenticado:', currentUser.email);

        console.log('\n2️⃣ VERIFICANDO API KEYS EXISTENTES...');
        
        // Usar db importado en lugar de window.firebase.firestore
        const apisDocRef = doc(db, 'configuracion', 'apis');
        const apisDocSnap = await getDoc(apisDocRef);
        
        if (!apisDocSnap.exists()) {
          console.log('❌ No se encontró configuración de APIs');
          return;
        }

        const currentData = apisDocSnap.data();
        console.log('✅ Configuración de APIs encontrada');

        // Verificar si hay API key de AEMET
        if (!currentData.aemetApiKey) {
          console.log('ℹ️ No hay API key de AEMET para migrar');
          return;
        }

        console.log('📋 API key de AEMET encontrada');

        // Intentar determinar si ya está en formato nuevo
        try {
          const parsed = JSON.parse(currentData.aemetApiKey);
          if (parsed.data && parsed.metadata && parsed.integrity) {
            console.log('✅ API key ya está en formato seguro');
            
            // Verificar validez
            const isValid = await window.SecureEncryption.validateEncryptedApiKey(
              currentData.aemetApiKey, 
              currentUser
            );
            
            if (isValid) {
              console.log('✅ API key válida y accesible - No necesita migración');
              return;
            }
          }
        } catch (e) {
          console.log('📋 API key en formato antiguo detectado');
        }

        console.log('\n3️⃣ MIGRANDO AL FORMATO SEGURO...');
        
        // Importar CryptoJS dinámicamente
        let CryptoJS;
        try {
          const cryptoModule = await import('crypto-js');
          CryptoJS = cryptoModule.default || cryptoModule;
          console.log('✅ CryptoJS cargado correctamente');
        } catch (cryptoError) {
          console.error('❌ No se pudo cargar CryptoJS:', cryptoError);
          console.log('💡 Intentando usar la key sin desencriptar...');
        }
        
        // Intentar desencriptar con el método antiguo
        const oldEncryptKey = 'ESPEMO_SECRET_KEY_2024_SECURE_ENCRYPTION';
        
        let decryptedKey = '';
        try {
          if (CryptoJS && CryptoJS.AES) {
            const bytes = CryptoJS.AES.decrypt(currentData.aemetApiKey, oldEncryptKey);
            decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedKey) {
              throw new Error('Desencriptación resultó vacía');
            }
            
            console.log('✅ API key desencriptada con método antiguo');
          } else {
            throw new Error('CryptoJS no disponible');
          }
        } catch (error) {
          console.log('⚠️ Error desencriptando:', error instanceof Error ? error.message : 'Error desconocido');
          console.log('💡 Intentando usar la key sin desencriptar...');
          if (currentData.aemetApiKey.length > 10) {
            decryptedKey = currentData.aemetApiKey;
            console.log('💡 Usando la key tal como está almacenada');
          } else {
            console.error('❌ No se pudo determinar la API key válida');
            return;
          }
        }

        // Encriptar con el nuevo sistema
        const newEncryptedKey = await window.SecureEncryption.encryptApiKey(
          decryptedKey,
          currentUser,
          'aemet'
        );
        
        console.log('✅ API key encriptada con sistema seguro');
        
        // Guardar en Firestore usando updateDoc importado
        await updateDoc(apisDocRef, {
          aemetApiKey: newEncryptedKey,
          lastMigration: new Date().toISOString(),
          migrationBy: currentUser.uid,
          migrationFrom: 'legacy_encryption'
        });
        
        console.log('✅ Migración completada exitosamente');
        
        // Verificar que la migración funcionó
        console.log('\n4️⃣ VERIFICANDO MIGRACIÓN...');
        const testDecrypted = await window.SecureEncryption.decryptApiKey(
          newEncryptedKey, 
          currentUser, 
          'aemet'
        );
        
        if (testDecrypted === decryptedKey) {
          console.log('✅ Verificación exitosa - La API key se può leer correctamente');
        } else {
          console.error('❌ Error en verificación - La API key no se puede leer correctamente');
        }
        
      } catch (error) {
        console.error('❌ Error en migración:', error);
        console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'No disponible');
      }
    };

    // Función de diagnóstico
    window.diagnosticarSistemaSeguro = async () => {
      try {
        console.log('🔍 DIAGNÓSTICO: Sistema de Encriptación Seguro');
        console.log('==============================================\n');

        const componentes = {
          Firebase: true, // Firebase está disponible como módulo
          CryptoJS: 'Disponible por importación dinámica', // CryptoJS se importa cuando se necesita
          SecureEncryption: typeof window.SecureEncryption !== 'undefined'
        };
        
        console.log('📦 COMPONENTES DISPONIBLES:');
        Object.entries(componentes).forEach(([nombre, disponible]) => {
          console.log(`${disponible === true || typeof disponible === 'string' ? '✅' : '❌'} ${nombre}${typeof disponible === 'string' ? ': ' + disponible : ''}`);
        });
        
        console.log('\n👤 AUTENTICACIÓN:');
        
        // Esperar a que el usuario esté disponible
        let currentUser = auth.currentUser;
        let attempts = 0;
        
        while (!currentUser && attempts < 5) {
          console.log(`⏳ Esperando autenticación... (intento ${attempts + 1}/5)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          currentUser = auth.currentUser;
          attempts++;
        }
        
        if (currentUser) {
          console.log('✅ Usuario autenticado:', currentUser.email);
          
          console.log('\n🧪 PRUEBA DE FUNCIONAMIENTO:');
          // Prueba de encriptación
          const testData = 'test-' + Date.now();
          const encrypted = await window.SecureEncryption.encryptApiKey(testData, currentUser, 'test');
          const decrypted = await window.SecureEncryption.decryptApiKey(encrypted, currentUser, 'test');
          
          if (decrypted === testData) {
            console.log('✅ Sistema funcionando correctamente');
          } else {
            console.error('❌ Error: datos no coinciden');
          }
          
          console.log('\n📋 ESTADO DE APIS:');
          // Verificar configuración existente
          const apisDocRef = doc(db, 'configuracion', 'apis');
          const apisDocSnap = await getDoc(apisDocRef);
          
          if (apisDocSnap.exists()) {
            const data = apisDocSnap.data();
            console.log('✅ Documento de configuración existe');
            
            if (data.aemetApiKey) {
              try {
                const parsed = JSON.parse(data.aemetApiKey);
                if (parsed.data && parsed.metadata && parsed.integrity) {
                  console.log('✅ API key AEMET en formato seguro');
                  
                  const isValid = await window.SecureEncryption.validateEncryptedApiKey(
                    data.aemetApiKey, 
                    currentUser
                  );
                  console.log(`${isValid ? '✅' : '❌'} API key ${isValid ? 'válida y accesible' : 'no válida o inaccesible'}`);
                } else {
                  console.log('⚠️ API key AEMET en formato antiguo - necesita migración');
                }
              } catch (e) {
                console.log('⚠️ API key AEMET en formato antiguo - necesita migración');
              }
            } else {
              console.log('ℹ️ No hay API key de AEMET configurada');
            }
          } else {
            console.log('❌ No existe documento de configuración de APIs');
          }
          
        } else {
          console.log('❌ Usuario no autenticado');
          console.log('💡 Inicia sesión para realizar un diagnóstico completo');
        }
        
        console.log('\n🎯 PRÓXIMOS PASOS:');
        if (currentUser) {
          console.log('• Para migrar: await migrarApiKeysSeguras()');
          console.log('• Para limpiar consola: console.clear()');
        } else {
          console.log('• Inicia sesión en la aplicación');
          console.log('• Vuelve a ejecutar: await diagnosticarSistemaSeguro()');
        }
        
      } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'No disponible');
      }
    };
    
    // Iniciar tareas programadas cuando la app se monte
    iniciarTareasProgramadas();
    
    // Inicializar servicio meteorológico
    const initWeatherService = async () => {
      try {
        console.log('🌤️ Inicializando servicio meteorológico...');
        const weatherConfig = await obtenerConfiguracionMeteorologica();
        
        // Transformar WeatherConfig de Firestore a OpenMeteoConfig para weatherService
        const openMeteoConfig = {
          enabled: weatherConfig.weatherEnabled,
          defaultLocation: {
            lat: 40.4168,
            lon: -3.7038,
            name: 'Madrid, España'
          },
          temperatureUnit: weatherConfig.temperatureUnit,
          windSpeedUnit: weatherConfig.windSpeedUnit,
          precipitationUnit: weatherConfig.precipitationUnit,
          aemet: {
            enabled: weatherConfig.aemetEnabled,
            apiKey: '', // Se cargará desde APIs config
            useForSpain: weatherConfig.aemetUseForSpain
          }
        };
        
        // Cargar API key de AEMET si está habilitado
        if (weatherConfig.aemetEnabled) {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const apisDocRef = doc(db, 'configuracion', 'apis');
            const apisDocSnap = await getDoc(apisDocRef);
            
            if (apisDocSnap.exists()) {
              const apisData = apisDocSnap.data();
              if (apisData.aemetApiKey) {
                // Intentar desencriptar la API key si está disponible
                if (typeof window.SecureEncryption !== 'undefined' && auth.currentUser) {
                  try {
                    const decryptedKey = await window.SecureEncryption.decryptApiKey(
                      apisData.aemetApiKey,
                      auth.currentUser,
                      'aemet'
                    );
                    openMeteoConfig.aemet.apiKey = decryptedKey;
                    console.log('✅ API key de AEMET cargada y desencriptada');
                  } catch (decryptError) {
                    console.warn('⚠️ No se pudo desencriptar API key de AEMET:', decryptError);
                    openMeteoConfig.aemet.apiKey = apisData.aemetApiKey; // Usar como está
                  }
                } else {
                  openMeteoConfig.aemet.apiKey = apisData.aemetApiKey; // Usar como está
                }
              }
            }
          } catch (apiError) {
            console.warn('⚠️ Error cargando API key de AEMET:', apiError);
          }
        }
        
        await weatherService.configure(openMeteoConfig);
        
        if (weatherService.isEnabled()) {
          console.log('✅ Servicio meteorológico habilitado');
          // Exponer en window para debugging
          (window as any).weatherService = weatherService;
        } else {
          console.log('⚠️ Servicio meteorológico deshabilitado - ir a Configuración → Clima para habilitarlo');
        }
      } catch (error) {
        console.error('❌ Error inicializando servicio meteorológico:', error);
      }
    };
    
    initWeatherService();
    
    // Verificar estado inicial de autenticación
    const checkInitialAuth = () => {
      // Buscar token con cualquier patrón relacionado con firebase:authUser:
      const tokenKey = Object.keys(localStorage).find(key => 
        key.startsWith('firebase:authUser:')
      );
      
      if (tokenKey) {
        try {
          const authData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
          console.log('Token encontrado:', tokenKey);  // Esto revelará la estructura exacta
          console.log('Token para usuario:', authData.email || 'usuario desconocido');
          return true;
        } catch (e) {
          console.error('Error al leer token:', e);
          return false;
        }
      } else {
        console.log('No se encontró token de autenticación');
        return false;
      }
    };
    
    // Verificar inmediatamente
    checkInitialAuth();
    
    // Verificar periódicamente
    const authCheckInterval = setInterval(() => {
      const hasToken = checkInitialAuth();
      console.log(`Estado de autenticación (${new Date().toLocaleTimeString()}):`, 
        hasToken ? 'Token presente' : 'Sin token');
    }, 60000); // Verificar cada minuto
    
    return () => {
      clearInterval(authCheckInterval);      
    };
  }, []);

  useEffect(() => {
    // Exponer servicios para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      // Importar dinámicamente el servicio para evitar problemas de orden
      import('./services/firestore/FirestoreDynamicService').then(({ firestoreDynamicService }) => {
        (window as any).firestoreDynamicService = firestoreDynamicService;
        console.log('🔧 FirestoreDynamicService expuesto globalmente para debugging');
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Suspense fallback={<LoadingFallback />}>
          <Router>
            <ThemeProvider>
              <AuthProvider>
                <NotificacionProvider>
                  <MensajeriaProvider>
                    <GoogleApisProvider>
                      <VerificacionAutomaticaManager />
                      <AppRoutes />
                    </GoogleApisProvider>
                  </MensajeriaProvider>
                </NotificacionProvider>
              </AuthProvider>
            </ThemeProvider>
          </Router>
        </Suspense>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default App;
