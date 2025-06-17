/**
 * EJEMPLO PRÁCTICO - Seguimiento Completo de una Cuerda
 * 
 * Este archivo muestra un ejemplo real de cómo se vería el historial
 * completo de un material durante su ciclo de vida.
 */

// 📝 DATOS DE EJEMPLO: Cuerda Dinámica Petzl Volta 9.2mm

const materialEjemplo = {
  id: "cuerda-001",
  nombre: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
  tipo: "cuerda",
  codigo: "PZ-VOLTA-92-60",
  estado: "disponible",
  fechaAdquisicion: new Date("2024-01-15"),
  longitud: 60,
  diametro: 9.2,
  tipoCuerda: "espeleologia",
  fechaFabricacion: new Date("2023-10-01"),
  observaciones: "Cuerda nueva para actividades de espeleología"
};

// 📊 HISTORIAL COMPLETO DE EVENTOS (2024-2025)

const historialEventos = [
  // ✅ ADQUISICIÓN (Enero 2024)
  {
    id: "evento-001",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "adquisicion",
    fecha: new Date("2024-01-15"),
    año: 2024,
    mes: 1,
    descripcion: "Cuerda adquirida de Proveedor Vertical S.L.",
    estadoNuevo: "disponible",
    cantidadAfectada: 1,
    costoAsociado: 189.50,
    observaciones: "Comprada para ampliar inventario de cuerdas",
    registradoPor: "admin-001",
    nombreRegistrador: "Admin Principal"
  },

  // ✅ PRIMERA REVISIÓN (Febrero 2024)
  {
    id: "evento-002",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "primera_revision",
    fecha: new Date("2024-02-01"),
    año: 2024,
    mes: 2,
    descripcion: "Primera revisión tras adquisición. Estado perfecto.",
    estadoNuevo: "disponible",
    costoAsociado: 0,
    observaciones: "Sin defectos visibles. Lista para uso.",
    registradoPor: "vocal-001",
    nombreRegistrador: "Vocal Material"
  },

  // ✅ PRIMER PRÉSTAMO (Marzo 2024)
  {
    id: "evento-003",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "prestamo",
    fecha: new Date("2024-03-10"),
    año: 2024,
    mes: 3,
    descripcion: "Material prestado para actividad: Exploración Cueva de los Murciélagos",
    estadoAnterior: "disponible",
    estadoNuevo: "prestado",
    cantidadAfectada: 1,
    actividadId: "actividad-001",
    nombreActividad: "Exploración Cueva de los Murciélagos",
    usuarioResponsable: "socio-001",
    nombreUsuarioResponsable: "Carlos Rodríguez",
    registradoPor: "vocal-001",
    nombreRegistrador: "Vocal Material"
  },

  // ✅ DEVOLUCIÓN SIN INCIDENCIAS (Marzo 2024)
  {
    id: "evento-004",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "devolucion",
    fecha: new Date("2024-03-12"),
    año: 2024,
    mes: 3,
    descripcion: "Material devuelto de actividad: Exploración Cueva de los Murciélagos",
    estadoAnterior: "prestado",
    estadoNuevo: "disponible",
    cantidadAfectada: 1,
    actividadId: "actividad-001",
    nombreActividad: "Exploración Cueva de los Murciélagos",
    observaciones: "Devolución en perfecto estado",
    registradoPor: "vocal-001",
    nombreRegistrador: "Vocal Material"
  },

  // ⚠️ PRÉSTAMO CON INCIDENCIA (Junio 2024)
  {
    id: "evento-005",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "prestamo",
    fecha: new Date("2024-06-15"),
    año: 2024,
    mes: 6,
    descripción: "Material prestado para actividad: Descenso Sima Profunda",
    estadoAnterior: "disponible",
    estadoNuevo: "prestado",
    cantidadAfectada: 1,
    actividadId: "actividad-002",
    nombreActividad: "Descenso Sima Profunda",
    usuarioResponsable: "socio-002",
    nombreUsuarioResponsable: "María González",
    registradoPor: "vocal-001",
    nombreRegistrador: "Vocal Material"
  },

  // ❌ INCIDENCIA DURANTE USO (Junio 2024)
  {
    id: "evento-006",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "incidencia_menor",
    fecha: new Date("2024-06-17"),
    año: 2024,
    mes: 6,
    descripcion: "Desgaste superficial detectado en zona media de la cuerda por roce con roca",
    gravedad: "media",
    costoAsociado: 0,
    actividadId: "actividad-002",
    nombreActividad: "Descenso Sima Profunda",
    estadoAnterior: "prestado",
    estadoNuevo: "mantenimiento",
    observaciones: "Requiere inspección detallada antes del próximo uso",
    registradoPor: "socio-002",
    nombreRegistrador: "María González"
  },

  // 🔧 REVISIÓN POST-INCIDENCIA (Julio 2024)
  {
    id: "evento-007",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "revision_periodica",
    fecha: new Date("2024-07-05"),
    año: 2024,
    mes: 7,
    descripcion: "Revisión completa post-incidencia. Desgaste menor, apta para uso con precauciones.",
    estadoAnterior: "mantenimiento",
    estadoNuevo: "disponible",
    costoAsociado: 15.00,
    observaciones: "Revisión por especialista. Marcar zona de desgaste. Vida útil reducida.",
    registradoPor: "vocal-001",
    nombreRegistrador: "Vocal Material"
  },

  // ✅ VARIOS PRÉSTAMOS SIN INCIDENCIAS (Agosto-Diciembre 2024)
  // ... (eventos 008-015 serían préstamos y devoluciones normales) ...

  // 🔍 REVISIÓN ANUAL (Enero 2025)
  {
    id: "evento-016",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "revision_periodica",
    fecha: new Date("2025-01-15"),
    año: 2025,
    mes: 1,
    descripcion: "Revisión anual obligatoria. Cuerda en buen estado general con desgaste normal.",
    estadoNuevo: "disponible",
    costoAsociado: 25.00,
    observaciones: "Un año de uso. Desgaste dentro de parámetros normales. Apta para uso por 1 año más.",
    registradoPor: "vocal-001",
    nombreRegistrador: "Vocal Material"
  },

  // ❌ INCIDENCIA MAYOR (Abril 2025)
  {
    id: "evento-017",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "incidencia_mayor",
    fecha: new Date("2025-04-20"),
    año: 2025,
    mes: 4,
    descripcion: "Corte parcial en funda detectado durante devolución. Afecta seguridad.",
    gravedad: "alta",
    costoAsociado: 0,
    actividadId: "actividad-012",
    nombreActividad: "Travesía Cueva Compleja",
    estadoAnterior: "prestado",
    estadoNuevo: "baja",
    observaciones: "Daño irreparable. Cuerda retirada definitivamente del servicio.",
    evidenciaFotos: ["foto-corte-1.jpg", "foto-corte-2.jpg"],
    registradoPor: "vocal-001",
    nombreRegistrador: "Vocal Material"
  },

  // ⚰️ BAJA DEFINITIVA (Abril 2025)
  {
    id: "evento-018",
    materialId: "cuerda-001",
    nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
    tipoEvento: "baja_definitiva",
    fecha: new Date("2025-04-20"),
    año: 2025,
    mes: 4,
    descripcion: "Cuerda dada de baja definitivamente por daño en funda que compromete seguridad.",
    gravedad: "critica",
    estadoAnterior: "baja",
    estadoNuevo: "retirado",
    observaciones: "15 meses de servicio. 24 préstamos realizados. Causa de baja: daño por uso normal.",
    registradoPor: "admin-001",
    nombreRegistrador: "Admin Principal"
  }
];

