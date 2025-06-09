/**
 * Script de depuración para verificar la pestaña "Como Responsable"
 * 
 * PROPÓSITO:
 * - Verificar que la función obtenerActividadesClasificadas funciona correctamente
 * - Comprobar que la pestaña "Como Responsable" muestra actividades
 * - Validar que se incluyen actividades donde el usuario es responsable pero no participante
 * 
 * PASOS PARA USAR:
 * 1. Abrir la aplicación en el navegador
 * 2. Abrir las herramientas de desarrollador (F12)
 * 3. Ir a la página de actividades
 * 4. Revisar los logs en la consola
 * 5. Hacer clic en la pestaña "Como Responsable"
 * 6. Verificar que se muestran las actividades correctas
 */

console.log('🔧 SCRIPT DEBUG - Pestaña Como Responsable');
console.log('==========================================');

// Instrucciones para el usuario
console.log(`
🎯 PASOS PARA DEPURAR LA PESTAÑA "COMO RESPONSABLE":

1. 📍 NAVEGAR A ACTIVIDADES:
   - Ir a la página de actividades (menú lateral)
   - Esperar a que carguen todas las pestañas

2. 🔍 REVISAR LOGS EN CONSOLA:
   - Buscar mensajes que empiecen con "🔍 obtenerActividadesClasificadas"
   - Verificar el número de actividades cargadas
   - Comprobar los detalles de actividades como responsable

3. 🏷️ PROBAR PESTAÑA "COMO RESPONSABLE":
   - Hacer clic en la pestaña "Como Responsable"
   - Verificar si se muestran actividades
   - Si no se muestran, revisar los logs para identificar el problema

4. ✅ VERIFICAR FUNCIONALIDAD:
   - Las actividades mostradas deben incluir:
     * Actividades creadas por el usuario
     * Actividades donde es responsable de actividad
     * Actividades donde es responsable de material
   - Deben estar ordenadas por fecha (más recientes primero)

5. 🐛 SI HAY PROBLEMAS:
   - Revisar si hay errores en la consola
   - Verificar que el usuario tiene actividades asignadas
   - Comprobar que las actividades tienen los campos correctos:
     * creadorId
     * responsableActividadId  
     * responsableMaterialId
`);

// Función para inspeccionar el estado de las actividades
window.debugResponsableTab = function() {
    console.log('🔍 INSPECCIÓN MANUAL DEL ESTADO:');
    
    // Intentar obtener datos del store de React (si está disponible)
    const reactFiberNode = document.querySelector('#root')._reactInternalFiber ||
                          document.querySelector('#root')._reactInternals;
    
    if (reactFiberNode) {
        console.log('✅ React detectado');
        console.log('📍 Para debugging manual, usar las herramientas de React DevTools');
    } else {
        console.log('❌ No se pudo detectar React en esta página');
    }
    
    // Verificar si hay logs de actividades en localStorage
    const logs = localStorage.getItem('debug_actividades_responsable');
    if (logs) {
        console.log('📝 Logs encontrados en localStorage:', JSON.parse(logs));
    }
    
    console.log(`
    🔧 ACCIONES ADICIONALES DE DEBUG:
    
    1. Abrir React DevTools (extensión del navegador)
    2. Buscar el componente "ActividadesPage" 
    3. Inspeccionar el state:
       - actividadesResponsable: array de actividades
       - actividadesParticipante: array de actividades
       - userProfile: datos del usuario actual
    
    4. En la pestaña "Como Responsable", verificar que:
       - actividadesResponsable.length > 0
       - Las actividades tienen los campos necesarios
       - El userId coincide con creadorId/responsableActividadId/responsableMaterialId
    `);
};

// Función para simular datos de prueba
window.testResponsableData = function(userId) {
    console.log('🧪 SIMULACIÓN DE DATOS DE PRUEBA:');
    console.log('Buscando actividades para userId:', userId);
    
    // Esta función ayuda a entender qué actividades debería mostrar
    const mockActividades = [
        {
            id: 'test1',
            nombre: 'Actividad como Creador',
            creadorId: userId,
            responsableActividadId: 'otro-usuario',
            responsableMaterialId: null,
            participanteIds: [userId, 'otro-usuario']
        },
        {
            id: 'test2', 
            nombre: 'Actividad como Responsable de Actividad',
            creadorId: 'otro-usuario',
            responsableActividadId: userId,
            responsableMaterialId: null,
            participanteIds: ['otro-usuario']  // Usuario no está en participantes
        },
        {
            id: 'test3',
            nombre: 'Actividad como Responsable de Material', 
            creadorId: 'otro-usuario',
            responsableActividadId: 'otro-usuario-2',
            responsableMaterialId: userId,
            participanteIds: ['otro-usuario', 'otro-usuario-2'] // Usuario no está en participantes
        }
    ];
    
    console.log('📋 Actividades de prueba que deberían aparecer en "Como Responsable":');
    mockActividades.forEach((act, index) => {
        console.log(`${index + 1}. ${act.nombre}`);
        if (act.creadorId === userId) console.log('   ✓ Es creador');
        if (act.responsableActividadId === userId) console.log('   ✓ Es responsable de actividad');
        if (act.responsableMaterialId === userId) console.log('   ✓ Es responsable de material');
    });
    
    return mockActividades;
};

console.log(`
🚀 FUNCIONES DISPONIBLES:
- debugResponsableTab(): Inspecciona el estado actual
- testResponsableData('tu-user-id'): Simula datos de prueba

💡 EJEMPLO DE USO:
debugResponsableTab();
testResponsableData('tu-user-id-aqui');
`);
