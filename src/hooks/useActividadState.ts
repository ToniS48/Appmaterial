// En un nuevo archivo useActividadState.ts
import { useReducer, useCallback } from 'react';
import { Actividad } from '../types/actividad';
import { getUniqueParticipanteIds } from '../utils/actividadUtils';

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
    
    // Otros casos...
    
    default:
      return state;
  }
}

// Hook personalizado para usar este estado
export function useActividadState(initialData?: Partial<Actividad>) {
  // Implementación del hook con useReducer...
}