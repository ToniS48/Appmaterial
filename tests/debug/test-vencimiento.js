// Test para verificar la función de vencimiento de actividades
const testActividadVencida = () => {
  // Simular datos de actividad
  const actividadVencida = {
    id: '1',
    nombre: 'Actividad Vencida',
    fechaInicio: new Date('2025-05-01'),
    fechaFin: new Date('2025-05-15'), // Fecha pasada (mayo 2025)
    estado: 'planificada'
  };

  const actividadNoVencida = {
    id: '2',
    nombre: 'Actividad Futura',
    fechaInicio: new Date('2025-07-01'),
    fechaFin: new Date('2025-07-15'), // Fecha futura (julio 2025)
    estado: 'planificada'
  };

  // Función que copiamos de MisActividadesPage
  const isActividadVencida = (actividad) => {
    const ahora = new Date();
    let fechaFin;
    
    if (actividad.fechaFin instanceof Date) {
      fechaFin = actividad.fechaFin;
    } else {
      fechaFin = actividad.fechaFin.toDate();
    }
    
    return fechaFin < ahora;
  };

  console.log('🧪 Test función isActividadVencida');
  console.log('📅 Fecha actual:', new Date().toISOString());
  console.log('');
  
  console.log('✅ Actividad con fecha vencida:');
  console.log('  - Nombre:', actividadVencida.nombre);
  console.log('  - Fecha fin:', actividadVencida.fechaFin.toISOString());
  console.log('  - ¿Está vencida?:', isActividadVencida(actividadVencida));
  console.log('  - Botón mostraría:', isActividadVencida(actividadVencida) ? "Devolución de material" : "Gestionar material");
  console.log('');
  
  console.log('✅ Actividad con fecha futura:');
  console.log('  - Nombre:', actividadNoVencida.nombre);
  console.log('  - Fecha fin:', actividadNoVencida.fechaFin.toISOString());
  console.log('  - ¿Está vencida?:', isActividadVencida(actividadNoVencida));
  console.log('  - Botón mostraría:', isActividadVencida(actividadNoVencida) ? "Devolución de material" : "Gestionar material");
};

testActividadVencida();
