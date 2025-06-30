/**
 * Firestore Data Converters - Manejo automático de campos faltantes
 * Garantiza compatibilidad y previene errores al leer/escribir documentos
 */

import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, WithFieldValue } from 'firebase/firestore';
import { Usuario } from '../../types/usuario';
import { Actividad } from '../../types/actividad';
import { Prestamo } from '../../types/prestamo';
import { Material } from '../../types/material';

// Tipos base para las configuraciones
export interface BaseConfig {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WeatherConfig extends BaseConfig {
  weatherEnabled: boolean;
  aemetEnabled: boolean;
  aemetUseForSpain: boolean;
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'ms' | 'mph';
  precipitationUnit: 'mm' | 'inch';
  // Campos adicionales que pueden ser añadidos dinámicamente
  [key: string]: any;
}

export interface MaterialConfig extends BaseConfig {
  porcentajeStockMinimo: number;
  diasRevisionPeriodica: number;
  tiempoMinimoEntrePrestamos: number;
  // Campos adicionales que pueden ser añadidos dinámicamente
  [key: string]: any;
}

export interface SystemConfig extends BaseConfig {
  appName: string;
  version: string;
  maintenanceMode: boolean;
  maxUsersOnline: number;
  // Campos adicionales que pueden ser añadidos dinámicamente
  [key: string]: any;
}

export interface GoogleApisConfig extends BaseConfig {
  // APIs Geográficas
  mapsJavaScriptApiKey: string;
  mapsEmbedApiKey: string;
  geocodingApiKey: string;
  
  // APIs de Productividad (Backend Only - Service Account)
  driveApiKey: string;
  calendarApiKey: string;
  
  // APIs de Comunicación
  gmailApiKey: string;
  chatApiKey: string;
  cloudMessagingApiKey: string;
  
  // APIs de Análisis y Datos
  analyticsApiKey: string;
  bigQueryApiKey: string;
  
  // APIs de Infraestructura
  pubSubApiKey: string;
  extensionsApiKey: string;
  
  // Configuraciones adicionales
  mapsDefaultZoom: number;
  mapsDefaultLatitude: number;
  mapsDefaultLongitude: number;
  
  // Estados de habilitación
  mapsEnabled: boolean;
  driveEnabled: boolean;
  calendarEnabled: boolean;
  gmailEnabled: boolean;
  chatEnabled: boolean;
  cloudMessagingEnabled: boolean;
  analyticsEnabled: boolean;
  bigQueryEnabled: boolean;
  pubSubEnabled: boolean;
  extensionsEnabled: boolean;
  
