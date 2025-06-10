// 🚀 SCRIPT PARA CONSOLA: Verificar Mis Préstamos
// Copiar y pegar directamente en la consola del navegador (F12 → Console)

(async function verificarMisPrestamos() {
    console.log('🔍 === VERIFICANDO MIS PRÉSTAMOS ===');
    
    try {
        // Obtener usuario del localStorage
        const authKey = Object.keys(localStorage).find(k => k.includes('firebase:authUser'));
        if (!authKey) {
            console.log('❌ No hay datos de autenticación');
            return;
        }
        
        const userData = JSON.parse(localStorage.getItem(authKey));
        const userId = userData.uid;
        const userEmail = userData.email;
        
        console.log(`👤 Usuario: ${userEmail}`);
        console.log(`🔑 UID: ${userId}`);
        
        // Verificar servicios disponibles
        if (!window.prestamoService) {
            console.log('❌ prestamoService no disponible');
            console.log('💡 Asegúrate de estar en la página de la aplicación');
            return;
        }
        
        // Método anterior
        const prestamosDirectos = await window.prestamoService.listarPrestamos({ 
            usuarioId: userId 
        }).catch(e => []);
        
        // Método nuevo
        const prestamosConResp = await window.prestamoService.listarPrestamosPorResponsabilidad?.(userId).catch(e => []);
        
        console.log(`📊 Préstamos directos: ${prestamosDirectos.length}`);
        console.log(`📊 Préstamos con responsabilidad: ${prestamosConResp?.length || 0}`);
        console.log(`✨ Diferencia: +${(prestamosConResp?.length || 0) - prestamosDirectos.length}`);
        
        if (prestamosConResp && prestamosConResp.length > 0) {
            console.log('\n📋 Detalles:');
            prestamosConResp.forEach((p, i) => {
                const roles = [];
                if (p.usuarioId === userId) roles.push('Directo');
                if (p.responsableActividad === userId) roles.push('Resp.Act');
                if (p.responsableMaterial === userId) roles.push('Resp.Mat');
                
                console.log(`  ${i+1}. ${p.nombreMaterial} - ${roles.join(', ')}`);
            });
        }
        
        console.log('✅ Verificación completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
