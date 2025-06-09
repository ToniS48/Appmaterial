import { useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Actividad } from '../types/actividad';
import { serializeTimestampsForStorage, deserializeTimestampsFromStorage } from '../utils/dateUtils';

interface UseActividadFormAutoSaveProps {
  methods: UseFormReturn<Actividad>;
  isEditing: boolean;
  validation?: {
    revalidateAllFields: (data: any, silencioso?: boolean) => any;
  };
}

export const useActividadFormAutoSave = ({ methods, isEditing, validation }: UseActividadFormAutoSaveProps) => {
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
          const formValues = methods.getValues();          // NUEVA ESTRATEGIA: Serializar timestamps correctamente para localStorage
          const serializedData = serializeTimestampsForStorage(formValues);
          localStorage.setItem('actividadDraft', JSON.stringify(serializedData));
          
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
      const draft = localStorage.getItem('actividadDraft');    if (draft) {
      if (window.confirm('Se encontró un borrador guardado de una actividad. ¿Desea recuperarlo?')) {        try {
          const parsedData = JSON.parse(draft);
          // NUEVA ESTRATEGIA: Deserializar timestamps correctamente desde localStorage
          const draftData = deserializeTimestampsFromStorage(parsedData);
          
          console.log('🔄 [AutoSave] Recuperando borrador con fechas deserializadas:', draftData);
          methods.reset(draftData);
          
          // CORRECCIÓN: Sincronizar validación después de cargar el borrador
          if (validation) {
            setTimeout(() => {
              const data = methods.getValues();
              console.log('🔄 [AutoSave] Sincronizando validación después de cargar borrador:', data);
              validation.revalidateAllFields(data, false);
              console.log('✅ [AutoSave] Validación sincronizada después de cargar borrador');
            }, 100);
          }
          
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
