// En un nuevo archivo useActividadState.ts
import { useReducer, useCallback } from 'react';
import { Actividad } from '../types/actividad';
import { getUniqueParticipanteIds } from '../utils/actividadUtils';
import { Timestamp } from 'firebase/firestore';

// Definir acciones tipadas
type ActividadAction = 
  | { type: 'UPDATE_INFO'; payload: Partial<Actividad> }
  | { type: 'UPDATE_PARTICIPANTES'; payload: { ids: string[], responsables?: { responsableId?: string, responsableMaterialId?: string } } }
  | { type: 'UPDATE_MATERIAL'; payload: { materiales: any[], necesidadMaterial: boolean } }
  | { type: 'SET_ACTIVIDAD'; payload: Actividad }
  | { type: 'RESET' };

// Reducer para manejar todas las actualizaciones
function actividadReducer(state: Actividad, action: ActividadAction): Actividad {
  switch (action.type) {
    case 'UPDATE_INFO':
      return { ...state, ...action.payload };
        case 'UPDATE_PARTICIPANTES': {
      const { ids, responsables } = action.payload;
      const newState = { ...state };
      
      // Actualizar responsables si se proporcionan
      if (responsables) {
        if (responsables.responsableId) {
          newState.responsableActividadId = responsables.responsableId;
        }
        if (responsables.responsableMaterialId) {
          newState.responsableMaterialId = responsables.responsableMaterialId;
        }
      }
      
      // Garantizar IDs únicos con la función centralizada
      newState.participanteIds = getUniqueParticipanteIds(
        ids,
        state.creadorId,
        newState.responsableActividadId,
        newState.responsableMaterialId
      );
      
      return newState;
    }
      case 'UPDATE_MATERIAL':
      return {
        ...state,
        materiales: action.payload.materiales,
        necesidadMaterial: action.payload.necesidadMaterial
      };
      
    case 'SET_ACTIVIDAD':
      return action.payload;
        case 'RESET':
      return createInitialActividadState();
    
    default:
      return state;
  }
}

// Función para crear el estado inicial
function createInitialActividadState(initialData?: Partial<Actividad>): Actividad {
  const defaultState: Actividad = {
    id: '',
    nombre: '',
    lugar: '',
    fechaInicio: Timestamp.fromDate(new Date()),
    fechaFin: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    descripcion: '',
    tipo: [],
    subtipo: [],
    participanteIds: [],
    creadorId: '',
    responsableActividadId: '',
    responsableMaterialId: '',
    materiales: [],
    necesidadMaterial: false,
    enlacesWikiloc: [],
    enlacesTopografias: [],
    enlacesDrive: [],
    enlacesWeb: [],
    enlaces: [],
    imagenesTopografia: [],
    archivosAdjuntos: [],    estado: 'planificada',
    comentarios: [],
    fechaCreacion: Timestamp.fromDate(new Date()),
    fechaActualizacion: Timestamp.fromDate(new Date())
  };
  
  return { ...defaultState, ...initialData };
}

// Hook personalizado para usar este estado
export function useActividadState(initialData?: Partial<Actividad>) {
  const [actividad, dispatch] = useReducer(
    actividadReducer, 
    createInitialActividadState(initialData)
  );

  const updateInfo = useCallback((data: Partial<Actividad>) => {
    dispatch({ type: 'UPDATE_INFO', payload: data });
  }, []);

  const updateParticipantes = useCallback((
    ids: string[], 
    responsables?: { responsableId?: string, responsableMaterialId?: string }
  ) => {
    dispatch({ 
      type: 'UPDATE_PARTICIPANTES', 
      payload: { ids, responsables } 
    });
  }, []);

  const updateMaterial = useCallback((materiales: any[], necesidadMaterial: boolean) => {
    dispatch({ 
      type: 'UPDATE_MATERIAL', 
      payload: { materiales, necesidadMaterial } 
    });
  }, []);

  const setActividad = useCallback((newActividad: Actividad) => {
    dispatch({ type: 'SET_ACTIVIDAD', payload: newActividad });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    actividad,
    updateInfo,
    updateParticipantes,
    updateMaterial,
    setActividad,
    reset
  };
}