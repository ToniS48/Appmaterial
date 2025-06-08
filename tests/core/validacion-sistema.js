// VALIDACIÓN FINAL COMPLETA: Sistema de préstamos y cantidades
// Este script valida todo el flujo: actividades → préstamos → cantidades → devoluciones

console.log('🎯 === VALIDACIÓN FINAL COMPLETA DEL SISTEMA ===');

// Configuración de la validación
const VALIDATION_CONFIG = {
  waitTime: 3000, // 3 segundos entre operaciones críticas
  shortWait: 1000, // 1 segundo para operaciones rápidas
  debug: true,
  maxRetries: 3
};

// Logger mejorado
const ValidationLogger = {
  timestamp: () => new Date().toLocaleTimeString(),
  
  info: (message, data = null) => {
    console.log(`${ValidationLogger.timestamp()} ℹ️ ${message}`);
    if (data && VALIDATION_CONFIG.debug) {
      console.log(`${ValidationLogger.timestamp()} 📋 Data:`, data);
    }
  },
  
  success: (message, data = null) => {
    console.log(`${ValidationLogger.timestamp()} ✅ ${message}`);
    if (data && VALIDATION_CONFIG.debug) {
      console.log(`${ValidationLogger.timestamp()} 📋 Data:`, data);
    }
  },
  
  warning: (message, data = null) => {
    console.log(`${ValidationLogger.timestamp()} ⚠️ ${message}`);
    if (data) {
      console.log(`${ValidationLogger.timestamp()} 📋 Data:`, data);
    }
  },
  
  error: (message, data = null) => {
    console.log(`${ValidationLogger.timestamp()} ❌ ${message}`);
    if (data) {
      console.log(`${ValidationLogger.timestamp()} 📋 Data:`, data);
    }
  },
  
  step: (step, message) => {
    console.log(`\n${ValidationLogger.timestamp()} 🔢 PASO ${step}: ${message}`);
  }
};

// Clase principal de validación
class SistemaValidationComplete {
  constructor() {
    this.testResults = {
      servicios: false,
      material: null,
      prestamo: null,
      devolucion: false,
      cantidades: {
        inicial: null,
        despuesPrestamo: null,
        despuesDevolucion: null
      },
      success: false
    };
  }
  
  // Ejecutar validación completa
  async ejecutarValidacionCompleta() {
    ValidationLogger.info('🚀 Iniciando validación completa del sistema...');
    
    try {
      // Paso 1: Verificar servicios
      ValidationLogger.step(1, 'Verificando servicios disponibles');
      this.testResults.servicios = await this.verificarServicios();
      if (!this.testResults.servicios) {
        throw new Error('Servicios no disponibles');
      }
      
      // Paso 2: Seleccionar material
      ValidationLogger.step(2, 'Seleccionando material para pruebas');
      this.testResults.material = await this.seleccionarMaterialParaPruebas();
      if (!this.testResults.material) {
        throw new Error('No se encontró material apropiado');
      }
      
      // Paso 3: Registrar estado inicial
      ValidationLogger.step(3, 'Registrando estado inicial del material');
      this.testResults.cantidades.inicial = await this.registrarEstadoMaterial('inicial');
      
      // Paso 4: Crear préstamo y verificar
      ValidationLogger.step(4, 'Creando préstamo y verificando actualización');
      this.testResults.prestamo = await this.crearPrestamoYVerificar();
      if (!this.testResults.prestamo) {
        throw new Error('Fallo en la creación o verificación del préstamo');
      }
      
      // Paso 5: Verificar disminución de cantidad
      ValidationLogger.step(5, 'Verificando disminución de cantidad');
      this.testResults.cantidades.despuesPrestamo = await this.registrarEstadoMaterial('prestamo');
      const disminucionOk = this.validarDisminucionCantidad();
      if (!disminucionOk) {
        ValidationLogger.warning('La disminución de cantidad no fue correcta');
      }
      
      // Paso 6: Procesar devolución
      ValidationLogger.step(6, 'Procesando devolución del material');
      this.testResults.devolucion = await this.procesarDevolucion();
      if (!this.testResults.devolucion) {
        throw new Error('Fallo en el procesamiento de la devolución');
      }
      
      // Paso 7: Verificar incremento de cantidad
      ValidationLogger.step(7, 'Verificando incremento de cantidad tras devolución');
      this.testResults.cantidades.despuesDevolucion = await this.registrarEstadoMaterial('devolucion');
      const incrementoOk = this.validarIncrementoCantidad();
      if (!incrementoOk) {
        throw new Error('El incremento de cantidad tras devolución no fue correcto');
      }
      
      // Paso 8: Validación final
      ValidationLogger.step(8, 'Realizando validación final');
      this.testResults.success = this.validacionFinal();
      
      // Mostrar resultados
      this.mostrarResultadosFinales();
      
      return this.testResults.success;
      
    } catch (error) {
      ValidationLogger.error('💥 Error durante la validación:', error);
      this.mostrarResultadosFinales();
      return false;
    }
  }
  
