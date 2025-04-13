/**
 * Estados de carga para los formularios y componentes
 */
export type LoadingState = 
  | 'idle'              // Estado inicial/en reposo
  | 'validating_email'  // Verificando disponibilidad de email
  | 'submitting'        // Enviando formulario
  | 'resetting_password'; // Enviando solicitud de restablecimiento de contraseña