/**
 * Servicio para análisis y procesamiento de datos de usuarios para gráficos
 */
import { Usuario } from '../../../types/usuario';
import { 
  ConfiguracionGrafico, 
  DatosGrafico, 
  ResultadoAnalisis,
  FiltroUsuario,
  MetricaUsuario,
  PeriodoTiempo,
  COLORES_TEMA,
  PALETAS_COLORES
} from './tipos';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export class AnalisisUsuariosService {
  
  /**
   * Filtra usuarios según los criterios especificados
   */
  private filtrarUsuarios(usuarios: Usuario[], filtros?: FiltroUsuario): Usuario[] {
    if (!filtros) return usuarios;
    
    return usuarios.filter(usuario => {
      // Filtro por roles
      if (filtros.roles && filtros.roles.length > 0) {
        if (!filtros.roles.includes(usuario.rol)) return false;
      }
      
      // Filtro por estados de aprobación
      if (filtros.estadosAprobacion && filtros.estadosAprobacion.length > 0) {
        if (!filtros.estadosAprobacion.includes(usuario.estadoAprobacion)) return false;
      }
      
      // Filtro por estados de actividad
      if (filtros.estadosActividad && filtros.estadosActividad.length > 0) {
        if (!filtros.estadosActividad.includes(usuario.estadoActividad)) return false;
      }
      
      // Filtro por fecha de registro
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaRegistro = this.convertirFecha(usuario.fechaCreacion || usuario.fechaRegistro);
        if (!fechaRegistro) return false;
        
        if (filtros.fechaDesde && isBefore(fechaRegistro, filtros.fechaDesde)) return false;
        if (filtros.fechaHasta && isAfter(fechaRegistro, filtros.fechaHasta)) return false;
      }
      
      // Filtro por última conexión
      if (filtros.ultimaConexionDesde) {
        const ultimaConexion = this.convertirFecha(usuario.fechaUltimaConexion || usuario.ultimaConexion);
        if (!ultimaConexion || isBefore(ultimaConexion, filtros.ultimaConexionDesde)) return false;
      }
      
      // Filtro solo activos
      if (filtros.soloActivos && usuario.estadoActividad !== 'activo') return false;
      
      // Filtro incluir eliminados
      if (!filtros.incluyeEliminados && usuario.eliminado) return false;
      
      return true;
    });
  }

  /**
   * Convierte diferentes tipos de fecha a Date
   */
  private convertirFecha(fecha: any): Date | null {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;
    if (fecha.toDate && typeof fecha.toDate === 'function') return fecha.toDate();
    if (typeof fecha === 'string') return new Date(fecha);
    return null;
  }

  /**
   * Genera datos para gráfico de registros por mes
   */
  private generarRegistrosPorMes(usuarios: Usuario[], año?: number): DatosGrafico {
    const añoActual = año || new Date().getFullYear();
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const registrosPorMes = new Array(12).fill(0);
    
    usuarios.forEach(usuario => {
      const fechaRegistro = this.convertirFecha(usuario.fechaCreacion || usuario.fechaRegistro);
      if (fechaRegistro && fechaRegistro.getFullYear() === añoActual) {
        registrosPorMes[fechaRegistro.getMonth()]++;
      }
    });

    return {
      labels: meses,
      datasets: [{
        label: `Registros ${añoActual}`,
        data: registrosPorMes,
        backgroundColor: PALETAS_COLORES.azules[4],
        borderColor: PALETAS_COLORES.azules[5],
        borderWidth: 2
      }]
    };
  }

  /**
   * Genera datos para gráfico de estados de aprobación
   */
  private generarEstadosAprobacion(usuarios: Usuario[]): DatosGrafico {
    const estados = {
      aprobado: 0,
      pendiente: 0,
      rechazado: 0
    };

    usuarios.forEach(usuario => {
      const estado = usuario.estadoAprobacion || 'pendiente';
      if (estado in estados) {
        estados[estado as keyof typeof estados]++;
      }
    });

    return {
      labels: ['Aprobados', 'Pendientes', 'Rechazados'],
      datasets: [{
        label: 'Estados de Aprobación',
        data: [estados.aprobado, estados.pendiente, estados.rechazado],
        backgroundColor: [
          COLORES_TEMA.success,
          COLORES_TEMA.warning,
          COLORES_TEMA.error
        ],
        borderWidth: 2
      }]
    };
  }

  /**
   * Genera datos para gráfico de distribución de roles
   */
  private generarDistribucionRoles(usuarios: Usuario[]): DatosGrafico {
    const roles = {
      admin: 0,
      vocal: 0,
      socio: 0,
      invitado: 0
    };

    usuarios.forEach(usuario => {
      if (usuario.rol in roles) {
        roles[usuario.rol as keyof typeof roles]++;
      }
    });

    return {
      labels: ['Administradores', 'Vocales', 'Socios', 'Invitados'],
      datasets: [{
        label: 'Distribución por Roles',
        data: [roles.admin, roles.vocal, roles.socio, roles.invitado],
        backgroundColor: [
          COLORES_TEMA.purple,
          COLORES_TEMA.primary,
          COLORES_TEMA.info,
          COLORES_TEMA.secondary
        ],
        borderWidth: 2
      }]
    };
  }

  /**
   * Genera datos para gráfico de actividad temporal
   */
  private generarActividadTemporal(usuarios: Usuario[], meses: number = 12): DatosGrafico {
    const fechaInicio = subMonths(new Date(), meses - 1);
    const labels: string[] = [];
    const registros: number[] = [];
    const ultimasConexiones: number[] = [];

    for (let i = 0; i < meses; i++) {
      const mes = subMonths(new Date(), meses - 1 - i);
      const inicioMes = startOfMonth(mes);
      const finMes = endOfMonth(mes);
      
      labels.push(format(mes, 'MMM yyyy', { locale: es }));
      
      // Contar registros en este mes
      const registrosDelMes = usuarios.filter(usuario => {
        const fechaRegistro = this.convertirFecha(usuario.fechaCreacion || usuario.fechaRegistro);
        return fechaRegistro && fechaRegistro >= inicioMes && fechaRegistro <= finMes;
      }).length;
      
      // Contar últimas conexiones en este mes
      const conexionesDelMes = usuarios.filter(usuario => {
        const ultimaConexion = this.convertirFecha(usuario.fechaUltimaConexion || usuario.ultimaConexion);
        return ultimaConexion && ultimaConexion >= inicioMes && ultimaConexion <= finMes;
      }).length;
      
      registros.push(registrosDelMes);
      ultimasConexiones.push(conexionesDelMes);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Nuevos Registros',
          data: registros,
          backgroundColor: PALETAS_COLORES.azules[4],
          borderColor: PALETAS_COLORES.azules[5],
          borderWidth: 2,
          fill: false
        },
        {
          label: 'Conexiones Activas',
          data: ultimasConexiones,
          backgroundColor: PALETAS_COLORES.verdes[4],
          borderColor: PALETAS_COLORES.verdes[5],
          borderWidth: 2,
          fill: false
        }
      ]
    };
  }

  /**
   * Genera datos para análisis de última conexión
   */
  private generarAnalisisUltimaConexion(usuarios: Usuario[]): DatosGrafico {
    const ahora = new Date();
    const rangos = {
      'Últimos 7 días': 0,
      'Últimos 30 días': 0,
      'Últimos 3 meses': 0,
      'Últimos 6 meses': 0,
      'Más de 6 meses': 0,
      'Nunca': 0
    };

    usuarios.forEach(usuario => {
      const ultimaConexion = this.convertirFecha(usuario.fechaUltimaConexion || usuario.ultimaConexion);
      
      if (!ultimaConexion) {
        rangos['Nunca']++;
        return;
      }

      const diasDesdeConexion = Math.floor((ahora.getTime() - ultimaConexion.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasDesdeConexion <= 7) {
        rangos['Últimos 7 días']++;
      } else if (diasDesdeConexion <= 30) {
        rangos['Últimos 30 días']++;
      } else if (diasDesdeConexion <= 90) {
        rangos['Últimos 3 meses']++;
      } else if (diasDesdeConexion <= 180) {
        rangos['Últimos 6 meses']++;
      } else {
        rangos['Más de 6 meses']++;
      }
    });

    return {
      labels: Object.keys(rangos),
      datasets: [{
        label: 'Usuarios por Última Conexión',
        data: Object.values(rangos),
        backgroundColor: PALETAS_COLORES.naranjas.slice(1, -1),
        borderWidth: 2
      }]
    };
  }

  /**
   * Genera datos para tendencia de aprobaciones
   */
  private generarTendenciaAprobaciones(usuarios: Usuario[], meses: number = 12): DatosGrafico {
    const labels: string[] = [];
    const aprobados: number[] = [];
    const rechazados: number[] = [];

    for (let i = 0; i < meses; i++) {
      const mes = subMonths(new Date(), meses - 1 - i);
      const inicioMes = startOfMonth(mes);
      const finMes = endOfMonth(mes);
      
      labels.push(format(mes, 'MMM yyyy', { locale: es }));
      
      const aprobadosDelMes = usuarios.filter(usuario => {
        const fechaAprobacion = this.convertirFecha(usuario.fechaAprobacion);
        return fechaAprobacion && fechaAprobacion >= inicioMes && fechaAprobacion <= finMes && usuario.estadoAprobacion === 'aprobado';
      }).length;
      
      const rechazadosDelMes = usuarios.filter(usuario => {
        const fechaRegistro = this.convertirFecha(usuario.fechaCreacion || usuario.fechaRegistro);
        return fechaRegistro && fechaRegistro >= inicioMes && fechaRegistro <= finMes && usuario.estadoAprobacion === 'rechazado';
      }).length;
      
      aprobados.push(aprobadosDelMes);
      rechazados.push(rechazadosDelMes);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Aprobados',
          data: aprobados,
          backgroundColor: 'rgba(72, 187, 120, 0.2)',
          borderColor: COLORES_TEMA.success,
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Rechazados',
          data: rechazados,
          backgroundColor: 'rgba(245, 101, 101, 0.2)',
          borderColor: COLORES_TEMA.error,
          borderWidth: 2,
          fill: true
        }
      ]
    };
  }

  /**
   * Calcula estadísticas básicas
   */
  private calcularEstadisticas(datos: number[]): { total: number; promedio: number; maximo: number; minimo: number } {
    const total = datos.reduce((sum, val) => sum + val, 0);
    const promedio = datos.length > 0 ? total / datos.length : 0;
    const maximo = Math.max(...datos, 0);
    const minimo = Math.min(...datos, 0);
    
    return { total, promedio, maximo, minimo };
  }

  /**
   * Genera insights automáticos
   */
  private generarInsights(configuracion: ConfiguracionGrafico, datos: DatosGrafico, usuarios: Usuario[]): string[] {
    const insights: string[] = [];
    const totalUsuarios = usuarios.length;

    switch (configuracion.metrica) {
      case 'registrosPorMes':
        const datosRegistros = datos.datasets[0].data as number[];
        const mesConMasRegistros = datosRegistros.indexOf(Math.max(...datosRegistros));
        const totalRegistros = datosRegistros.reduce((sum, val) => sum + val, 0);
        
        insights.push(`Se registraron ${totalRegistros} usuarios en el período analizado`);
        if (mesConMasRegistros >= 0) {
          insights.push(`${datos.labels[mesConMasRegistros]} fue el mes con más registros (${datosRegistros[mesConMasRegistros]})`);
        }
        break;

      case 'estadosAprobacion':
        const aprobados = (datos.datasets[0].data as number[])[0];
        const pendientes = (datos.datasets[0].data as number[])[1];
        const tasaAprobacion = totalUsuarios > 0 ? (aprobados / totalUsuarios * 100).toFixed(1) : '0';
        
        insights.push(`Tasa de aprobación: ${tasaAprobacion}%`);
        if (pendientes > 0) {
          insights.push(`${pendientes} usuarios están pendientes de aprobación`);
        }
        break;

      case 'distribucionRoles':
        const rolesData = datos.datasets[0].data as number[];
        const maxRolIndex = rolesData.indexOf(Math.max(...rolesData));
        const rolPredominante = datos.labels[maxRolIndex];
        
        insights.push(`El rol predominante es: ${rolPredominante} (${rolesData[maxRolIndex]} usuarios)`);
        break;

      case 'ultimaConexion':
        const conexionData = datos.datasets[0].data as number[];
        const usuariosActivos = conexionData[0] + conexionData[1]; // 7 días + 30 días
        const porcentajeActivos = totalUsuarios > 0 ? (usuariosActivos / totalUsuarios * 100).toFixed(1) : '0';
        
        insights.push(`${porcentajeActivos}% de usuarios han estado activos en el último mes`);
        if (conexionData[5] > 0) { // Nunca conectados
          insights.push(`${conexionData[5]} usuarios nunca se han conectado`);
        }
        break;
    }

    return insights;
  }

  /**
   * Analiza usuarios según la configuración especificada
   */
  async analizarUsuarios(usuarios: Usuario[], configuracion: ConfiguracionGrafico): Promise<ResultadoAnalisis> {
    // Aplicar filtros
    const usuariosFiltrados = this.filtrarUsuarios(usuarios, configuracion.filtros);
    
    let datos: DatosGrafico;
    
    // Generar datos según la métrica
    switch (configuracion.metrica) {
      case 'registrosPorMes':
        datos = this.generarRegistrosPorMes(usuariosFiltrados);
        break;
      case 'estadosAprobacion':
        datos = this.generarEstadosAprobacion(usuariosFiltrados);
        break;
      case 'distribucionRoles':
        datos = this.generarDistribucionRoles(usuariosFiltrados);
        break;
      case 'actividadTemporal':
        datos = this.generarActividadTemporal(usuariosFiltrados);
        break;
      case 'ultimaConexion':
        datos = this.generarAnalisisUltimaConexion(usuariosFiltrados);
        break;
      case 'tendenciaAprobaciones':
        datos = this.generarTendenciaAprobaciones(usuariosFiltrados);
        break;
      default:
        throw new Error(`Métrica no soportada: ${configuracion.metrica}`);
    }

    // Calcular estadísticas
    const primerDataset = datos.datasets[0]?.data as number[] || [];
    const estadisticas = this.calcularEstadisticas(primerDataset);

    // Generar insights
    const insights = this.generarInsights(configuracion, datos, usuariosFiltrados);

    return {
      configuracion,
      datos,
      estadisticas,
      insights
    };
  }

  /**
   * Obtiene todas las métricas disponibles con sus configuraciones
   */
  getMetricasDisponibles(): { id: MetricaUsuario; nombre: string; descripcion: string; tiposCompatibles: string[] }[] {
    return [
      {
        id: 'registrosPorMes',
        nombre: 'Registros por Mes',
        descripcion: 'Cantidad de usuarios registrados cada mes',
        tiposCompatibles: ['bar', 'line']
      },
      {
        id: 'estadosAprobacion',
        nombre: 'Estados de Aprobación',
        descripcion: 'Distribución de usuarios por estado de aprobación',
        tiposCompatibles: ['pie', 'doughnut', 'bar']
      },
      {
        id: 'distribucionRoles',
        nombre: 'Distribución de Roles',
        descripcion: 'Cantidad de usuarios por rol',
        tiposCompatibles: ['pie', 'doughnut', 'bar']
      },
      {
        id: 'actividadTemporal',
        nombre: 'Actividad Temporal',
        descripcion: 'Evolución de la actividad en el tiempo',
        tiposCompatibles: ['line', 'area', 'bar']
      },
      {
        id: 'ultimaConexion',
        nombre: 'Análisis de Conexiones',
        descripcion: 'Distribución por última conexión',
        tiposCompatibles: ['bar', 'histogram', 'pie']
      },
      {
        id: 'tendenciaAprobaciones',
        nombre: 'Tendencia de Aprobaciones',
        descripcion: 'Evolución de aprobaciones y rechazos',
        tiposCompatibles: ['area', 'line', 'bar']
      }
    ];
  }
}

export const analisisUsuariosService = new AnalisisUsuariosService();