  // Verificar que todos los servicios están disponibles
  async verificarServicios() {
    const serviciosRequeridos = [
      'materialService',
      'prestamoService',
      'actividadService'
    ];
    
    const serviciosDisponibles = [];
    const serviciosFaltantes = [];
    
    serviciosRequeridos.forEach(servicio => {
      if (window[servicio]) {
        serviciosDisponibles.push(servicio);
      } else {
        serviciosFaltantes.push(servicio);
      }
    });
    
    ValidationLogger.info(`Servicios disponibles: ${serviciosDisponibles.length}/${serviciosRequeridos.length}`);
    
    if (serviciosFaltantes.length > 0) {
      ValidationLogger.error('Servicios faltantes:', serviciosFaltantes);
      return false;
    }
    
    ValidationLogger.success('Todos los servicios están disponibles');
    return true;
  }
  
  // Seleccionar material apropiado para las pruebas
  async seleccionarMaterialParaPruebas() {
    try {
      const materiales = await window.materialService.listarMateriales();
      ValidationLogger.info(`Materiales encontrados: ${materiales.length}`);
      
      // Priorizar material con cantidad disponible > 1
      const materialConCantidad = materiales.find(m => 
        m.estado === 'disponible' && 
        m.cantidadDisponible && 
        m.cantidadDisponible > 1
      );
      
      if (materialConCantidad) {
        ValidationLogger.success(`Material con cantidad seleccionado: ${materialConCantidad.nombre}`, {
          id: materialConCantidad.id,
          cantidadDisponible: materialConCantidad.cantidadDisponible
        });
        return materialConCantidad;
      }
      
      // Si no hay con cantidad, buscar material único
      const materialUnico = materiales.find(m => m.estado === 'disponible');
      if (materialUnico) {
        ValidationLogger.success(`Material único seleccionado: ${materialUnico.nombre}`, {
          id: materialUnico.id,
          estado: materialUnico.estado
        });
        return materialUnico;
      }
      
      ValidationLogger.error('No se encontró material disponible para pruebas');
      return null;
      
    } catch (error) {
      ValidationLogger.error('Error seleccionando material:', error);
      return null;
    }
  }
  
  // Registrar estado actual del material
  async registrarEstadoMaterial(fase) {
    try {
      const material = await window.materialService.obtenerMaterial(this.testResults.material.id);
      
      ValidationLogger.info(`Estado material (${fase}):`, {
        id: material.id,
        nombre: material.nombre,
        estado: material.estado,
        cantidadDisponible: material.cantidadDisponible
      });
      
      return {
        id: material.id,
        nombre: material.nombre,
        estado: material.estado,
        cantidadDisponible: material.cantidadDisponible,
        fase: fase,
        timestamp: new Date()
      };
      
    } catch (error) {
      ValidationLogger.error(`Error registrando estado (${fase}):`, error);
      return null;
    }
  }
  
  // Crear préstamo y verificar creación
  async crearPrestamoYVerificar() {
    try {
      const material = this.testResults.material;
      const cantidadPrestamo = Math.min(1, material.cantidadDisponible || 1);
      
      const prestamoData = {
        materialId: material.id,
        nombreMaterial: material.nombre,
        usuarioId: 'validation-user-' + Date.now(),
        nombreUsuario: 'Usuario Validación Sistema',
        cantidadPrestada: cantidadPrestamo,
        fechaPrestamo: new Date(),
        estado: 'activo',
        observaciones: 'Préstamo creado durante validación completa del sistema'
      };
      
      ValidationLogger.info('Creando préstamo...', prestamoData);
      
      const prestamoCreado = await window.prestamoService.crearPrestamo(prestamoData);
      
      ValidationLogger.success(`Préstamo creado: ${prestamoCreado.id}`);
      
      // Esperar a que se procesen las actualizaciones
      await this.esperar(VALIDATION_CONFIG.waitTime);
      
      return prestamoCreado;
      
    } catch (error) {
      ValidationLogger.error('Error creando préstamo:', error);
      return null;
    }
  }
  
