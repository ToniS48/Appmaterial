import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Material } from '../types/material';
import { format } from 'date-fns';
import { toTimestamp, timestampToDate } from '../utils/dateUtils';

export type ExportFormat = 'csv' | 'excel' | 'json';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeSpecificFields?: boolean;
  filename?: string;
}

/**
 * Servicio para exportar datos de materiales a diferentes formatos
 */
class MaterialExportService {
  /**
   * Exporta materiales al formato especificado
   */
  async exportMaterials(materials: Material[], options: ExportOptions): Promise<void> {
    try {
      const exportData = this.prepareExportData(materials, options);
      const filename = options.filename || this.generateFilename(options.format);

      switch (options.format) {
        case 'csv':
          await this.exportToCSV(exportData, filename);
          break;
        case 'excel':
          await this.exportToExcel(exportData, filename);
          break;
        case 'json':
          await this.exportToJSON(exportData, filename);
          break;
        default:
          throw new Error(`Formato de exportación no soportado: ${options.format}`);
      }
    } catch (error) {
      console.error('Error al exportar materiales:', error);
      throw new Error(`Error al exportar materiales: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Prepara los datos para exportación
   */
  private prepareExportData(materials: Material[], options: ExportOptions): any[] {
    return materials.map(material => {
      const baseData = {
        ID: material.id,
        Nombre: material.nombre,
        Tipo: material.tipo,
        Codigo: material.codigo || '',
        Estado: material.estado,
        Cantidad: material.cantidad || 0,
        'Cantidad Disponible': material.cantidadDisponible || 0,
        'Fecha Adquisición': this.formatDate(material.fechaAdquisicion),
        'Fecha Última Revisión': this.formatDate(material.fechaUltimaRevision),
        'Próxima Revisión': this.formatDate(material.proximaRevision),
        Observaciones: material.observaciones || '',
      };

      if (options.includeSpecificFields) {
        // Campos específicos para cuerdas
        if (material.tipo === 'cuerda') {
          Object.assign(baseData, {
            'Longitud (m)': material.longitud || '',
            'Diámetro (mm)': material.diametro || '',
            'Usos': material.usos || 0,
            'Tipo Cuerda': material.tipoCuerda || '',
            'Fecha Fabricación': this.formatDate(material.fechaFabricacion),
            'Fecha Primer Uso': this.formatDate(material.fechaPrimerUso),
            'Vida Útil Restante (%)': material.vidaUtilRestante || '',
          });
        }

        // Campos específicos para anclajes
        if (material.tipo === 'anclaje') {
          Object.assign(baseData, {
            'Tipo Anclaje': material.tipoAnclaje || '',
          });
        }

        // Campos específicos para varios
        if (material.tipo === 'varios') {
          Object.assign(baseData, {
            Categoría: material.categoria || '',
            Subcategoría: material.subcategoria || '',
            Descripción: material.descripcion || '',
          });
        }
      }

      if (options.includeMetadata) {
        Object.assign(baseData, {
          'Fecha Creación': this.formatDate(material.fechaCreacion),
          'Fecha Actualización': this.formatDate(material.fechaActualizacion),
        });
      }

      return baseData;
    });
  }

  /**
   * Exporta a formato CSV
   */
  private async exportToCSV(data: any[], filename: string): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob(['\uFEFF' + csv], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    saveAs(blob, `${filename}.csv`);
  }

  /**
   * Exporta a formato Excel
   */
  private async exportToExcel(data: any[], filename: string): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Configurar el ancho de las columnas
    const maxWidth = 20;
    const wscols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
    worksheet['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materiales');
    
    // Generar el archivo
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `${filename}.xlsx`);
  }

  /**
   * Exporta a formato JSON
   */
  private async exportToJSON(data: any[], filename: string): Promise<void> {
    const exportObject = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalRecords: data.length,
      },
      materials: data,
    };
    
    const json = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([json], { 
      type: 'application/json;charset=utf-8;' 
    });
    
    saveAs(blob, `${filename}.json`);
  }  /**
   * Genera un nombre de archivo basado en la fecha actual
   */
  private generateFilename(exportFormat: ExportFormat): string {
    const date = format(new Date(), 'yyyy-MM-dd_HH-mm');
    return `materiales_${date}`;
  }
  /**
   * Formatea una fecha para exportación
   */  private formatDate(date: any): string {
    if (!date) return '';
    
    try {
      // NUEVA ESTRATEGIA: Usar timestampToDate para conversión segura
      const dateObj = timestampToDate(toTimestamp(date));
      if (dateObj) {
        return format(dateObj, 'dd/MM/yyyy');
      }
      
      return '';
    } catch (error) {
      console.warn('Error al formatear fecha:', error);
      return '';
    }
  }

  /**
   * Genera una plantilla CSV para importación
   */
  async generateImportTemplate(): Promise<void> {
    const templateData = [{
      Nombre: 'Ejemplo Cuerda Dinámica',
      Tipo: 'cuerda',
      Codigo: 'CD001',
      Estado: 'disponible',
      Cantidad: 1,
      'Fecha Adquisición': '01/01/2024',
      'Fecha Última Revisión': '01/01/2024',
      'Próxima Revisión': '01/07/2024',
      Observaciones: 'Cuerda nueva para escalada deportiva',
      'Longitud (m)': 60,
      'Diámetro (mm)': 9.8,
      'Tipo Cuerda': 'dinámica',
      'Fecha Fabricación': '01/12/2023',
    }, {
      Nombre: 'Ejemplo Anclaje Químico',
      Tipo: 'anclaje',
      Codigo: 'AQ001',
      Estado: 'disponible',
      Cantidad: 10,
      'Fecha Adquisición': '01/01/2024',
      'Fecha Última Revisión': '01/01/2024',
      'Próxima Revisión': '01/12/2024',
      Observaciones: 'Anclajes para vías nuevas',
      'Tipo Anclaje': 'químico',
    }, {
      Nombre: 'Ejemplo Mosquetón',
      Tipo: 'varios',
      Codigo: 'MQ001',
      Estado: 'disponible',
      Cantidad: 5,
      'Fecha Adquisición': '01/01/2024',
      'Fecha Última Revisión': '01/01/2024',
      'Próxima Revisión': '01/01/2025',
      Observaciones: 'Mosquetones de seguridad',
      Categoría: 'seguridad',
      Subcategoría: 'mosquetones',
      Descripción: 'Mosquetón con seguro de rosca',
    }];

    await this.exportToCSV(templateData, 'plantilla_importacion_materiales');
  }
}

export const materialExportService = new MaterialExportService();
