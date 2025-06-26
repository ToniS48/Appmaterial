/**
 * Mensajes estandarizados para validaciones
 */
const validationMessages = {
  required: 'Este campo es obligatorio',
  invalidEmail: 'El correo electrónico no es válido',
  invalidUrl: 'La URL no es válida',
  positiveNumber: 'Debe ser un número positivo',
  endDateBeforeStart: 'La fecha de finalización debe ser posterior a la de inicio',
  invalidDate: 'La fecha no es válida',
  
  // Específicos para actividades
  activity: {
    nameRequired: 'El nombre de la actividad es obligatorio',
    placeRequired: 'El lugar de la actividad es obligatorio',
    startDateRequired: 'La fecha de inicio es obligatoria',
    endDateRequired: 'La fecha de finalización es obligatoria',
    typeRequired: 'El tipo de actividad es obligatorio',
    subtypeRequired: 'El subtipo de actividad es obligatorio',
    participantsMin: 'Debe seleccionar al menos un participante',
    dateRangeInvalid: 'La fecha de fin debe ser posterior a la fecha de inicio',
  },
  
  // Específicos para material
  material: {
    nameRequired: 'El nombre del material es obligatorio',
    codeRequired: 'El código es obligatorio',
    typeRequired: 'El tipo de material es obligatorio',
    stateRequired: 'El estado del material es obligatorio',
    quantityInvalid: 'La cantidad debe ser un número positivo',
  },
  
  // Específicos para préstamos
  loan: {
    userRequired: 'Debe seleccionar un usuario',
    materialRequired: 'Debe seleccionar un material',
    startDateRequired: 'La fecha de inicio es obligatoria',
    endDateRequired: 'La fecha de devolución es obligatoria',
    quantityInvalid: 'La cantidad debe ser mayor que cero y no superior a la disponible',
  }
};

export default validationMessages;
