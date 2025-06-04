import { useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Actividad } from '../types/actividad';

interface UseActividadFormAutoSaveProps {
  methods: UseFormReturn<Actividad>;
  isEditing: boolean;
}

export const useActividadFormAutoSave = ({ methods, isEditing }: UseActividadFormAutoSaveProps) => {
  const lastChangeTimeRef = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(false);

  // Autoguardado
  useEffect(() => {
    if (isEditing) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    if (methods.formState.isDirty && hasRecoveredDraft) {
      lastChangeTimeRef.current = Date.now();
      
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const formValues = methods.getValues();
          localStorage.setItem('actividadDraft', JSON.stringify(formValues));
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Borrador guardado automáticamente');
          }
        } catch (err) {
          console.error('Error al guardar borrador:', err);
        }
      }, 120000); // 2 minutos
      
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
  }, [methods.formState.isDirty, isEditing, hasRecoveredDraft]);

  // Recuperación de borrador
  useEffect(() => {
    if (isEditing) {
      localStorage.removeItem('actividadDraft');
      setHasRecoveredDraft(true);
      return;
    }
    
    const draft = localStorage.getItem('actividadDraft');
    if (draft) {
      if (window.confirm('Se encontró un borrador guardado de una actividad. ¿Desea recuperarlo?')) {
        try {
          const draftData = JSON.parse(draft);
          methods.reset(draftData);
        } catch (err) {
          console.error('Error al cargar borrador:', err);
          localStorage.removeItem('actividadDraft');
        }
      } else {
        localStorage.removeItem('actividadDraft');
      }
    }
    setHasRecoveredDraft(true);
  }, [isEditing, methods]);

  const clearDraft = () => {
    localStorage.removeItem('actividadDraft');
  };

  const checkUnsavedChanges = (): boolean => {
        return methods.formState.isDirty;
  };

  return {
    clearDraft,
    checkUnsavedChanges
  };
};