  // Validar que la cantidad disminuyó correctamente
  validarDisminucionCantidad() {
    const inicial = this.testResults.cantidades.inicial;
    const despues = this.testResults.cantidades.despuesPrestamo;
    const prestamo = this.testResults.prestamo;
    
    if (!inicial || !despues || !prestamo) {
      ValidationLogger.error('Datos insuficientes para validar disminución');
      return false;
    }
    
    if (inicial.cantidadDisponible) {
      // Material con cantidad
      const esperado = inicial.cantidadDisponible - prestamo.cantidadPrestada;
      const actual = despues.cantidadDisponible;
      
      ValidationLogger.info('Validación disminución (cantidad):', {
        inicial: inicial.cantidadDisponible,
        prestado: prestamo.cantidadPrestada,
        esperado: esperado,
        actual: actual,
        correcto: actual === esperado
      });
      
      return actual === esperado;
    } else {
      // Material único - verificar cambio de estado
      const esperado = 'prestado';
      const actual = despues.estado;
      
      ValidationLogger.info('Validación disminución (estado):', {
        inicial: inicial.estado,
        esperado: esperado,
        actual: actual,
        correcto: actual === esperado
      });
      
      return actual === esperado;
    }
  }
  
  // Procesar devolución del material
  async procesarDevolucion() {
    try {
      const prestamo = this.testResults.prestamo;
      
      ValidationLogger.info(`Registrando devolución del préstamo: ${prestamo.id}`);
      
      await window.prestamoService.registrarDevolucion(
        prestamo.id,
        'Devolución procesada durante validación completa del sistema'
      );
      
      ValidationLogger.success('Devolución registrada');
      
      // Esperar a que se procesen las actualizaciones
      await this.esperar(VALIDATION_CONFIG.waitTime);
      
      return true;
      
    } catch (error) {
      ValidationLogger.error('Error procesando devolución:', error);
      return false;
    }
  }
  
  // Validar que la cantidad se incrementó correctamente tras devolución
  validarIncrementoCantidad() {
    const inicial = this.testResults.cantidades.inicial;
    const despuesDevolucion = this.testResults.cantidades.despuesDevolucion;
    const prestamo = this.testResults.prestamo;
    
    if (!inicial || !despuesDevolucion || !prestamo) {
      ValidationLogger.error('Datos insuficientes para validar incremento');
      return false;
    }
    
    if (inicial.cantidadDisponible) {
      // Material con cantidad - debería volver al valor inicial
      const esperado = inicial.cantidadDisponible;
      const actual = despuesDevolucion.cantidadDisponible;
      
      ValidationLogger.info('Validación incremento (cantidad):', {
        inicial: inicial.cantidadDisponible,
        devuelto: prestamo.cantidadPrestada,
        esperado: esperado,
        actual: actual,
        correcto: actual === esperado
      });
      
      return actual === esperado;
    } else {
      // Material único - debería volver a disponible
      const esperado = 'disponible';
      const actual = despuesDevolucion.estado;
      
      ValidationLogger.info('Validación incremento (estado):', {
        inicial: inicial.estado,
        esperado: esperado,
        actual: actual,
        correcto: actual === esperado
      });
      
      return actual === esperado;
    }
  }
  
  // Validación final del sistema completo
  validacionFinal() {
    const serviciosOk = this.testResults.servicios;
    const materialOk = this.testResults.material !== null;
    const prestamoOk = this.testResults.prestamo !== null;
    const devolucionOk = this.testResults.devolucion;
    const disminucionOk = this.validarDisminucionCantidad();
    const incrementoOk = this.validarIncrementoCantidad();
    
    const todoOk = serviciosOk && materialOk && prestamoOk && devolucionOk && disminucionOk && incrementoOk;
    
    ValidationLogger.info('Resultados de validación final:', {
      servicios: serviciosOk,
      material: materialOk,
      prestamo: prestamoOk,
      devolucion: devolucionOk,
      disminucionCantidad: disminucionOk,
      incrementoCantidad: incrementoOk,
      sistemaCompleto: todoOk
    });
    
    return todoOk;
  }
  
