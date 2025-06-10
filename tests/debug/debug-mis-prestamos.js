/**
 * Script de depuración para verificar "Mis Préstamos"
 * 
 * PROPÓSITO:
 * - Diagnosticar por qué no aparecen resultados en "Mis Préstamos"
 * - Verificar conexión con Firebase
 * - Comprobar autenticación del usuario
 * - Validar consultas de préstamos
 * - Identificar problemas en los datos
 * 
 * PASOS PARA USAR:
 * 1. Abrir la aplicación en el navegador
 * 2. Navegar a "Mis Préstamos" (menú lateral)
 * 3. Abrir las herramientas de desarrollador (F12)
 * 4. Pegar este script en la consola y presionar Enter
 * 5. Ejecutar las funciones de diagnóstico
 */

console.log('🔧 SCRIPT DEBUG - Mis Préstamos');
console.log('================================');

// Instrucciones para el usuario
console.log(`
🎯 DIAGNÓSTICO DE "MIS PRÉSTAMOS":

1. 📍 VERIFICAR AUTENTICACIÓN:
   - Comprobar que el usuario está logueado
   - Verificar el perfil del usuario
   - Confirmar permisos de acceso

2. 🔍 REVISAR DATOS EN FIREBASE:
   - Verificar conexión con Firestore
   - Buscar préstamos del usuario actual
   - Comprobar estructura de datos

3. 🏷️ VERIFICAR CONSULTAS:
   - Revisar filtros de estado
   - Comprobar consultas por usuarioId
   - Validar formato de datos

4. ✅ REVISAR ERRORES:
   - Buscar errores en la consola
   - Verificar mensajes de red
   - Comprobar permisos de Firebase

5. 🐛 SI HAY PROBLEMAS:
   - Revisar si hay datos de prueba
   - Verificar configuración de Firebase
   - Comprobar estructura de colección "prestamos"
`);

// Función principal de diagnóstico
window.debugMisPrestamos = function() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE MIS PRÉSTAMOS:');
    console.log('=========================================');
    
    // 1. Verificar autenticación
    console.log('\n1️⃣ VERIFICANDO AUTENTICACIÓN...');
    
    const auth = window.firebase?.auth?.();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
        console.error('❌ Usuario no autenticado');
        console.log('💡 Solución: Iniciar sesión primero');
        return;
    }
    
    console.log('✅ Usuario autenticado:', currentUser.email);
    console.log('📋 UID del usuario:', currentUser.uid);
    
    // 2. Verificar conexión con Firestore
    console.log('\n2️⃣ VERIFICANDO CONEXIÓN FIRESTORE...');
    
    if (!window.firebase?.firestore) {
        console.error('❌ Firestore no disponible');
        return;
    }
    
    const db = window.firebase.firestore();
    console.log('✅ Firestore conectado');
    
    // 3. Buscar préstamos del usuario
    console.log('\n3️⃣ BUSCANDO PRÉSTAMOS DEL USUARIO...');
    
    return buscarPrestamosUsuario(currentUser.uid, db);
};

