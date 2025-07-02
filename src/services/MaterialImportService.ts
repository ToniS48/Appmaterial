import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Material } from '../types/material';
import { Timestamp } from 'firebase/firestore';
import { completeMaterial } from './firestore/EntityDefaults';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  duplicates: ImportDuplicate[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportWarning {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportDuplicate {
  row: number;
  existingId: string;
  name: string;
  codigo?: string;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateDuplicates?: boolean;
  validateOnly?: boolean;
}

/**
 * Servicio para importar datos de materiales desde archivos CSV/Excel
 */
class MaterialImportService {
  
  /**
   * Importa materiales desde un archivo
   */
  async importFromFile(
    file: File, 
    existingMaterials: Material[], 
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const rawData = await this.parseFile(file);
      return await this.processMaterialData(rawData, existingMaterials, options);
    } catch (error) {
      console.error('Error al importar archivo:', error);
      return {
        success: false,
        importedCount: 0,
        errors: [{
          row: 0,
          message: `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
        }],
        warnings: [],
        duplicates: []
      };
    }
  }

  /**
   * Parsea un archivo CSV o Excel
   */
  private async parseFile(file: File): Promise<any[]> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      return this.parseCSVFile(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return this.parseExcelFile(file);
    } else {
      throw new Error('Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)');
    }
  }

  /**
   * Parsea un archivo CSV
   */
  private async parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Error al parsear CSV: ${results.errors[0].message}`));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(new Error(`Error al leer CSV: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parsea un archivo Excel
   */
  private async parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Tomar la primera hoja
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // Convertir a formato con headers
          if (jsonData.length < 2) {
            throw new Error('El archivo Excel debe tener al menos una fila de encabezados y una fila de datos');
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);
            const result = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = (row as any[])[index] || '';
            });
            return obj;
          });
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Error al procesar Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo Excel'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Procesa los datos parseados y los convierte a materiales
   */
  private async processMaterialData(
    rawData: any[], 
    existingMaterials: Material[], 
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      importedCount: 0,
      errors: [],
      warnings: [],
      duplicates: []
    };

    const materialsToImport: Omit<Material, 'id'>[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNumber = i + 2; // +2 porque empezamos en 1 y hay fila de headers
      
      try {
        // Validar fila
        const validation = this.validateRow(row, rowNumber);
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
        
        if (validation.errors.length > 0) {
          continue;
        }

        // Convertir a material
        const material = this.rowToMaterial(row);
        
        // Verificar duplicados
        const duplicate = this.findDuplicate(material, existingMaterials);
        if (duplicate) {
          result.duplicates.push({
            row: rowNumber,
            existingId: duplicate.id,
            name: material.nombre,
            codigo: material.codigo
          });
          
          if (options.skipDuplicates) {
            result.warnings.push({
              row: rowNumber,
              message: `Material duplicado omitido: ${material.nombre}`
            });
            continue;
          }
          
          if (!options.updateDuplicates) {
            result.errors.push({
              row: rowNumber,
              message: `Material duplicado encontrado: ${material.nombre}. Use la opción de actualizar duplicados o omitir duplicados.`
            });
            continue;
          }
        }
        
        materialsToImport.push(material);
        result.importedCount++;
        
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          message: `Error al procesar fila: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          data: row
        });
      }
    }

    // Si hay errores críticos, marcar como fallido
    if (result.errors.length > 0 && result.importedCount === 0) {
      result.success = false;
    }

    return result;
  }

  /**
   * Valida una fila de datos
   */
  private validateRow(row: any, rowNumber: number): { errors: ImportError[], warnings: ImportWarning[] } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Campos obligatorios
    if (!row.Nombre || row.Nombre.toString().trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'Nombre',
        message: 'El nombre es obligatorio'
      });
    }

    if (!row.Tipo || !['cuerda', 'anclaje', 'varios'].includes(row.Tipo)) {
      errors.push({
        row: rowNumber,
        field: 'Tipo',
        message: 'El tipo debe ser: cuerda, anclaje o varios'
      });
    }

    if (!row.Estado || !['disponible', 'prestado', 'mantenimiento', 'baja', 'perdido', 'revision', 'retirado'].includes(row.Estado)) {
      errors.push({
        row: rowNumber,
        field: 'Estado',
        message: 'Estado inválido'
      });
    }

    // Validar fechas
    const dateFields = ['Fecha Adquisición', 'Fecha Última Revisión', 'Próxima Revisión'];
    dateFields.forEach(field => {
      if (row[field] && !this.isValidDate(row[field])) {
        errors.push({
          row: rowNumber,
          field,
          message: `Formato de fecha inválido en ${field}. Use DD/MM/YYYY`
        });
      }
    });

    // Validar números
    if (row.Cantidad && isNaN(Number(row.Cantidad))) {
      errors.push({
        row: rowNumber,
        field: 'Cantidad',
        message: 'La cantidad debe ser un número'
      });
    }

    // Validaciones específicas por tipo
    if (row.Tipo === 'cuerda') {
      if (row['Longitud (m)'] && isNaN(Number(row['Longitud (m)']))) {
        warnings.push({
          row: rowNumber,
          field: 'Longitud (m)',
          message: 'La longitud debe ser un número'
        });
      }
      
      if (row['Diámetro (mm)'] && isNaN(Number(row['Diámetro (mm)']))) {
        warnings.push({
          row: rowNumber,
          field: 'Diámetro (mm)',
          message: 'El diámetro debe ser un número'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Convierte una fila de datos a un objeto Material
   */
  private rowToMaterial(row: any): Omit<Material, 'id'> {
    const now = new Date();
    
    // Crear objeto base con campos básicos
    const materialBase: any = {
      nombre: row.Nombre.toString().trim(),
      tipo: row.Tipo as 'cuerda' | 'anclaje' | 'varios',
      codigo: row.Codigo?.toString().trim() || undefined,
      estado: row.Estado as Material['estado'],
      cantidad: row.Cantidad ? Number(row.Cantidad) : 1,
      cantidadDisponible: row['Cantidad Disponible'] ? Number(row['Cantidad Disponible']) : (row.Cantidad ? Number(row.Cantidad) : 1),
      fechaAdquisicion: this.parseDate(row['Fecha Adquisición']) || Timestamp.fromDate(now),
      fechaUltimaRevision: this.parseDate(row['Fecha Última Revisión']) || Timestamp.fromDate(now),
      proximaRevision: this.parseDate(row['Próxima Revisión']) || Timestamp.fromDate(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())),
      observaciones: row.Observaciones?.toString().trim() || undefined,
      fechaCreacion: Timestamp.fromDate(now),
      fechaActualizacion: Timestamp.fromDate(now),
    };

    // Campos específicos por tipo
    if (materialBase.tipo === 'cuerda') {
      materialBase.longitud = row['Longitud (m)'] ? Number(row['Longitud (m)']) : undefined;
      materialBase.diametro = row['Diámetro (mm)'] ? Number(row['Diámetro (mm)']) : undefined;
      materialBase.usos = row.Usos ? Number(row.Usos) : 0;
      materialBase.tipoCuerda = row['Tipo Cuerda']?.toString().trim() || undefined;
      materialBase.fechaFabricacion = this.parseDate(row['Fecha Fabricación']) || undefined;
      materialBase.fechaPrimerUso = this.parseDate(row['Fecha Primer Uso']) || undefined;
      materialBase.vidaUtilRestante = row['Vida Útil Restante (%)'] ? Number(row['Vida Útil Restante (%)']) : undefined;
    }

    if (materialBase.tipo === 'anclaje') {
      materialBase.tipoAnclaje = row['Tipo Anclaje']?.toString().trim() || undefined;
    }

    if (materialBase.tipo === 'varios') {
      materialBase.categoria = row.Categoría?.toString().trim() || undefined;
      materialBase.subcategoria = row.Subcategoría?.toString().trim() || undefined;
      materialBase.descripcion = row.Descripción?.toString().trim() || undefined;
    }

    // Completar con valores por defecto para campos dinámicos
    return completeMaterial(materialBase);
  }

  /**
   * Busca duplicados basándose en nombre y código
   */
  private findDuplicate(material: Omit<Material, 'id'>, existing: Material[]): Material | null {
    return existing.find(m => 
      m.nombre.toLowerCase() === material.nombre.toLowerCase() ||
      (material.codigo && m.codigo && m.codigo.toLowerCase() === material.codigo.toLowerCase())
    ) || null;
  }

  /**
   * Valida si una fecha tiene formato válido
   */
  private isValidDate(dateStr: string): boolean {
    if (!dateStr) return false;
    
    // Formato DD/MM/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);
    
    if (!match) return false;
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  }

  /**
   * Convierte string de fecha a Timestamp
   */
  private parseDate(dateStr: string): Timestamp | null {
    if (!dateStr || !this.isValidDate(dateStr)) return null;
    
    const parts = dateStr.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const year = parseInt(parts[2]);
    
    return Timestamp.fromDate(new Date(year, month, day));
  }

  /**
   * Obtiene los materiales válidos para importar (sin validación solamente)
   */
  getMaterialsFromResult(
    rawData: any[], 
    existingMaterials: Material[], 
    options: ImportOptions = {}
  ): Promise<Omit<Material, 'id'>[]> {
    return this.processMaterialData(rawData, existingMaterials, { ...options, validateOnly: true })
      .then(result => {
        if (!result.success) {
          throw new Error('Los datos contienen errores que impiden la importación');
        }
        
        const materials: Omit<Material, 'id'>[] = [];
        
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          const validation = this.validateRow(row, i + 2);
          
          if (validation.errors.length === 0) {
            try {
              const material = this.rowToMaterial(row);
              const duplicate = this.findDuplicate(material, existingMaterials);
              
              if (!duplicate || options.updateDuplicates || !options.skipDuplicates) {
                materials.push(material);
              }
            } catch (error) {
              // Ignorar errores en modo validateOnly
            }
          }
        }
        
        return materials;
      });
  }
}

export const materialImportService = new MaterialImportService();
