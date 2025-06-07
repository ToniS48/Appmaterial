import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { Actividad } from '../types/actividad';
import { useActividadForm } from './useActividadForm';
import { useAuth } from '../contexts/AuthContext';

interface UseActividadFormActionsProps {
  actividadId?: string;
}

export const useActividadFormActions = ({ actividadId }: UseActividadFormActionsProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    formData,
    loading,
    error: formError,
    updateInfo,
    updateParticipantes,
    updateMaterial,
    updateEnlaces,
    saveActividad,
  } = useActividadForm({ actividadId });

  // Inicializar usuario actual para nuevas actividades
  const initializeNewActivity = () => {
    if (!actividadId && currentUser && !formData.creadorId) {
      updateInfo({
        creadorId: currentUser.uid,
        responsableActividadId: currentUser.uid
      });
    }
  };
  const handleDataUpdate = async (data: Partial<Actividad>) => {
    try {
      // Determinar qué tipo de actualización realizar
      if (data.participanteIds !== undefined || data.responsableActividadId !== undefined) {
        updateParticipantes(data.participanteIds || [], {
          responsableId: data.responsableActividadId,
          responsableMaterialId: data.responsableMaterialId
        });
      } else if (data.materiales !== undefined) {
        updateMaterial(data.materiales);
      } else if (data.enlacesWikiloc !== undefined || data.enlacesTopografias !== undefined || 
                 data.enlacesDrive !== undefined || data.enlacesWeb !== undefined || 
                 data.enlaces !== undefined) {
        updateEnlaces(data);
      } else {
        updateInfo(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar datos');
      throw err;
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setError(null);
      const result = await saveActividad();
      
      if (result) {
        localStorage.removeItem('actividadDraft');
        setSuccessMessage('Actividad guardada correctamente');
        
        toast({
          title: "Éxito",
          description: "Actividad guardada correctamente",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        setTimeout(() => navigate('/activities'), 2000);
        return true;
      } else {
        setError('No se pudo guardar la actividad. Revise los campos obligatorios.');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al guardar la actividad: ' + errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      return false;
    }
  };

  const handleCancel = (isDirty: boolean) => {
    if (isDirty) {
      if (window.confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
        localStorage.removeItem('actividadDraft');
        navigate('/activities');
      }
    } else {
      navigate('/activities');
    }
  };

  const handleResponsablesChange = (responsableActividadId: string, responsableMaterialId?: string) => {
    updateParticipantes(
      formData.participanteIds || [],
      { responsableId: responsableActividadId, responsableMaterialId }
    );
  };

    const handleNecesidadMaterialChange = (necesita: boolean) => {
    const updatedData = {
      ...formData,
      necesidadMaterial: necesita
    };
    updateInfo(updatedData);
  };

  return {
    formData,
    loading,
    error: error || formError,
    successMessage,
    handleDataUpdate,
    handleFinalSubmit,
    handleCancel,
    handleResponsablesChange,
    handleNecesidadMaterialChange,
    initializeNewActivity,
    setError,
    setSuccessMessage
  };
};