  // Mostrar resultados finales
  mostrarResultadosFinales() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 RESULTADOS FINALES DE VALIDACIÓN COMPLETA');
    console.log('='.repeat(60));
    
    if (this.testResults.success) {
      console.log('🎉 ¡ÉXITO TOTAL! El sistema funciona correctamente');
      console.log('✅ Todas las funcionalidades validadas:');
      console.log('   📦 Gestión de materiales');
      console.log('   💼 Creación de préstamos');
      console.log('   📉 Disminución de cantidades en préstamos');
      console.log('   🔄 Procesamiento de devoluciones');
      console.log('   📈 Incremento de cantidades en devoluciones');
    } else {
      console.log('❌ SISTEMA CON PROBLEMAS');
      console.log('💥 Algunas funcionalidades no funcionan correctamente');
    }
    
    console.log('\n📊 RESUMEN DETALLADO:');
    console.log(`   🔧 Servicios: ${this.testResults.servicios ? '✅' : '❌'}`);
    console.log(`   📦 Material: ${this.testResults.material ? '✅' : '❌'}`);
    console.log(`   💼 Préstamo: ${this.testResults.prestamo ? '✅' : '❌'}`);
    console.log(`   🔄 Devolución: ${this.testResults.devolucion ? '✅' : '❌'}`);
    
    if (this.testResults.material) {
      console.log(`\n📋 MATERIAL PROBADO: ${this.testResults.material.nombre}`);
      console.log(`   ID: ${this.testResults.material.id}`);
      
      if (this.testResults.cantidades.inicial) {
        console.log('\n📊 EVOLUCIÓN DE CANTIDADES:');
        console.log(`   Inicial: ${this.testResults.cantidades.inicial.cantidadDisponible || this.testResults.cantidades.inicial.estado}`);
        console.log(`   Después préstamo: ${this.testResults.cantidades.despuesPrestamo?.cantidadDisponible || this.testResults.cantidades.despuesPrestamo?.estado || 'N/A'}`);
        console.log(`   Después devolución: ${this.testResults.cantidades.despuesDevolucion?.cantidadDisponible || this.testResults.cantidades.despuesDevolucion?.estado || 'N/A'}`);
      }
    }
    
    if (this.testResults.prestamo) {
      console.log(`\n💼 PRÉSTAMO CREADO: ${this.testResults.prestamo.id}`);
      console.log(`   Cantidad prestada: ${this.testResults.prestamo.cantidadPrestada}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(this.testResults.success ? '🎯 SISTEMA VALIDADO COMPLETAMENTE' : '⚠️ SISTEMA REQUIERE ATENCIÓN');
    console.log('='.repeat(60) + '\n');
  }
  
  // Helper para esperar
  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Función principal para ejecutar desde consola
async function validarSistemaCompleto() {
  const validator = new SistemaValidationComplete();
  return await validator.ejecutarValidacionCompleta();
}

// Función rápida para verificar solo la funcionalidad básica
async function validacionRapida() {
  ValidationLogger.info('🚀 Iniciando validación rápida...');
  
  try {
    // Verificar servicios básicos
    if (!window.prestamoService || !window.materialService) {
      throw new Error('Servicios básicos no disponibles');
    }
    
    ValidationLogger.success('Servicios básicos disponibles');
    
    // Test de funcionalidad básica
    const materiales = await window.materialService.listarMateriales();
    ValidationLogger.success(`Materiales cargados: ${materiales.length}`);
    
    ValidationLogger.success('✅ Validación rápida exitosa');
    return true;
    
  } catch (error) {
    ValidationLogger.error('❌ Validación rápida fallida:', error);
    return false;
  }
}

// Exponer funciones globalmente
window.validarSistemaCompleto = validarSistemaCompleto;
window.validacionRapida = validacionRapida;

// Mostrar instrucciones
console.log('📝 === INSTRUCCIONES DE VALIDACIÓN ===');
console.log('🎯 Para validación completa: validarSistemaCompleto()');
console.log('⚡ Para validación rápida: validacionRapida()');
console.log('📍 Ejecutar desde una página donde la app esté cargada');
console.log('⏱️ La validación completa puede tardar ~15-20 segundos');
console.log('=====================================');

// Auto-mensaje de carga
ValidationLogger.success('Sistema de validación completa cargado y listo');
