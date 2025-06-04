// Utilidades básicas para formularios

/**
 * Guarda datos de formulario en localStorage
 */
export const saveFormData = (data: any): void => {
  try {
    localStorage.setItem('actividadFormData', JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar datos del formulario:', error);
  }
};

/**
 * Carga datos de formulario desde localStorage
 */
export const loadFormData = (): any => {
  try {
    const data = localStorage.getItem('actividadFormData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error al cargar datos del formulario:', error);
    return null;
  }
};

/**
 * Limpia datos de formulario de localStorage
 */
export const clearFormData = (): void => {
  try {
    localStorage.removeItem('actividadFormData');
  } catch (error) {
    console.error('Error al limpiar datos del formulario:', error);
  }
};

/**
 * Envía un formulario de referencia o datos de respaldo
 */
export const submitFormOrFallback = (ref: any, fallbackData?: any): void => {
  try {
    if (ref && ref.current) {
      ref.current.submitForm();
    } else if (fallbackData) {
      // Manejar datos de respaldo
      console.log('Usando datos de respaldo:', fallbackData);
    }
  } catch (error) {
    console.error('Error al enviar formulario:', error);
    // Manejar error de envío
  }
};
