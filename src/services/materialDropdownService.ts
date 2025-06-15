import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useState, useEffect } from 'react';

// Interfaces para la configuración de dropdowns
export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
}

export interface MaterialDropdownConfig {
  estados: DropdownOption[];
  tiposCuerda: DropdownOption[];
  tiposAnclaje: DropdownOption[];
  categoriasVarios: DropdownOption[];
  subcategoriasVarios: Record<string, DropdownOption[]>;
  subcategoriasAnclaje: Record<string, DropdownOption[]>;
}

// Configuración por defecto
const DEFAULT_CONFIG: MaterialDropdownConfig = {
  estados: [
    { value: 'disponible', label: 'Disponible', color: 'green' },
    { value: 'prestado', label: 'Prestado', color: 'orange' },
    { value: 'mantenimiento', label: 'Mantenimiento', color: 'blue' },
    { value: 'baja', label: 'Baja', color: 'gray' },
    { value: 'perdido', label: 'Perdido', color: 'red' }
  ],
  tiposCuerda: [
    { value: 'espeleologia', label: 'Espeleología' },
    { value: 'barrancos', label: 'Barrancos' },
    { value: 'mixta', label: 'Mixta' }
  ],
  tiposAnclaje: [
    { value: 'quimico', label: 'Químico' },
    { value: 'mecanico', label: 'Mecánico' },
    { value: 'as', label: 'AS' },
    { value: 'otro', label: 'Otro' }
  ],
  categoriasVarios: [
    { value: 'equipoTPV', label: 'Equipo TPV' },
    { value: 'tienda', label: 'Tienda' },
    { value: 'poteEstanco', label: 'Pote Estanco' },
    { value: 'iluminacion', label: 'Iluminación' },
    { value: 'arneses', label: 'Arneses' },
    { value: 'mosquetones', label: 'Mosquetones' },
    { value: 'herramientas', label: 'Herramientas' },
    { value: 'otro', label: 'Otro' }
  ],
  subcategoriasVarios: {
    equipoTPV: [
      { value: 'bloqueadores', label: 'Bloqueadores' },
      { value: 'descensores', label: 'Descensores' },
      { value: 'poleas', label: 'Poleas' },
      { value: 'otro', label: 'Otro' }
    ],
    tienda: [
      { value: 'carpas', label: 'Carpas' },
      { value: 'toldos', label: 'Toldos' },
      { value: 'otro', label: 'Otro' }
    ],
    iluminacion: [
      { value: 'frontales', label: 'Frontales' },
      { value: 'lamparas', label: 'Lámparas' },
      { value: 'baterias', label: 'Baterías' },
      { value: 'otro', label: 'Otro' }
    ],
    arneses: [
      { value: 'completos', label: 'Arneses completos' },
      { value: 'pecho', label: 'Arneses de pecho' },
      { value: 'pelvis', label: 'Arneses de pelvis' },
      { value: 'otro', label: 'Otro' }
    ],
    mosquetones: [
      { value: 'hms', label: 'HMS' },
      { value: 'seguridad', label: 'Seguridad' },
      { value: 'basicos', label: 'Básicos' },
      { value: 'otro', label: 'Otro' }
    ],    herramientas: [
      { value: 'taladros', label: 'Taladros' },
      { value: 'brocas', label: 'Brocas' },
      { value: 'martillos', label: 'Martillos' },
      { value: 'otro', label: 'Otro' }
    ]
  },
  subcategoriasAnclaje: {
    quimico: [
      { value: 'resinas', label: 'Resinas' },
      { value: 'spit', label: 'Spit' },
      { value: 'epoxi', label: 'Epoxi' },
      { value: 'otro', label: 'Otro' }
    ],
    mecanico: [
      { value: 'chapas', label: 'Chapas' },
      { value: 'clavos', label: 'Clavos de roca' },
      { value: 'pitons', label: 'Pitones' },
      { value: 'otro', label: 'Otro' }
    ],
    as: [
      { value: 'as8', label: 'AS-8' },
      { value: 'as10', label: 'AS-10' },
      { value: 'as12', label: 'AS-12' },
      { value: 'otro', label: 'Otro' }
    ],
    otro: [
      { value: 'natural', label: 'Anclaje natural' },
      { value: 'empotrado', label: 'Empotrado' },
      { value: 'otro', label: 'Otro' }
    ]
  }
};

// ID del documento en Firestore
const CONFIG_DOC_ID = 'material-dropdowns';