// 📊 RESUMEN ANUAL 2024
const resumen2024 = {
  año: 2024,
  materialId: "cuerda-001",
  nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
  tipo: "cuerda",
  
  // Contadores de eventos
  totalEventos: 15,
  adquisiciones: 1,
  revisiones: 2,
  incidencias: 1,
  perdidas: 0,
  bajas: 0,
  prestamos: 12,
  
  // Análisis económico
  costoTotal: 204.50, // 189.50 adquisición + 15.00 revisión
  costoMantenimiento: 15.00,
  costoPerdidas: 0,
  
  // Estado al final del año
  estadoFinalAño: "disponible",
  diasEnUso: 280, // ~77% del año
  diasEnMantenimiento: 20, // ~5% del año
  diasPerdido: 0,
  
  // Eficiencia
  porcentajeUso: 77.0,
  incidenciasPorUso: 0.0036 // 1 incidencia / 280 días de uso
};

// 📊 RESUMEN ANUAL 2025 (Parcial hasta abril)
const resumen2025Parcial = {
  año: 2025,
  materialId: "cuerda-001",
  nombreMaterial: "Cuerda Dinámica Petzl Volta 9.2mm x 60m",
  tipo: "cuerda",
  
  // Contadores de eventos
  totalEventos: 4,
  adquisiciones: 0,
  revisiones: 1,
  incidencias: 1,
  perdidas: 0,
  bajas: 1,
  prestamos: 1,
  
  // Análisis económico
  costoTotal: 25.00, // Solo costo de revisión
  costoMantenimiento: 25.00,
  costoPerdidas: 189.50, // Valor de la cuerda perdida por baja
  
  // Estado al final del período
  estadoFinalAño: "retirado",
  diasEnUso: 105, // Hasta abril
  diasEnMantenimiento: 5,
  diasPerdido: 0,
  
  // Eficiencia
  porcentajeUso: 95.5, // Buen uso hasta el momento de la baja
  incidenciasPorUso: 0.0095 // 1 incidencia / 105 días de uso
};

