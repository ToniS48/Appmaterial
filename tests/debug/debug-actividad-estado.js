// Script de depuración para verificar estados de actividades
console.log('🔍 Iniciando depuración de estados de actividades...');

// Función para depurar el estado de las actividades
function debugActividadCard() {
  console.log('📋 Verificando cards de actividades en la página...');
  
  // Buscar todas las cards de actividades
  const cards = document.querySelectorAll('[data-testid="actividad-card"], .chakra-card');
  console.log(`📊 Encontradas ${cards.length} cards en la página`);
  
  cards.forEach((card, index) => {
    try {
      // Buscar el texto del estado en tooltips o badges
      const tooltips = card.querySelectorAll('[role="tooltip"], .chakra-tooltip');
      const badges = card.querySelectorAll('.chakra-badge');
      const texts = card.querySelectorAll('[data-estado], .estado-text');
      
      console.log(`📋 Card ${index + 1}:`);
      
      // Buscar texto que contenga estados
      const allTexts = card.innerText;
      if (allTexts.includes('En curso') || allTexts.includes('Finalizada') || allTexts.includes('Planificada')) {
        console.log(`  ✅ Texto encontrado: "${allTexts.match(/(En curso|Finalizada|Planificada|Cancelada)/g)}"`);
        
        // Buscar iconos
        const icons = card.querySelectorAll('svg, [data-icon]');
        console.log(`  🎯 Iconos encontrados: ${icons.length}`);
        
        // Verificar si hay inconsistencias
        if (allTexts.includes('En curso') && allTexts.includes('Finalizada')) {
          console.warn(`  ⚠️ INCONSISTENCIA DETECTADA: Card contiene tanto "En curso" como "Finalizada"`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error procesando card ${index + 1}:`, error);
    }
  });
}

// Función para verificar el estado en el localStorage o datos React
function debugReactData() {
  console.log('🔍 Verificando datos de React...');
  
  // Buscar el contenedor principal de la aplicación
  const appContainer = document.querySelector('#root, [data-reactroot]');
  if (appContainer && appContainer._reactInternalFiber) {
    console.log('📊 Datos de React encontrados');
    // Aquí podrías acceder a los props y state si fuera necesario
  }
  
  // Verificar si hay datos en localStorage
  const actividadDraft = localStorage.getItem('actividadDraft');
  if (actividadDraft) {
    try {
      const draft = JSON.parse(actividadDraft);
      console.log('💾 Borrador en localStorage:', draft.estado);
    } catch (e) {
      console.log('💾 Error parseando borrador localStorage');
    }
  }
}

// Ejecutar depuración
debugActividadCard();
debugReactData();

console.log('✅ Depuración completada. Revisa los logs anteriores para identificar inconsistencias.');

// También crear un observer para detectar cambios dinámicos
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Si se añaden nuevas cards, re-ejecutar la depuración
      setTimeout(() => {
        console.log('🔄 Detectados cambios en el DOM, re-ejecutando depuración...');
        debugActividadCard();
      }, 500);
    }
  });
});

// Observar cambios en el contenedor principal
const mainContainer = document.querySelector('#root, main, [role="main"]');
if (mainContainer) {
  observer.observe(mainContainer, { childList: true, subtree: true });
  console.log('👀 Observer configurado para detectar cambios dinámicos');
}