  // Campos adicionales que pueden ser añadidos dinámicamente
  [key: string]: any;
}

// Schema definitions para validación y completitud
export const WEATHER_CONFIG_SCHEMA = {
  weatherEnabled: { type: 'boolean', default: false, required: true },
  aemetEnabled: { type: 'boolean', default: false, required: true },
  aemetUseForSpain: { type: 'boolean', default: false, required: true },
  temperatureUnit: { type: 'string', default: 'celsius', required: true, enum: ['celsius', 'fahrenheit'] },
  windSpeedUnit: { type: 'string', default: 'kmh', required: true, enum: ['kmh', 'ms', 'mph'] },
  precipitationUnit: { type: 'string', default: 'mm', required: true, enum: ['mm', 'inch'] }
};

export const MATERIAL_CONFIG_SCHEMA = {
  porcentajeStockMinimo: { type: 'number', default: 10, required: true, min: 1, max: 100 },
  diasRevisionPeriodica: { type: 'number', default: 90, required: true, min: 1, max: 365 },
  tiempoMinimoEntrePrestamos: { type: 'number', default: 0, required: true, min: 0, max: 168 }
};

export const SYSTEM_CONFIG_SCHEMA = {
  appName: { type: 'string', default: 'Material App', required: true },
  version: { type: 'string', default: '1.0.0', required: true },
  maintenanceMode: { type: 'boolean', default: false, required: true },
  maxUsersOnline: { type: 'number', default: 100, required: true, min: 1, max: 1000 }
};

export const GOOGLE_APIS_CONFIG_SCHEMA = {
  // APIs Keys (pueden estar vacías inicialmente)
  mapsJavaScriptApiKey: { type: 'string', default: '', required: false },
  mapsEmbedApiKey: { type: 'string', default: '', required: false },
  geocodingApiKey: { type: 'string', default: '', required: false },
  driveApiKey: { type: 'string', default: '', required: false },
  calendarApiKey: { type: 'string', default: '', required: false },
  gmailApiKey: { type: 'string', default: '', required: false },
  chatApiKey: { type: 'string', default: '', required: false },
  cloudMessagingApiKey: { type: 'string', default: '', required: false },
  
  // Nuevas APIs de Análisis y Datos
  analyticsApiKey: { type: 'string', default: '', required: false },
  bigQueryApiKey: { type: 'string', default: '', required: false },
  
  // APIs de Infraestructura
  pubSubApiKey: { type: 'string', default: '', required: false },
  extensionsApiKey: { type: 'string', default: '', required: false },
  
  // Configuraciones por defecto de Maps
  mapsDefaultZoom: { type: 'number', default: 10, required: true, min: 1, max: 21 },
  mapsDefaultLatitude: { type: 'number', default: 40.4168, required: true, min: -90, max: 90 }, // Madrid
  mapsDefaultLongitude: { type: 'number', default: -3.7038, required: true, min: -180, max: 180 }, // Madrid
  
  // Estados de habilitación
  mapsEnabled: { type: 'boolean', default: false, required: true },
  driveEnabled: { type: 'boolean', default: false, required: true },
  calendarEnabled: { type: 'boolean', default: false, required: true },
  gmailEnabled: { type: 'boolean', default: false, required: true },
  chatEnabled: { type: 'boolean', default: false, required: true },
  cloudMessagingEnabled: { type: 'boolean', default: false, required: true },
  analyticsEnabled: { type: 'boolean', default: false, required: true },
  bigQueryEnabled: { type: 'boolean', default: false, required: true },
  pubSubEnabled: { type: 'boolean', default: false, required: true },
  extensionsEnabled: { type: 'boolean', default: false, required: true }
};

// Esquemas para colecciones principales (solo campos esenciales)
export const USUARIO_SCHEMA = {
  uid: { type: 'string', required: true, description: 'ID único del usuario en Firebase Auth' },
  email: { type: 'string', required: true, description: 'Email del usuario' },
  nombre: { type: 'string', required: true, description: 'Nombre del usuario' },
  apellidos: { type: 'string', required: true, description: 'Apellidos del usuario' },
  rol: { type: 'string', required: true, enum: ['admin', 'vocal', 'socio', 'invitado'], description: 'Rol del usuario' },
  // Otros campos se pueden añadir dinámicamente desde la UI
};

export const ACTIVIDAD_SCHEMA = {
  nombre: { type: 'string', required: true, description: 'Nombre de la actividad' },
  descripcion: { type: 'string', required: true, description: 'Descripción de la actividad' },
  lugar: { type: 'string', required: true, description: 'Lugar donde se realiza' },
  responsableActividadId: { type: 'string', required: true, description: 'ID del responsable de la actividad' },
  estado: { type: 'string', required: true, enum: ['planificada', 'en_curso', 'finalizada', 'cancelada'], description: 'Estado de la actividad' },
  creadorId: { type: 'string', required: true, description: 'ID del creador de la actividad' },
  // Otros campos se pueden añadir dinámicamente desde la UI
};

export const PRESTAMO_SCHEMA = {
  materialId: { type: 'string', required: true, description: 'ID del material prestado' },
  nombreMaterial: { type: 'string', required: true, description: 'Nombre del material' },
  usuarioId: { type: 'string', required: true, description: 'ID del usuario que toma el préstamo' },
  nombreUsuario: { type: 'string', required: true, description: 'Nombre del usuario' },
  cantidadPrestada: { type: 'number', required: true, min: 1, description: 'Cantidad prestada' },
  estado: { 
    type: 'string', 
    required: true, 
    enum: ['solicitado', 'aprobado', 'rechazado', 'en_uso', 'devuelto', 'expirado', 'pendiente', 'perdido', 'estropeado', 'cancelado', 'por_devolver'], 
    description: 'Estado del préstamo' 
  },
  // Otros campos se pueden añadir dinámicamente desde la UI
};

export const MATERIAL_SCHEMA = {
  nombre: { type: 'string', required: true, description: 'Nombre del material' },
  tipo: { type: 'string', required: true, enum: ['cuerda', 'anclaje', 'varios'], description: 'Tipo de material' },
  estado: { 
    type: 'string', 
    required: true, 
    enum: ['disponible', 'prestado', 'mantenimiento', 'baja', 'perdido', 'revision', 'retirado'], 
    description: 'Estado del material' 
  },
  cantidad: { type: 'number', default: 1, min: 0, description: 'Cantidad total' },
  cantidadDisponible: { type: 'number', default: 1, min: 0, description: 'Cantidad disponible' },
  // Otros campos se pueden añadir dinámicamente desde la UI
};

/**
 * Clase base para Data Converters con manejo automático de campos
 */
export class BaseFirestoreConverter<T extends BaseConfig> {
  constructor(
    private schema: Record<string, any>,
    private typeName: string
  ) {}