// 🏆 ANÁLISIS FINAL DE LA CUERDA

const analisisFinalCuerda = {
  vidaUtil: "15 meses (enero 2024 - abril 2025)",
  totalPrestamos: 24,
  totalIncidencias: 2,
  costoTotal: 229.50, // Adquisición + mantenimiento
  costoPorUso: 9.56, // 229.50 / 24 usos
  eficienciaGeneral: "Buena",
  
  puntosFuertes: [
    "Uso intensivo sin problemas durante 12 meses",
    "Solo 2 incidencias en 24 préstamos (8.3%)",
    "Mantenimiento preventivo efectivo",
    "Documentación completa del ciclo de vida"
  ],
  
  puntosDebiles: [
    "Vida útil más corta de lo esperado (15 vs 24 meses esperados)",
    "Incidencia mayor no prevenible",
    "Costo por uso algo elevado"
  ],
  
  leccionesAprendidas: [
    "Intensificar inspecciones en actividades de alta abrasión",
    "Considerar cuerdas de mayor grosor para travesías complejas",
    "El seguimiento detallado permite optimizar compras futuras"
  ]
};

// 🎯 VALOR DEL SISTEMA DE SEGUIMIENTO

const valorDelSistema = {
  beneficiosObtenidos: [
    "✅ Trazabilidad completa del material",
    "✅ Identificación temprana de problemas",
    "✅ Optimización de costos basada en datos reales",
    "✅ Mejora en la planificación de compras",
    "✅ Cumplimiento de normativas de seguridad",
    "✅ Responsabilidad clara en cada uso"
  ],
  
  decisionesBasadasEnDatos: [
    "Comprar cuerdas de 10mm para travesías complejas",
    "Intensificar revisiones tras actividades de alto riesgo",
    "Presupuestar €230 por cuerda incluyendo mantenimiento",
    "Planificar reemplazo cada 18-24 meses según uso"
  ],
  
  ahorrosEstimados: [
    "Prevención de accidentes por material defectuoso",
    "Optimización de inventario (no sobre-stock)",
    "Reducción de pérdidas por tracking mejorado",
    "Mantenimiento predictivo vs reactivo"
  ]
};

/**
 * 🎓 LECCIONES PARA OTRAS ORGANIZACIONES
 * 
 * Este ejemplo muestra cómo un sistema de seguimiento detallado
 * permite tomar decisiones informadas sobre:
 * 
 * 1. **Compras**: Qué material comprar y cuándo
 * 2. **Mantenimiento**: Cuándo revisar y reparar
 * 3. **Seguridad**: Cuándo retirar material del servicio
 * 4. **Presupuesto**: Costos reales vs estimados
 * 5. **Responsabilidad**: Quién usó qué y cuándo
 * 
 * El ROI del sistema se ve en:
 * - Reducción de accidentes
 * - Optimización de inventario
 * - Mejores decisiones de compra
 * - Cumplimiento normativo
 * - Responsabilidad clara
 */

export {
  materialEjemplo,
  historialEventos,
  resumen2024,
  resumen2025Parcial,
  analisisFinalCuerda,
  valorDelSistema
};
