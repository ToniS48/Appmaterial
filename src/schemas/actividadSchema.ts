import { z } from 'zod';
import validationMessages from '../constants/validationMessages';
import { isValidUrl } from '../utils/actividadUtils';

// Esquema para enlaces
export const enlaceSchema = z.object({
  url: z.string()
    .url(validationMessages.invalidUrl)
    .refine(val => isValidUrl(val), validationMessages.invalidUrl),
  descripcion: z.string().optional()
});

// Esquema para material asignado
export const materialAsignadoSchema = z.object({
  materialId: z.string().min(1, validationMessages.required),
  nombre: z.string().min(1, validationMessages.required),
  cantidad: z.number().int().positive(validationMessages.positiveNumber)
});

// Esquema básico para actividades (para validación del formulario)
export const actividadBaseSchema = z.object({
  nombre: z.string().min(1, validationMessages.activity.nameRequired),
  lugar: z.string().min(1, validationMessages.activity.placeRequired),
  descripcion: z.string().optional(),
  tipo: z.array(z.string()).optional(), // Opcional en el formulario
  subtipo: z.array(z.string()).optional(), // Opcional en el formulario
  fechaInicio: z.date({
    required_error: validationMessages.activity.startDateRequired,
    invalid_type_error: validationMessages.invalidDate
  }),
  fechaFin: z.date({
    required_error: validationMessages.activity.endDateRequired,
    invalid_type_error: validationMessages.invalidDate
  }),
  responsableActividadId: z.string().optional(),
  responsableMaterialId: z.string().optional(),
  necesidadMaterial: z.boolean().default(false)
});

// Esquema completo para actividades (para validación final al guardar)
export const actividadCompletaSchema = actividadBaseSchema.extend({
  tipo: z.array(z.string()).min(1, validationMessages.activity.typeRequired),
  subtipo: z.array(z.string()).min(1, validationMessages.activity.subtypeRequired)
});

// Esquema para la pestaña de participantes
export const participantesSchema = z.object({
  participanteIds: z.array(z.string()).min(1, validationMessages.activity.participantsMin)
});

// Esquema para la pestaña de materiales
export const materialesSchema = z.object({
  materiales: z.array(materialAsignadoSchema).optional()
});

// Esquema para la pestaña de enlaces
export const enlacesSchema = z.object({
  enlacesWikiloc: z.array(enlaceSchema).optional(),
  enlacesTopografias: z.array(enlaceSchema).optional(),
  enlacesDrive: z.array(enlaceSchema).optional(),
  enlacesWeb: z.array(enlaceSchema).optional()
});

// Crear un esquema de fecha personalizado para la validación
export const fechasSchema = z.object({
  fechaInicio: z.date(),
  fechaFin: z.date()
}).refine(
  data => data.fechaInicio <= data.fechaFin,
  {
    message: validationMessages.endDateBeforeStart,
    path: ['fechaFin']
  }
);

// Esquema completo para validación final de actividad
export const actividadCompleteSchema = actividadBaseSchema
  .merge(participantesSchema)
  .merge(materialesSchema)
  .merge(enlacesSchema)
  // Aplicar el refine directamente aquí en lugar de usar merge con fechasSchema
  .refine(
    data => data.fechaInicio <= data.fechaFin,
    {
      message: validationMessages.endDateBeforeStart,
      path: ['fechaFin']
    }
  );