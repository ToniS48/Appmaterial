/**
 * Script temporal para corregir automáticamente todos los archivos que tienen errores
 * de campos faltantes después de agregar campos dinámicos
 */

import { completeUsuario, completeMaterial } from '../services/firestore/EntityDefaults';

// Este es un script de referencia para mostrar cómo se deben usar las funciones helper
// en los archivos que tienen errores

// EJEMPLO 1: Para usuarioService.ts - completar usuarios
const ejemploUsuario = {
  uid: 'user123',
  email: 'test@example.com',
  nombre: 'Test',
  apellidos: 'User',
  rol: 'socio' as const,
  estadoAprobacion: 'PENDIENTE' as any,
  estadoActividad: 'INACTIVO' as any,
  pendienteVerificacion: true
};

// Usar la función helper para completar automáticamente
const usuarioCompleto = completeUsuario(ejemploUsuario);

// EJEMPLO 2: Para MaterialImportService.ts - completar materiales
const ejemploMaterial = {
  nombre: 'Cuerda dinámica',
  tipo: 'cuerda' as const,
  estado: 'disponible' as const,
  fechaAdquisicion: new Date(),
  fechaUltimaRevision: new Date(),
  proximaRevision: new Date()
};

// Usar la función helper para completar automáticamente
const materialCompleto = completeMaterial(ejemploMaterial);

export { usuarioCompleto, materialCompleto };
