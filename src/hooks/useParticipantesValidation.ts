// hooks/useParticipantesValidation.ts
import { useZodValidation } from './useZodValidation';
import { participantesSchema } from '../schemas/actividadSchema';

export function useParticipantesValidation() {
  const validation = useZodValidation(participantesSchema);
    // Validar participantes (básico)
  const validateParticipantes = (participanteIds: string[], options: { showToast?: boolean } = {}) => {
    if (!participanteIds || participanteIds.length === 0) {
      validation.setError('participanteIds', 'Debe haber al menos un participante', options.showToast);
      return false;
    }
    return validation.validateField('participanteIds', participanteIds, options);
  };
  
  // Validar que el creador esté incluido
  const validateCreador = (participanteIds: string[], creadorId: string | null | undefined, options: { showToast?: boolean } = {}) => {
    if (!creadorId) {
      return true; // Si no hay creador, no validamos
    }
    
    if (!participanteIds || !participanteIds.includes(creadorId)) {
      validation.setError('participanteIds', 'El creador debe ser participante de la actividad', options.showToast);
      return false;
    }
    return true;
  };
  
  // Validar que el responsable esté incluido
  const validateResponsable = (participanteIds: string[], responsableId?: string | null, options: { showToast?: boolean } = {}) => {
    if (!responsableId) {
      return true; // Si no hay responsable, no validamos
    }
    
    if (!participanteIds || !participanteIds.includes(responsableId)) {
      validation.setError('participanteIds', 'El responsable debe ser participante de la actividad', options.showToast);
      return false;
    }
    return true;
  };

  return {
    ...validation,
    validateParticipantes,
    validateCreador,
    validateResponsable
  };
}