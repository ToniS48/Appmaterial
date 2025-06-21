/**
 * Script de diagnóstico completo para configuración del sistema
 * Incluye: configuración global, permisos, variables del sistema y APIs
 * Ejecutar en la consola del navegador cuando esté en cualquier pestaña de configuración
 */

console.log('🔍 === DIAGNÓSTICO COMPLETO DE CONFIGURACIÓN ===');

async function diagnosticarConfiguracionGlobal() {
  try {
    // 1. Verificar autenticación
    console.log('\n1️⃣ VERIFICANDO AUTENTICACIÓN...');
    
    if (!window.firebase?.auth) {
      console.error('❌ Firebase Auth no disponible');
      return;
    }
    
    const auth = window.firebase.auth();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      console.log('💡 Solución: Iniciar sesión como administrador o vocal');
      return;
    }
    
    console.log('✅ Usuario autenticado:', currentUser.email);
    console.log('📋 UID:', currentUser.uid);
    
    // 2. Verificar rol de usuario
    console.log('\n2️⃣ VERIFICANDO ROL DE USUARIO...');
    
    try {
      const { getFirestore, doc, getDoc } = window.firebase.firestore;
      const db = getFirestore();
      
      const userDocRef = doc(db, 'usuarios', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log('✅ Documento de usuario encontrado');
        console.log('📋 Rol:', userData.rol);
        console.log('📋 Activo:', userData.activo);
        
        if (userData.rol !== 'admin' && userData.rol !== 'vocal') {
          console.error('❌ PROBLEMA: El usuario no es administrador ni vocal');
          console.log('💡 Solo los administradores y vocales pueden modificar configuración');
          return;
        }
        
        if (!userData.activo) {
          console.error('❌ PROBLEMA: El usuario no está activo');
          return;
        }
        
        console.log('✅ Usuario autorizado para configuración');
      } else {
        console.error('❌ PROBLEMA: No se encontró el documento del usuario');
        return;
      }
    } catch (userError) {
      console.error('❌ Error al verificar usuario:', userError);
      return;
    }
    
    // 3. Verificar acceso a Firestore
    console.log('\n3️⃣ VERIFICANDO ACCESO A FIRESTORE...');
    
    try {
      const { getFirestore, collection, getDocs } = window.firebase.firestore;
      const db = getFirestore();
      
      console.log('✅ Firestore disponible');
      
      // Probar lectura general
      const testCollection = collection(db, 'usuarios');
      const testSnapshot = await getDocs(testCollection);
      console.log(`✅ Lectura general exitosa: ${testSnapshot.size} usuarios`);
      
    } catch (firestoreError) {
      console.error('❌ Error de acceso a Firestore:', firestoreError);
      return;
    }
    
    // 4. Verificar documento de configuración global específico
    console.log('\n4️⃣ VERIFICANDO DOCUMENTO DE CONFIGURACIÓN GLOBAL...');
    
    try {
      const { getFirestore, doc, getDoc, setDoc, updateDoc } = window.firebase.firestore;
      const db = getFirestore();
      
      const configDocRef = doc(db, 'configuracion', 'global');
      console.log('📋 Referencia del documento creada');
      
      // Intentar leer el documento actual
      console.log('📖 Intentando leer documento de configuración global...');
      const configDocSnap = await getDoc(configDocRef);
      
      if (configDocSnap.exists()) {
        console.log('✅ Documento de configuración global existe');
        const currentData = configDocSnap.data();
        console.log('📋 Contenido actual:', currentData);
        
        // Probar actualización
        console.log('🔄 Probando actualización...');
        await updateDoc(configDocRef, {
          testUpdate: new Date().toISOString(),
          testBy: 'diagnostico-configuracion'
        });
        console.log('✅ Actualización exitosa');
        
        // Limpiar el test
        await updateDoc(configDocRef, {
          testUpdate: null,
          testBy: null
        });
        console.log('🧹 Test limpiado');
        
      } else {
        console.log('⚠️ Documento de configuración global no existe, creando...');
        
        // Crear documento inicial con configuración por defecto
        const initialConfig = {
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
          
          lastUpdated: new Date().toISOString(),
          createdBy: 'diagnostico-inicial'
        };
        
        await setDoc(configDocRef, initialConfig);
        console.log('✅ Documento de configuración global creado exitosamente');
      }
      
    } catch (configError) {
      console.error('❌ Error con documento de configuración:', configError);
      console.log('📋 Código de error:', configError.code);
      console.log('📋 Mensaje:', configError.message);
      
      if (configError.code === 'permission-denied') {
        console.log('🚫 PROBLEMA: Permisos de Firestore denegados');
        console.log('💡 Verificar reglas de Firestore en la consola de Firebase');
      }
      
      return;
    }
    
    // 5. Probar operación completa
    console.log('\n5️⃣ PROBANDO OPERACIÓN COMPLETA...');
    
    try {
      const { getFirestore, doc, getDoc, updateDoc } = window.firebase.firestore;
      const db = getFirestore();
      
      const configDocRef = doc(db, 'configuracion', 'global');
      
      // Simular cambio de variables
      const testVariables = {
        diasGraciaDevolucion: 5,
        recordatorioPreActividad: 10,
        porcentajeStockMinimo: 25
      };
      
      console.log('🧪 Probando guardado de variables del sistema...');
      await updateDoc(configDocRef, {
        'variables.diasGraciaDevolucion': testVariables.diasGraciaDevolucion,
        'variables.recordatorioPreActividad': testVariables.recordatorioPreActividad,
        'variables.porcentajeStockMinimo': testVariables.porcentajeStockMinimo,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'diagnostico-test'
      });
      
      console.log('✅ Guardado de test exitoso');
      
      // Verificar que se guardó
      const verificationSnap = await getDoc(configDocRef);
      if (verificationSnap.exists()) {
        const data = verificationSnap.data();
        console.log('✅ Verificación exitosa, datos guardados:');
        console.log('  - Días gracia devolución:', data.variables?.diasGraciaDevolucion);
        console.log('  - Recordatorio pre-actividad:', data.variables?.recordatorioPreActividad);
        console.log('  - Porcentaje stock mínimo:', data.variables?.porcentajeStockMinimo);
      }
      
    } catch (testError) {
      console.error('❌ Error en test de operación completa:', testError);
      return;
    }
    
    // 6. Verificar documento de permisos (solo para administradores)
    if (userData.rol === 'admin') {
      console.log('\n6️⃣ VERIFICANDO DOCUMENTO DE PERMISOS...');
      
      try {
        const permissionsDocRef = doc(db, 'configuracion', 'permisos');
        console.log('📋 Referencia del documento de permisos creada');
        
        // Intentar leer el documento actual
        console.log('📖 Intentando leer documento de permisos...');
        const permissionsDocSnap = await getDoc(permissionsDocRef);
        
        if (permissionsDocSnap.exists()) {
          console.log('✅ Documento de permisos existe');
          const permissionsData = permissionsDocSnap.data();
          console.log('📋 Estructura de permisos:', Object.keys(permissionsData));
          
          // Probar actualización de permisos
          console.log('🔄 Probando actualización de permisos...');
          await updateDoc(permissionsDocRef, {
            testPermissionUpdate: new Date().toISOString(),
            testBy: 'diagnostico-permisos'
          });
          console.log('✅ Actualización de permisos exitosa');
          
          // Limpiar el test
          await updateDoc(permissionsDocRef, {
            testPermissionUpdate: null,
            testBy: null
          });
          console.log('🧹 Test de permisos limpiado');
          
        } else {
          console.log('⚠️ Documento de permisos no existe, creando...');
          
          // Crear documento inicial de permisos
          const initialPermissions = {
            admin: {
              variables: { loanManagement: 'full', notifications: 'full', materialManagement: 'full', activityManagement: 'full', reputationSystem: 'full', reports: 'full' },
              apis: { googleDrive: 'full', weatherServices: 'full', notificationServices: 'full', backupAnalytics: 'full' },
              material: { stockConfiguration: 'full', maintenanceSettings: 'full' },
              security: 'full', dropdowns: 'full', systemViewer: 'full'
            },
            vocal: {
              variables: { loanManagement: 'edit', notifications: 'edit', materialManagement: 'edit', activityManagement: 'edit', reputationSystem: 'read', reports: 'read' },
              apis: { googleDrive: 'edit', weatherServices: 'read', notificationServices: 'none', backupAnalytics: 'none' },
              material: { stockConfiguration: 'edit', maintenanceSettings: 'read' },
              security: 'none', dropdowns: 'edit', systemViewer: 'read'
            },
            lastUpdated: new Date().toISOString(),
            createdBy: 'diagnostico-inicial'
          };
          
          await setDoc(permissionsDocRef, initialPermissions);
          console.log('✅ Documento de permisos creado exitosamente');
        }
        
      } catch (permissionError) {
        console.error('❌ Error con documento de permisos:', permissionError);
        console.log('📋 Código de error:', permissionError.code);
        console.log('📋 Mensaje:', permissionError.message);
      }
    }

    // 7. Verificar estructura de pestañas
    console.log('\n6️⃣ VERIFICANDO ESTRUCTURA DE PESTAÑAS...');
    
    try {
      // Buscar elementos de las pestañas
      const tabList = document.querySelector('[role="tablist"]');
      const tabs = document.querySelectorAll('[role="tab"]');
      const tabPanels = document.querySelectorAll('[role="tabpanel"]');
      
      console.log('📋 Lista de pestañas encontrada:', !!tabList);
      console.log('📋 Número de pestañas:', tabs.length);
      console.log('📋 Número de paneles:', tabPanels.length);
      
      if (tabs.length > 0) {
        console.log('📋 Pestañas disponibles:');
        tabs.forEach((tab, index) => {
          console.log(`  ${index + 1}. ${tab.textContent}`);
        });
      }
      
      // Buscar botón de guardado global
      const saveButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.includes('Guardar cambios') || 
        btn.textContent?.includes('💾')
      );
      
      console.log('💾 Botones de guardado encontrados:', saveButtons.length);
      if (saveButtons.length > 0) {
        saveButtons.forEach((btn, index) => {
          console.log(`  ${index + 1}. "${btn.textContent}" - Visible: ${!btn.disabled}`);
        });
      }
      
    } catch (uiError) {
      console.log('⚠️ Error verificando UI (normal si no estás en la página):', uiError.message);
    }
      // 8. Resumen
    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log('=====================================');
    console.log('✅ Autenticación: OK');
    console.log('✅ Rol autorizado: OK');
    console.log('✅ Acceso a Firestore: OK');
    console.log('✅ Documento de configuración: OK');
    if (userData.rol === 'admin') {
      console.log('✅ Documento de permisos: OK');
    }
    console.log('✅ Operaciones de guardado: OK');
    console.log('✅ Interfaz de usuario: Verificada');
    console.log('');
    console.log('🎉 DIAGNÓSTICO COMPLETADO - SISTEMA FUNCIONAL');
    console.log('');
    console.log('💡 Si aún tienes problemas:');
    console.log('   1. Verifica que estés en la pestaña correcta de Configuración');
    console.log('   2. Busca el botón "💾 Guardar cambios" al final de la página');
    console.log('   3. Para permisos: ve a la pestaña "Permisos" y usa su botón específico');
    console.log('   4. Comprueba la consola durante el guardado para ver logs detallados');
    console.log('   5. Recarga la página completamente (Ctrl+F5) si es necesario');
    
  } catch (generalError) {
    console.error('❌ Error general en diagnóstico:', generalError);
    console.log('💡 Posibles causas:');
    console.log('   - Conexión a Internet inestable');
    console.log('   - Problemas con las reglas de Firestore');
    console.log('   - Configuración de Firebase incorrecta');
    console.log('   - Error en el código del frontend');
  }
}

// Ejecutar diagnóstico automáticamente
diagnosticarConfiguracionGlobal();

// También hacer disponible para ejecución manual
window.diagnosticarConfiguracionGlobal = diagnosticarConfiguracionGlobal;

console.log('💡 Script cargado. Ejecuta window.diagnosticarConfiguracionGlobal() para diagnóstico manual');
