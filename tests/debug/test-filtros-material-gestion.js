// Test para verificar que los filtros en gestión de material funcionan correctamente
// Ejecutar en la consola del navegador en la página de gestión de material

console.log('🧪 === TEST FILTROS GESTIÓN DE MATERIAL ===');

// Función para probar el comportamiento de los filtros
function testFiltrosMaterial() {
  console.log('🔧 Probando filtros de gestión de material...');
  
  // 1. Verificar que los materiales están cargados
  if (window.location.pathname.includes('/material/gestion')) {
    console.log('✅ Estamos en la página de gestión de material');
    
    // 2. Probar filtros paso a paso
    setTimeout(() => {
      // Buscar elementos de filtros
      const selectTipo = document.querySelector('select[placeholder="Todos los tipos"]') || 
                        document.querySelector('select:has(option[value="cuerda"])');
      const selectEstado = document.querySelector('select[placeholder="Todos los estados"]') ||
                          document.querySelector('select:has(option[value="disponible"])');
      const inputBusqueda = document.querySelector('input[placeholder*="material"]') ||
                           document.querySelector('input[placeholder*="Buscar"]');
      
      console.log('🔍 Elementos encontrados:', {
        selectTipo: !!selectTipo,
        selectEstado: !!selectEstado,
        inputBusqueda: !!inputBusqueda
      });
      
      if (selectTipo && selectEstado && inputBusqueda) {
        console.log('✅ Todos los controles de filtro encontrados');
        
        // Test 1: Filtrar solo cuerdas
        console.log('🧪 Test 1: Filtrar por tipo "cuerda"');
        selectTipo.value = 'cuerda';
        selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
        
        setTimeout(() => {
          const materialesMostrados = document.querySelectorAll('[data-testid="material-card"], .chakra-tr:not(.chakra-thead .chakra-tr)');
          console.log(`📦 Materiales mostrados después filtro cuerda: ${materialesMostrados.length}`);
          
          // Test 2: Filtrar por estado disponible
          setTimeout(() => {
            console.log('🧪 Test 2: Filtrar por estado "disponible"');
            selectEstado.value = 'disponible';
            selectEstado.dispatchEvent(new Event('change', { bubbles: true }));
            
            setTimeout(() => {
              const materialesMostrados2 = document.querySelectorAll('[data-testid="material-card"], .chakra-tr:not(.chakra-thead .chakra-tr)');
              console.log(`📦 Materiales mostrados después filtro disponible: ${materialesMostrados2.length}`);
              
              // Test 3: Buscar por texto
              setTimeout(() => {
                console.log('🧪 Test 3: Buscar por texto');
                inputBusqueda.value = 'cuerda';
                inputBusqueda.dispatchEvent(new Event('input', { bubbles: true }));
                
                setTimeout(() => {
                  const materialesMostrados3 = document.querySelectorAll('[data-testid="material-card"], .chakra-tr:not(.chakra-thead .chakra-tr)');
                  console.log(`📦 Materiales mostrados después búsqueda: ${materialesMostrados3.length}`);
                  
                  // Test 4: Limpiar filtros
                  console.log('🧪 Test 4: Limpiar todos los filtros');
                  selectTipo.value = '';
                  selectEstado.value = '';
                  inputBusqueda.value = '';
                  selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
                  selectEstado.dispatchEvent(new Event('change', { bubbles: true }));
                  inputBusqueda.dispatchEvent(new Event('input', { bubbles: true }));
                  
                  setTimeout(() => {
                    const materialesMostrados4 = document.querySelectorAll('[data-testid="material-card"], .chakra-tr:not(.chakra-thead .chakra-tr)');
                    console.log(`📦 Materiales mostrados después limpiar: ${materialesMostrados4.length}`);
                    console.log('✅ Test de filtros completado');
                  }, 300);
                }, 300);
              }, 300);
            }, 300);
          }, 300);
        }, 300);
        
      } else {
        console.log('❌ No se encontraron todos los controles de filtro');
      }
    }, 1000);
    
  } else {
    console.log('❌ No estamos en la página de gestión de material');
    console.log('💡 Ve a /material/gestion y ejecuta este test');
  }
}

// Función para verificar el comportamiento en la consola
function verificarFiltrosConsola() {
  console.log('🔍 Verificando filtros en React DevTools...');
  
  // Buscar el componente React en la página
  if (window.React && window.React.version) {
    console.log(`✅ React version: ${window.React.version}`);
  }
  
  // Verificar si hay hooks de estado visibles
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools hook disponible');
  }
  
  console.log('💡 Para ver los estados internos, abre React DevTools y busca GestionMaterialPage');
}

// Ejecutar tests
testFiltrosMaterial();
verificarFiltrosConsola();

// Exponer funciones globalmente para uso manual
window.testFiltrosMaterial = testFiltrosMaterial;
window.verificarFiltrosConsola = verificarFiltrosConsola;

console.log('🔧 Funciones disponibles:');
console.log('  - testFiltrosMaterial()');
console.log('  - verificarFiltrosConsola()');