  /**
   * Aplica valores por defecto para campos faltantes
   */
  private applyDefaults(data: Partial<T>): T {
    const result = { ...data } as any;
    
    // Aplicar valores por defecto del schema
    Object.entries(this.schema).forEach(([key, definition]) => {
      if (result[key] === undefined || result[key] === null) {
        result[key] = definition.default;
        console.warn(`Campo faltante '${key}' en ${this.typeName}, aplicando valor por defecto:`, definition.default);
      }
    });

    // Añadir timestamps si no existen
    if (!result.updatedAt) {
      result.updatedAt = new Date();
    }
    if (!result.createdAt) {
      result.createdAt = result.updatedAt;
    }

    return result as T;
  }

  /**
   * Valida los datos según el schema
   */
  private validateData(data: T): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const dataAny = data as any;

    Object.entries(this.schema).forEach(([key, definition]) => {
      const value = dataAny[key];

      // Validar campos requeridos
      if (definition.required && (value === undefined || value === null)) {
        errors.push(`Campo requerido '${key}' faltante`);
        return;
      }

      if (value !== undefined && value !== null) {
        // Validar tipos
        if (definition.type === 'number' && typeof value !== 'number') {
          errors.push(`Campo '${key}' debe ser un número`);
        } else if (definition.type === 'string' && typeof value !== 'string') {
          errors.push(`Campo '${key}' debe ser una cadena`);
        } else if (definition.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Campo '${key}' debe ser un booleano`);
        }

        // Validar rangos numéricos
        if (definition.type === 'number' && typeof value === 'number') {
          if (definition.min !== undefined && value < definition.min) {
            errors.push(`Campo '${key}' debe ser mayor o igual a ${definition.min}`);
          }
          if (definition.max !== undefined && value > definition.max) {
            errors.push(`Campo '${key}' debe ser menor o igual a ${definition.max}`);
          }
        }

        // Validar enums
        if (definition.enum && !definition.enum.includes(value)) {
          errors.push(`Campo '${key}' debe ser uno de: ${definition.enum.join(', ')}`);
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Converter para escritura a Firestore
   */
  toFirestore(data: WithFieldValue<T>): DocumentData {
    try {
      // Aplicar defaults y validar
      const processedData = this.applyDefaults(data as T);
      const validation = this.validateData(processedData);

      if (!validation.isValid) {
        console.error(`Errores de validación en ${this.typeName}:`, validation.errors);
        // No bloqueamos la escritura, solo advertimos
      }

      // Convertir timestamps a objetos Date de Firestore
      const firestoreData = { ...processedData };
      if (firestoreData.createdAt instanceof Date) {
        // Se convertirá automáticamente por Firestore
      }
      if (firestoreData.updatedAt instanceof Date) {
        firestoreData.updatedAt = new Date(); // Siempre actualizar timestamp
      }

      console.log(`Escribiendo ${this.typeName} a Firestore:`, firestoreData);
      return firestoreData;
    } catch (error) {
      console.error(`Error en toFirestore para ${this.typeName}:`, error);
      throw error;
    }
  }

  /**
   * Converter para lectura desde Firestore
   */
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): T {
    try {
      const data = snapshot.data(options);
      
      // Aplicar defaults para campos faltantes
      const processedData = this.applyDefaults({
        ...data,
        id: snapshot.id,
        // Convertir timestamps de Firestore
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      } as Partial<T>);

      console.log(`Leyendo ${this.typeName} desde Firestore:`, processedData);
      return processedData;
    } catch (error) {
      console.error(`Error en fromFirestore para ${this.typeName}:`, error);
      // Retornar configuración con defaults en caso de error
      return this.applyDefaults({ id: snapshot.id } as Partial<T>);
    }
  }

  /**
   * Obtiene la configuración del converter
   */
  getConverter() {
    return {
      toFirestore: this.toFirestore.bind(this),
      fromFirestore: this.fromFirestore.bind(this)
    };
  }

  /**
   * Obtiene el schema para el componente de configuración
   */
  getSchema() {
    return this.schema;
  }

  /**
   * Crea una instancia con valores por defecto
   */
  createDefault(partial: Partial<T> = {}): T {
    return this.applyDefaults(partial);
  }

  /**
   * Obtiene el nombre del tipo
   */
  getTypeName(): string {
    return this.typeName;
  }
}

// Instancias de converters específicos
export const weatherConfigConverter = new BaseFirestoreConverter<WeatherConfig>(
  WEATHER_CONFIG_SCHEMA,
  'WeatherConfig'
);

export const materialConfigConverter = new BaseFirestoreConverter<MaterialConfig>(
  MATERIAL_CONFIG_SCHEMA,
  'MaterialConfig'
);

export const systemConfigConverter = new BaseFirestoreConverter<SystemConfig>(
  SYSTEM_CONFIG_SCHEMA,
  'SystemConfig'
);

export const googleApisConfigConverter = new BaseFirestoreConverter<GoogleApisConfig>(
  GOOGLE_APIS_CONFIG_SCHEMA,
  'GoogleApisConfig'
);

// Converters para colecciones principales
export const usuarioConverter = new BaseFirestoreConverter<Usuario>(
  USUARIO_SCHEMA,
  'Usuario'
);

export const actividadConverter = new BaseFirestoreConverter<Actividad>(
  ACTIVIDAD_SCHEMA,
  'Actividad'
);

export const prestamoConverter = new BaseFirestoreConverter<Prestamo>(
  PRESTAMO_SCHEMA,
  'Prestamo'
);

export const materialConverter = new BaseFirestoreConverter<Material>(
  MATERIAL_SCHEMA,
  'Material'
);

// Registro de todos los converters disponibles
export const FIRESTORE_CONVERTERS = {
  // Configuraciones
  weather: weatherConfigConverter,
  material: materialConfigConverter,
  system: systemConfigConverter,
  googleApis: googleApisConfigConverter,
  
  // Entidades principales de la aplicación
  usuarios: usuarioConverter,
  actividades: actividadConverter,
  prestamos: prestamoConverter,
  materials: materialConverter,
  material_deportivo: materialConverter, // Alias para la colección real
  
  // Colecciones de configuración comunes
  configuracion: systemConfigConverter // Para documentos de configuración general
};

// Utilidad para obtener converter por nombre
export const getConverter = (configType: keyof typeof FIRESTORE_CONVERTERS) => {
  return FIRESTORE_CONVERTERS[configType];
};

// Utilidad para aplicar merge seguro
export const safeFirestoreUpdate = async (
  docRef: any,
  updates: Record<string, any>,
  converterName: keyof typeof FIRESTORE_CONVERTERS
) => {
  try {
    const converter = getConverter(converterName);
    
    // Obtener datos actuales
    const currentDoc = await docRef.get();
    const currentData = currentDoc.exists() ? currentDoc.data() : {};
    
    // Merge con datos actuales
    const mergedData = { ...currentData, ...updates, updatedAt: new Date() };
    
    // Aplicar converter
    const processedData = converter.createDefault(mergedData);
    
    // Actualizar con merge
    await docRef.set(processedData, { merge: true });
    
    console.log(`Actualización segura completada para ${converterName}:`, processedData);
    return processedData;
  } catch (error) {
    console.error(`Error en actualización segura para ${converterName}:`, error);
    throw error;
  }
};

/**
 * Utilidades para completar automáticamente campos faltantes con valores por defecto
 * Esto permite agregar campos dinámicamente sin romper el código existente
 */

// Valores por defecto para campos dinámicos
export const DEFAULT_VALUES = {
  // Valores por defecto para usuarios
  usuario: {
    secciones: [] as string[] // Array vacío por defecto
  },
  
  // Valores por defecto para actividades
  actividad: {
    secciones: [] as string[], // Array vacío por defecto
    tipo: [] as string[],
    subtipo: [] as string[],
    participanteIds: [] as string[],
    materiales: [] as any[],
    comentarios: [] as any[],
    enlacesWikiloc: [] as any[],
    enlacesTopografias: [] as string[],
    enlacesDrive: [] as string[],
    enlacesWeb: [] as string[],
    necesidadMaterial: false,
    dificultad: 'baja' as 'baja' | 'media' | 'alta'
  },
  
  // Valores por defecto para materiales
  material: {
    secciones: [] as string[], // Array vacío por defecto
    cantidad: 1,
    cantidadDisponible: 1,
    usos: 0
  },
  
  // Valores por defecto para préstamos
  prestamo: {
    observaciones: '',
    actividadId: null
  }
};

/**
 * Completa un objeto Usuario con valores por defecto para campos faltantes
 */
export const completeUsuario = (usuario: Partial<Usuario>): Usuario => {
  const defaults = DEFAULT_VALUES.usuario;
  
  return {
    // Campos requeridos (deben estar presentes)
    uid: usuario.uid || '',
    email: usuario.email || '',
    nombre: usuario.nombre || '',
    apellidos: usuario.apellidos || '',
    rol: usuario.rol || 'socio',
    estadoAprobacion: usuario.estadoAprobacion || 'PENDIENTE' as any,
    estadoActividad: usuario.estadoActividad || 'INACTIVO' as any,
    pendienteVerificacion: usuario.pendienteVerificacion ?? true,
    
    // Campos opcionales con valores por defecto
    secciones: usuario.secciones || defaults.secciones,
    
    // Resto de campos opcionales (mantener tal como están)
    fechaUltimaActividad: usuario.fechaUltimaActividad,
    fechaUltimaConexion: usuario.fechaUltimaConexion,
    fechaAprobacion: usuario.fechaAprobacion,
    eliminado: usuario.eliminado,
    fechaEliminacion: usuario.fechaEliminacion,
    telefono: usuario.telefono,
    telefonosEmergencia: usuario.telefonosEmergencia,
    observaciones: usuario.observaciones,
    fechaCreacion: usuario.fechaCreacion,
    fechaActualizacion: usuario.fechaActualizacion,
    fechaRegistro: usuario.fechaRegistro,
    ultimaConexion: usuario.ultimaConexion,
    avatarUrl: usuario.avatarUrl,
    totalActividades: usuario.totalActividades,
    actividadesUltimos6Meses: usuario.actividadesUltimos6Meses,
    diasDesdeUltimaActividad: usuario.diasDesdeUltimaActividad,
    id: usuario.id
  } as Usuario;
};

/**
 * Completa un objeto Actividad con valores por defecto para campos faltantes
 */
export const completeActividad = (actividad: Partial<Actividad>): Omit<Actividad, 'id' | 'fechaCreacion'> => {
  const defaults = DEFAULT_VALUES.actividad;
  
  return {
    // Campos requeridos
    nombre: actividad.nombre || '',
    descripcion: actividad.descripcion || '',
    lugar: actividad.lugar || '',
    responsableActividadId: actividad.responsableActividadId || '',
    estado: actividad.estado || 'planificada',
    creadorId: actividad.creadorId || '',
    fechaInicio: actividad.fechaInicio || new Date(),
    fechaFin: actividad.fechaFin || new Date(),
    
    // Campos opcionales con valores por defecto
    secciones: actividad.secciones || defaults.secciones,
    tipo: actividad.tipo || defaults.tipo,
    subtipo: actividad.subtipo || defaults.subtipo,
    participanteIds: actividad.participanteIds || defaults.participanteIds,
    materiales: actividad.materiales || defaults.materiales,
    comentarios: actividad.comentarios || defaults.comentarios,
    enlacesWikiloc: actividad.enlacesWikiloc || defaults.enlacesWikiloc,
    enlacesTopografias: actividad.enlacesTopografias || defaults.enlacesTopografias,
    enlacesDrive: actividad.enlacesDrive || defaults.enlacesDrive,
    enlacesWeb: actividad.enlacesWeb || defaults.enlacesWeb,
    necesidadMaterial: actividad.necesidadMaterial ?? defaults.necesidadMaterial,
    dificultad: actividad.dificultad || defaults.dificultad,
    
    // Resto de campos opcionales
    ...actividad
  } as Omit<Actividad, 'id' | 'fechaCreacion'>;
};

/**
 * Completa un objeto Material con valores por defecto para campos faltantes
 */
export const completeMaterial = (material: Partial<Material>): Omit<Material, 'id'> => {
  const defaults = DEFAULT_VALUES.material;
  
  return {
    // Campos requeridos
    nombre: material.nombre || '',
    tipo: material.tipo || 'varios',
    estado: material.estado || 'disponible',
    fechaAdquisicion: material.fechaAdquisicion || new Date(),
    fechaUltimaRevision: material.fechaUltimaRevision || new Date(),
    proximaRevision: material.proximaRevision || new Date(),
    
    // Campos opcionales con valores por defecto
    secciones: material.secciones || defaults.secciones,
    cantidad: material.cantidad || defaults.cantidad,
    cantidadDisponible: material.cantidadDisponible || defaults.cantidadDisponible,
    usos: material.usos || defaults.usos,
    
    // Resto de campos opcionales
    ...material
  } as Omit<Material, 'id'>;
};

/**
 * Función genérica para completar cualquier tipo de entidad
 */
export const completeEntity = <T>(
  entity: Partial<T>, 
  entityType: 'usuario' | 'actividad' | 'material'
): T => {
  switch (entityType) {
    case 'usuario':
      return completeUsuario(entity as Partial<Usuario>) as T;
    case 'actividad':
      return completeActividad(entity as Partial<Actividad>) as T;
    case 'material':
      return completeMaterial(entity as Partial<Material>) as T;
    default:
      return entity as T;
  }
};
