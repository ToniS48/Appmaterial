import { Actividad } from '../types/actividad';
import React from 'react';

/**
 * Guarda los datos de actividad en localStorage
 */
export const saveToLocalStorage = (data: Partial<Actividad>) => {
  try {
    localStorage.setItem('actividadFormData', JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

/**
 * Carga los datos de actividad desde localStorage
 */
export const loadFromLocalStorage = (): Partial<Actividad> | null => {
  try {
    const saved = localStorage.getItem('actividadFormData');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return null;
  }
};

/**
 * Intenta enviar un formulario a través de una referencia con manejo de errores estandarizado
 */
export const submitFormWithFallback = <T,>(
  ref: React.RefObject<{ submitForm: () => void }>,
  fallbackData: T | null | undefined,
  fallbackHandler: (data: T) => void
): boolean => {
  try {
    if (ref.current?.submitForm) {
      ref.current.submitForm();
      return true;
    } else if (fallbackData) {
      fallbackHandler(fallbackData);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al enviar formulario:", error);
    if (fallbackData) {
      fallbackHandler(fallbackData);
      return true;
    }
    return false;
  }
};