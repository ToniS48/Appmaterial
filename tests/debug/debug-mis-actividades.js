/**
 * Script de depuración para verificar "Mis Actividades"
 * 
 * PROPÓSITO:
 * - Verificar que la página "Mis Actividades" carga correctamente las actividades
 * - Comprobar que se incluyen actividades donde el usuario es responsable de material
 * - Validar que se muestran correctamente los badges de responsabilidad
 * 
 * PASOS PARA USAR:
 * 1. Abrir la aplicación en el navegador
 * 2. Navegar a "Mis Actividades" en el menú lateral
 * 3. Abrir las herramientas de desarrollador (F12)
 * 4. Revisar los logs en la consola
 * 5. Verificar que aparecen actividades en ambas pestañas
 */

console.log('🔧 SCRIPT DEBUG - Mis Actividades');
console.log('================================');

// Instrucciones para el usuario
console.log(`
🎯 PASOS PARA DEPURAR "MIS ACTIVIDADES":

1. 📍 NAVEGAR A MIS ACTIVIDADES:
   - Ir a la página "Mis Actividades" (menú lateral)
   - Esperar a que carguen las pestañas

2. 🔍 REVISAR LOGS EN CONSOLA:
   - Buscar mensajes que empiecen con "🔍 MisActividadesPage"
   - Verificar el número de actividades cargadas en cada categoría
   - Comprobar los detalles de responsabilidades

3. 🏷️ VERIFICAR PESTAÑAS:
   - Pestaña 1: "Resp. Actividad"
     * Actividades donde eres creador O responsable de actividad
   - Pestaña 2: "Resp. Material"
     * Actividades donde eres responsable de material (pero no creador ni responsable de actividad)
   - Pestaña 3: "Participante"
     * Actividades donde solo participas (sin responsabilidades)

4. ✅ VERIFICAR BADGES Y FECHAS:
   - "Creador" (morado) - si creaste la actividad
   - "Resp. Actividad" (azul) - si eres responsable de actividad
   - "Resp. Material" (cian) - si eres responsable de material
   - Pueden aparecer múltiples badges si tienes varios roles en la misma actividad
   - Las fechas se muestran como "DD/MM/YYYY → DD/MM/YYYY" (inicio → fin)
   - Si la actividad es de un solo día, solo aparece una fecha

5. 🐛 SI HAY PROBLEMAS:
   - Revisar si hay errores en la consola
   - Verificar que el usuario tiene actividades asignadas
   - Comprobar que las actividades tienen los campos correctos
`);

// Función para inspeccionar actividades
window.debugMisActividades = function() {
    console.log('🔍 INSPECCIÓN MANUAL DEL ESTADO:');
    console.log('================================');
    
    // Revisar si hay componente React activo
    const reactComponents = document.querySelectorAll('[data-reactroot], #root');
    if (reactComponents.length > 0) {
        console.log('✅ React detectado');
        console.log('📍 Usar React DevTools para inspeccionar el estado del componente MisActividadesPage');
    } else {
        console.log('❌ No se detectó React');
    }
    
    // Revisar tabs visibles
    const tabs = document.querySelectorAll('[role="tab"]');
    console.log(`📋 Pestañas encontradas: ${tabs.length}`);
    
    tabs.forEach((tab, index) => {
        console.log(`  ${index + 1}. ${tab.textContent}`);
    });
    
    // Revisar actividades visibles
    const cards = document.querySelectorAll('[class*="chakra-card"]');
    console.log(`🃏 Tarjetas de actividades visibles: ${cards.length}`);
};

// Función para simular datos de prueba
window.testResponsableMaterialData = function(userId = 'test-user-123') {    console.log('🧪 SIMULACIÓN DE DATOS DE RESPONSABLE DE MATERIAL:');
    console.log('================================================');
      const mockActividades = [
        {
            id: '1',
            nombre: 'Escalada en Roca - Solo Responsable Material',
            fechaInicio: new Date('2024-01-15'),
            fechaFin: new Date('2024-01-15'),
            creadorId: 'otro-usuario',
            responsableActividadId: 'otro-usuario-2',
            responsableMaterialId: userId, // Usuario es responsable de material
            participanteIds: ['otro-usuario', 'otro-usuario-2'] // Usuario NO está en participantes
        },
        {
            id: '2',
            nombre: 'Barranquismo - Creador y Responsable Material',
            fechaInicio: new Date('2024-02-20'),
            fechaFin: new Date('2024-02-22'),
            creadorId: userId, // Usuario es creador
            responsableActividadId: 'otro-usuario',
            responsableMaterialId: userId, // Y también responsable de material
            participanteIds: [userId, 'otro-usuario']
        },
        {
            id: '3',
            nombre: 'Senderismo - Solo Responsable Actividad',
            fechaInicio: new Date('2024-03-10'),
            fechaFin: new Date('2024-03-10'),
            creadorId: 'otro-usuario', 
            responsableActividadId: userId, // Usuario es responsable de actividad
            responsableMaterialId: 'otro-usuario-2',
            participanteIds: [userId, 'otro-usuario', 'otro-usuario-2']
        },
        {
            id: '4',
            nombre: 'Alpinismo - Solo Participante',
            fechaInicio: new Date('2024-12-15'),
            fechaFin: new Date('2024-12-18'),
            creadorId: 'otro-usuario', 
            responsableActividadId: 'otro-usuario-2',
            responsableMaterialId: 'otro-usuario-3',
            participanteIds: [userId, 'otro-usuario', 'otro-usuario-2'] // Solo participa
        }
    ];
      console.log('📋 Actividades de prueba clasificadas por pestañas:');
    console.log('');
    console.log('👤 PESTAÑA "RESP. ACTIVIDAD" (incluye creadores):');
    mockActividades.filter(act => 
        act.creadorId === userId || act.responsableActividadId === userId
    ).forEach((act, index) => {
        const roles = [];
        if (act.creadorId === userId) roles.push('Creador');
        if (act.responsableActividadId === userId) roles.push('Resp.Actividad');
        console.log(`${index + 1}. ${act.nombre} - ${roles.join(', ')}`);
    });
    
    console.log('');
    console.log('📦 PESTAÑA "RESP. MATERIAL":');
    mockActividades.filter(act => 
        act.responsableMaterialId === userId && 
        act.creadorId !== userId && 
        act.responsableActividadId !== userId
    ).forEach((act, index) => {
        console.log(`${index + 1}. ${act.nombre} - Es responsable de material únicamente`);
    });
    
    console.log('');
    console.log('👥 PESTAÑA "PARTICIPANTE":');
    mockActividades.filter(act => 
        act.participanteIds.includes(userId) &&
        act.creadorId !== userId &&
        act.responsableActividadId !== userId &&
        act.responsableMaterialId !== userId
    ).forEach((act, index) => {
        console.log(`${index + 1}. ${act.nombre} - Solo participa`);
    });
    
    return mockActividades;
};

console.log(`
🚀 FUNCIONES DISPONIBLES:
- debugMisActividades() - Inspeccionar estado actual
- testResponsableMaterialData() - Simular datos de prueba
`);
