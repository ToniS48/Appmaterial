/**
 * Hook de negocio para administración dinámica de esquemas de Firestore
 * Separa la lógica de negocio de la UI del FirestoreSchemaManager
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  firestoreDynamicService, 
  CollectionSchema, 
  FieldDefinition, 
  FirestoreDocument,
  NormalizationOptions,
  NormalizationResult,
  DocumentNormalizationNeeds
} from '../../services/firestore/FirestoreDynamicService';

export interface UseFirestoreSchemaManagerState {
  selectedCollection: string;
  schema: CollectionSchema | null;
  documents: FirestoreDocument[];
  loading: boolean;
  error: string | null;
  success: string | null;
  availableCollections: string[]; // Nuevo: colecciones detectadas automáticamente
}

export interface UseFirestoreSchemaManagerActions {
  setSelectedCollection: (collection: string) => void;
  loadCollectionData: (collectionName?: string, forceReload?: boolean) => Promise<void>;
  addCustomField: (fieldName: string, definition: FieldDefinition) => Promise<void>;
  removeCustomField: (fieldName: string) => Promise<void>;
  clearMessages: () => void;
  getAvailableCollections: () => string[];
  getExistingFieldNames: () => string[];
  validateFieldName: (fieldName: string) => { isValid: boolean; error?: string };
  validateFieldDefinition: (definition: FieldDefinition) => { isValid: boolean; errors: string[] };
  
  // Funciones de normalización
  analyzeNormalizationNeeds: (limitDocuments?: number) => Promise<DocumentNormalizationNeeds[]>;
  normalizeDocuments: (options: NormalizationOptions) => Promise<NormalizationResult>;
  
  // Nueva función para cargar colecciones detectadas automáticamente
  loadAvailableCollections: () => Promise<void>;
}

export const useFirestoreSchemaManager = (): UseFirestoreSchemaManagerState & UseFirestoreSchemaManagerActions => {
  const [state, setState] = useState<UseFirestoreSchemaManagerState>({
    selectedCollection: '',
    schema: null,
    documents: [],
    loading: false,
    error: null,
    success: null,
    availableCollections: [] // Inicializar como array vacío
  });

  const setSelectedCollection = useCallback((collection: string) => {
    setState(prev => ({
      ...prev,
      selectedCollection: collection,
      schema: null,
      documents: [],
      error: null,
      success: null
    }));
  }, []);

  const loadCollectionData = useCallback(async (collectionName?: string, forceReload: boolean = false) => {
    const collection = collectionName || state.selectedCollection;
    if (!collection) return;

    setState(prev => ({ ...prev, loading: true, error: null, success: null }));
    
    try {
      const [schemaData, documentsData] = await Promise.all([
        firestoreDynamicService.getCollectionSchema(collection as any),
        forceReload 
          ? firestoreDynamicService.forceReloadDocuments(collection as any, 10)
          : firestoreDynamicService.getCollectionDocuments(collection as any, 5)
      ]);

      setState(prev => ({
        ...prev,
        schema: schemaData,
        documents: documentsData,
        loading: false,
        success: `Esquema de ${collection} cargado correctamente${forceReload ? ' (recarga forzada)' : ''}`
      }));
    } catch (error) {
      console.error('Error cargando datos:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
    }
  }, [state.selectedCollection]);

  const addCustomField = useCallback(async (fieldName: string, definition: FieldDefinition) => {
    if (!state.selectedCollection) {
      setState(prev => ({ ...prev, error: 'No hay colección seleccionada' }));
      return;
    }

    // Validaciones previas
    const fieldValidation = validateFieldName(fieldName);
    if (!fieldValidation.isValid) {
      setState(prev => ({ ...prev, error: fieldValidation.error || 'Nombre de campo inválido' }));
      return;
    }

    const definitionValidation = validateFieldDefinition(definition);
    if (!definitionValidation.isValid) {
      setState(prev => ({ 
        ...prev, 
        error: `Errores en la definición del campo: ${definitionValidation.errors.join(', ')}` 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, success: null }));
    
    try {
      await firestoreDynamicService.addCustomField(
        state.selectedCollection as any,
        fieldName,
        definition
      );
      
      // Recargar datos pasando explícitamente la colección
      await loadCollectionData(state.selectedCollection);
      
      setState(prev => ({
        ...prev,
        loading: false,
        success: `Campo '${fieldName}' añadido correctamente`
      }));
    } catch (error) {
      console.error('Error añadiendo campo:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Error añadiendo campo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
    }
  }, [state.selectedCollection, loadCollectionData]);

  const removeCustomField = useCallback(async (fieldName: string) => {
    if (!state.selectedCollection) {
      setState(prev => ({ ...prev, error: 'No hay colección seleccionada' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, success: null }));
    
    try {
      await firestoreDynamicService.removeCustomField(state.selectedCollection as any, fieldName);
      
      // Recargar datos pasando explícitamente la colección
      await loadCollectionData(state.selectedCollection);
      
      setState(prev => ({
        ...prev,
        loading: false,
        success: `Campo '${fieldName}' eliminado correctamente`
      }));
    } catch (error) {
      console.error('Error eliminando campo:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Error eliminando campo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
    }
  }, [state.selectedCollection, loadCollectionData]);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Nueva función para cargar colecciones disponibles de forma asíncrona
  const loadAvailableCollections = useCallback(async () => {
    try {
      console.log('[HOOK] Cargando colecciones disponibles...');
      const collections = await firestoreDynamicService.getAvailableCollectionsAsync();
      setState(prev => ({
        ...prev,
        availableCollections: collections
      }));
      console.log('[HOOK] Colecciones cargadas:', collections);
    } catch (error) {
      console.error('[HOOK] Error cargando colecciones:', error);
      // Fallback a colecciones sincrónicas
      try {
        const fallbackCollections = firestoreDynamicService.getAvailableCollections();
        setState(prev => ({
          ...prev,
          availableCollections: fallbackCollections
        }));
      } catch (fallbackError) {
        console.error('[HOOK] Error en fallback de colecciones:', fallbackError);
      }
    }
  }, []);

  // Cargar colecciones disponibles al inicializar el hook
  useEffect(() => {
    loadAvailableCollections();
  }, [loadAvailableCollections]);

  const getAvailableCollections = useCallback(() => {
    // Si tenemos colecciones detectadas automáticamente, las usamos
    if (state.availableCollections.length > 0) {
      return state.availableCollections;
    }
    // Fallback al método sincrónico
    return firestoreDynamicService.getAvailableCollections();
  }, [state.availableCollections]);

  const getExistingFieldNames = useCallback((): string[] => {
    if (!state.schema) return [];
    return [
      ...state.schema.baseFields.map(f => f.name),
      ...state.schema.customFields.map(f => f.name)
    ];
  }, [state.schema]);

  const validateFieldName = useCallback((fieldName: string): { isValid: boolean; error?: string } => {
    if (!fieldName.trim()) {
      return { isValid: false, error: 'El nombre del campo es requerido' };
    }

    const existingFields = getExistingFieldNames();
    if (existingFields.includes(fieldName)) {
      return { isValid: false, error: 'Este nombre de campo ya existe' };
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
      return { isValid: false, error: 'Nombre inválido. Use solo letras, números y guiones bajos' };
    }

    if (fieldName.length < 2 || fieldName.length > 50) {
      return { isValid: false, error: 'El nombre debe tener entre 2 y 50 caracteres' };
    }

    // Evitar nombres reservados de Firestore
    const reservedNames = ['id', 'createdAt', 'updatedAt', '__name__', '__path__'];
    if (reservedNames.includes(fieldName)) {
      return { isValid: false, error: 'Nombre reservado por el sistema' };
    }

    return { isValid: true };
  }, [getExistingFieldNames]);

  const validateFieldDefinition = useCallback((definition: FieldDefinition): { isValid: boolean; errors: string[] } => {
    return firestoreDynamicService.validateFieldDefinition(definition);
  }, []);

  // Funciones de normalización
  const analyzeNormalizationNeeds = useCallback(async (limitDocuments?: number): Promise<DocumentNormalizationNeeds[]> => {
    if (!state.selectedCollection) {
      throw new Error('No hay colección seleccionada');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const collectionType = state.selectedCollection as keyof typeof import('../../services/firestore/FirestoreConverters').FIRESTORE_CONVERTERS;
      const needs = await firestoreDynamicService.analyzeDocumentNormalizationNeeds(collectionType, limitDocuments);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        success: `Análisis completado: ${needs.length} documentos necesitan normalización`
      }));
      
      return needs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [state.selectedCollection]);

  const normalizeDocuments = useCallback(async (options: NormalizationOptions): Promise<NormalizationResult> => {
    if (!state.selectedCollection) {
      throw new Error('No hay colección seleccionada');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const collectionType = state.selectedCollection as keyof typeof import('../../services/firestore/FirestoreConverters').FIRESTORE_CONVERTERS;
      const result = await firestoreDynamicService.normalizeCollectionDocuments(collectionType, options);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        success: `Normalización completada: ${result.documentsUpdated}/${result.totalDocuments} documentos actualizados`
      }));

      // Recargar datos para reflejar cambios
      await loadCollectionData(state.selectedCollection, true);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [state.selectedCollection, loadCollectionData]);

  return {
    // State
    ...state,
    
    // Actions
    setSelectedCollection,
    loadCollectionData,
    addCustomField,
    removeCustomField,
    clearMessages,
    getAvailableCollections,
    getExistingFieldNames,
    validateFieldName,
    validateFieldDefinition,
    analyzeNormalizationNeeds,
    normalizeDocuments,
    loadAvailableCollections
  };
};