// Función para buscar préstamos del usuario
async function buscarPrestamosUsuario(userId, db) {
    try {
        console.log(`🔍 Buscando préstamos para usuario: ${userId}`);
        
        // Consulta básica - todos los préstamos del usuario
        const queryTodos = db.collection('prestamos')
            .where('usuarioId', '==', userId)
            .orderBy('fechaPrestamo', 'desc');
        
        const snapshotTodos = await queryTodos.get();
        console.log(`📊 Total de préstamos encontrados: ${snapshotTodos.size}`);
        
        if (snapshotTodos.size === 0) {
            console.log('⚠️ No se encontraron préstamos para este usuario');
            await verificarDatosPrueba(userId, db);
            return;
        }
        
        // Analizar los préstamos encontrados
        const prestamos = [];
        snapshotTodos.forEach(doc => {
            const data = doc.data();
            prestamos.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log('\n📋 ANÁLISIS DE PRÉSTAMOS ENCONTRADOS:');
        
        const estadosContador = {};
        prestamos.forEach((prestamo, index) => {
            console.log(`\n${index + 1}. Préstamo ID: ${prestamo.id}`);
            console.log(`   Material: ${prestamo.nombreMaterial || 'Sin nombre'}`);
            console.log(`   Estado: ${prestamo.estado}`);
            console.log(`   Fecha préstamo: ${prestamo.fechaPrestamo?.toDate?.() || prestamo.fechaPrestamo}`);
            console.log(`   Cantidad: ${prestamo.cantidadPrestada}`);
            
            // Contar estados
            estadosContador[prestamo.estado] = (estadosContador[prestamo.estado] || 0) + 1;
        });
        
        console.log('\n📊 RESUMEN POR ESTADO:');
        Object.entries(estadosContador).forEach(([estado, cantidad]) => {
            console.log(`   ${estado}: ${cantidad} préstamo(s)`);
        });
        
        // Filtrar préstamos activos (los que deberían aparecer en "Mis Préstamos")
        const prestamosActivos = prestamos.filter(p => 
            p.estado === 'en_uso' || p.estado === 'pendiente'
        );
        
        console.log(`\n✅ PRÉSTAMOS ACTIVOS (deberían aparecer): ${prestamosActivos.length}`);
        
        if (prestamosActivos.length === 0) {
            console.log('⚠️ No hay préstamos activos - por eso no aparece nada en "Mis Préstamos"');
            console.log('💡 Todos los préstamos están devueltos o en otro estado');
        } else {
            console.log('🎯 Estos préstamos deberían aparecer en "Mis Préstamos":');
            prestamosActivos.forEach((prestamo, index) => {
                console.log(`   ${index + 1}. ${prestamo.nombreMaterial} (${prestamo.estado})`);
            });
        }
        
        return prestamos;
        
    } catch (error) {
        console.error('❌ Error al buscar préstamos:', error);
        
        if (error.code === 'permission-denied') {
            console.log('🔒 Error de permisos - verificar reglas de Firestore');
        } else if (error.code === 'failed-precondition') {
            console.log('📂 Error de índices - verificar índices de Firestore');
        }
        
        throw error;
    }
}

// Función para verificar si hay datos de prueba
async function verificarDatosPrueba(userId, db) {
    console.log('\n🧪 VERIFICANDO DATOS DE PRUEBA...');
    
    try {
        // Buscar cualquier préstamo en la colección
        const queryGeneral = db.collection('prestamos').limit(5);
        const snapshotGeneral = await queryGeneral.get();
        
        console.log(`📊 Total de préstamos en la base de datos: ${snapshotGeneral.size}`);
        
        if (snapshotGeneral.size === 0) {
            console.log('⚠️ No hay préstamos en la base de datos');
            console.log('💡 Crear algunos préstamos de prueba');
            return;
        }
        
        console.log('\n📋 EJEMPLOS DE PRÉSTAMOS EN LA BD:');
        snapshotGeneral.forEach((doc, index) => {
            const data = doc.data();
            console.log(`${index + 1}. Usuario: ${data.usuarioId}, Material: ${data.nombreMaterial}, Estado: ${data.estado}`);
        });
        
        console.log(`\n🔍 Tu usuario ID: ${userId}`);
        console.log('💡 Comprueba si tu ID aparece en la lista anterior');
        
    } catch (error) {
        console.error('❌ Error al verificar datos:', error);
    }
}

// Función para crear préstamo de prueba
window.crearPrestamosPrueba = async function(cantidad = 2) {
    console.log('🧪 CREANDO PRÉSTAMOS DE PRUEBA...');
    
    const auth = window.firebase?.auth?.();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
        console.error('❌ Usuario no autenticado');
        return;
    }
    
    const db = window.firebase.firestore();
    const userId = currentUser.uid;
    const userName = currentUser.displayName || currentUser.email;
    
    try {
        for (let i = 1; i <= cantidad; i++) {
            const prestamoData = {
                usuarioId: userId,
                nombreUsuario: userName,
                materialId: `material-test-${i}-${Date.now()}`,
                nombreMaterial: `Material de Prueba ${i}`,
                cantidadPrestada: i,
                estado: i === 1 ? 'en_uso' : 'pendiente',
                fechaPrestamo: window.firebase.firestore.Timestamp.now(),
                fechaDevolucionPrevista: window.firebase.firestore.Timestamp.fromDate(
                    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 días desde hoy
                ),
                observaciones: `Préstamo de prueba creado para debugging - ${new Date().toLocaleString()}`
            };
            
            const docRef = await db.collection('prestamos').add(prestamoData);
            console.log(`✅ Préstamo de prueba ${i} creado: ${docRef.id}`);
        }
        
        console.log('🎉 Préstamos de prueba creados exitosamente');
        console.log('🔄 Recarga la página "Mis Préstamos" para verlos');
        
    } catch (error) {
        console.error('❌ Error al crear préstamos de prueba:', error);
    }
};

// Función para verificar servicios de la aplicación
window.verificarServicios = function() {
    console.log('🔍 VERIFICANDO SERVICIOS DE LA APLICACIÓN:');
    console.log('==========================================');
    
    // Verificar servicios disponibles
    const servicios = {
        'window.prestamoService': window.prestamoService,
        'window.firebase': window.firebase,
        'React Router': window.location.pathname,
        'Usuario autenticado': window.firebase?.auth?.()?.currentUser?.email
    };
    
    Object.entries(servicios).forEach(([nombre, valor]) => {
        if (valor) {
            console.log(`✅ ${nombre}: Disponible`);
        } else {
            console.log(`❌ ${nombre}: No disponible`);
        }
    });
    
    // Verificar ruta actual
    console.log(`\n📍 Ruta actual: ${window.location.pathname}`);
    if (window.location.pathname === '/mis-prestamos') {
        console.log('✅ Estás en la página correcta');
    } else {
        console.log('⚠️ No estás en /mis-prestamos');
    }
};

// Función para limpiar datos de prueba
window.limpiarDatosPrueba = async function() {
    console.log('🧹 LIMPIANDO DATOS DE PRUEBA...');
    
    const auth = window.firebase?.auth?.();
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
        console.error('❌ Usuario no autenticado');
        return;
    }
    
    const db = window.firebase.firestore();
    
    try {
        const query = db.collection('prestamos')
            .where('usuarioId', '==', currentUser.uid)
            .where('observaciones', '>=', 'Préstamo de prueba')
            .where('observaciones', '<=', 'Préstamo de prueba\uf8ff');
        
        const snapshot = await query.get();
        console.log(`🔍 Encontrados ${snapshot.size} préstamos de prueba`);
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('✅ Datos de prueba eliminados');
        
    } catch (error) {
        console.error('❌ Error al limpiar datos:', error);
    }
};

console.log(`
🚀 FUNCIONES DISPONIBLES:
- debugMisPrestamos() - Diagnóstico completo
- verificarServicios() - Verificar estado de servicios
- crearPrestamosPrueba(cantidad) - Crear préstamos de prueba
- limpiarDatosPrueba() - Eliminar préstamos de prueba

💡 EMPEZAR CON: debugMisPrestamos()
`);