/**
 * Obtener la configuración de dropdowns de material
 */
export const getMaterialDropdownConfig = async (): Promise<MaterialDropdownConfig> => {
  try {
    const docRef = doc(db, 'configuracion', CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {      const data = docSnap.data() as MaterialDropdownConfig;
      // Validar que la estructura sea correcta y completar con valores por defecto si faltan
      return {
        estados: data.estados || DEFAULT_CONFIG.estados,
        tiposCuerda: data.tiposCuerda || DEFAULT_CONFIG.tiposCuerda,
        tiposAnclaje: data.tiposAnclaje || DEFAULT_CONFIG.tiposAnclaje,
        categoriasVarios: data.categoriasVarios || DEFAULT_CONFIG.categoriasVarios,
        subcategoriasVarios: data.subcategoriasVarios || DEFAULT_CONFIG.subcategoriasVarios,
        subcategoriasAnclaje: data.subcategoriasAnclaje || DEFAULT_CONFIG.subcategoriasAnclaje
      };
    } else {
      // Si no existe el documento, crear uno con la configuración por defecto
      await setDoc(docRef, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('Error al obtener configuración de dropdowns:', error);
    // En caso de error, devolver la configuración por defecto
    return DEFAULT_CONFIG;
  }
};

/**
 * Actualizar la configuración de dropdowns de material
 */
export const updateMaterialDropdownConfig = async (config: MaterialDropdownConfig): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', CONFIG_DOC_ID);
      // Validar datos antes de guardar
    const validatedConfig: MaterialDropdownConfig = {
      estados: Array.isArray(config.estados) ? config.estados : DEFAULT_CONFIG.estados,
      tiposCuerda: Array.isArray(config.tiposCuerda) ? config.tiposCuerda : DEFAULT_CONFIG.tiposCuerda,
      tiposAnclaje: Array.isArray(config.tiposAnclaje) ? config.tiposAnclaje : DEFAULT_CONFIG.tiposAnclaje,
      categoriasVarios: Array.isArray(config.categoriasVarios) ? config.categoriasVarios : DEFAULT_CONFIG.categoriasVarios,
      subcategoriasVarios: config.subcategoriasVarios && typeof config.subcategoriasVarios === 'object' 
        ? config.subcategoriasVarios 
        : DEFAULT_CONFIG.subcategoriasVarios,
      subcategoriasAnclaje: config.subcategoriasAnclaje && typeof config.subcategoriasAnclaje === 'object'
        ? config.subcategoriasAnclaje
        : DEFAULT_CONFIG.subcategoriasAnclaje
    };
    
    // Agregar timestamp de actualización
    await setDoc(docRef, {
      ...validatedConfig,
      lastUpdated: new Date(),
      updatedBy: 'admin' // En una implementación real, usar el UID del usuario actual
    });
    
    console.log('✅ Configuración de dropdowns actualizada correctamente');
  } catch (error) {
    console.error('❌ Error al actualizar configuración de dropdowns:', error);
    throw new Error('No se pudo guardar la configuración. Inténtalo de nuevo.');
  }
};

/**
 * Obtener opciones de un dropdown específico
 */
export const getDropdownOptions = async (type: keyof MaterialDropdownConfig): Promise<DropdownOption[]> => {
  try {
    const config = await getMaterialDropdownConfig();
    return config[type] as DropdownOption[];
  } catch (error) {
    console.error(`Error al obtener opciones para ${type}:`, error);
    return DEFAULT_CONFIG[type] as DropdownOption[];
  }
};

/**
 * Obtener subcategorías para una categoría específica
 */
export const getSubcategoriesForCategory = async (categoria: string): Promise<DropdownOption[]> => {
  try {
    const config = await getMaterialDropdownConfig();
    return config.subcategoriasVarios[categoria] || [];
  } catch (error) {
    console.error(`Error al obtener subcategorías para ${categoria}:`, error);
    return DEFAULT_CONFIG.subcategoriasVarios[categoria] || [];
  }
};

/**
 * Hook personalizado para usar la configuración de dropdowns en componentes React
 */
export const useMaterialDropdownConfig = () => {
  const [config, setConfig] = useState<MaterialDropdownConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMaterialDropdownConfig();
      setConfig(data);
    } catch (err) {
      setError('Error al cargar configuración');
      console.error('Error in useMaterialDropdownConfig:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadConfig();
  }, []);
  
  return { config, isLoading, error, reload: loadConfig };
};
