declare module '@google-cloud/storage' {
  // Exportar el tipo Bucket que necesita firebase-admin
  export class Bucket {
    // Propiedades y métodos mínimos necesarios
    name: string;
    // Añadir otros métodos/propiedades según sea necesario
  }
  
  // Corregir la definición de CRC32C sin usar 'static' en la interfaz
  namespace Storage {
    interface CRC32C {
      CRC32C_EXTENSION_TABLE: Int32Array;
    }
  }
  
  // Corregir la declaración global que causa problemas
  namespace globals {
    // Declaración que corrige el error del uso de generic en Int32Array
    const CRC32C_EXTENSION_TABLE: Int32Array;
  }
}

// Declaración para corregir el tipo usado en el archivo crc32c.d.ts
declare interface Int32ArrayWithBuffer extends Int32Array {}