import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import app from '../config/firebase';

// Inicializar Storage
const storage = getStorage(app);

// Tipos para el servicio
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface UploadResult {
  url: string;
  filename: string;
  fullPath: string;
  size: number;
  contentType: string;
}

class FileUploadService {
  
  // Subir archivo con progreso
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validar archivo
      this.validateFile(file);
      
      // Generar nombre único
      const filename = this.generateUniqueFilename(file.name);
      const fullPath = `${path}/${filename}`;
      
      // Crear referencia
      const storageRef = ref(storage, fullPath);
      
      // Subir archivo con progreso
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            if (onProgress) {
              const progress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              };
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Error uploading file:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const result: UploadResult = {
                url: downloadURL,
                filename: filename,
                fullPath: fullPath,
                size: file.size,
                contentType: file.type
              };
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }
  
  // Subir archivo simple (sin progreso)
  async uploadFileSimple(file: File, path: string): Promise<UploadResult> {
    try {
      this.validateFile(file);
      
      const filename = this.generateUniqueFilename(file.name);
      const fullPath = `${path}/${filename}`;
      const storageRef = ref(storage, fullPath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        filename: filename,
        fullPath: fullPath,
        size: file.size,
        contentType: file.type
      };
    } catch (error) {
      console.error('Error in uploadFileSimple:', error);
      throw error;
    }
  }
  
  // Subir múltiples archivos
  async uploadMultipleFiles(
    files: File[],
    path: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map((file, index) => 
        this.uploadFile(
          file, 
          path, 
          onProgress ? (progress) => onProgress(index, progress) : undefined
        )
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }
  
  // Eliminar archivo
  async deleteFile(fullPath: string): Promise<void> {
    try {
      const storageRef = ref(storage, fullPath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
  
  // Validar archivo
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 10MB.');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido.');
    }
  }
  
  // Generar nombre único para archivo
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const nameWithoutExtension = originalName.split('.').slice(0, -1).join('.');
    
    return `${nameWithoutExtension}_${timestamp}_${randomString}.${extension}`;
  }
  
  // Obtener URL de descarga
  async getDownloadURL(fullPath: string): Promise<string> {
    try {
      const storageRef = ref(storage, fullPath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }
  
  // Métodos específicos para mensajería
  async uploadMessageAttachment(
    file: File,
    conversacionId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const path = `mensajes/${conversacionId}/adjuntos`;
    return this.uploadFile(file, path, onProgress);
  }
  
  async uploadMessageImage(
    file: File,
    conversacionId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const path = `mensajes/${conversacionId}/imagenes`;
    return this.uploadFile(file, path, onProgress);
  }
  
  // Validar si es imagen
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }
  
  // Obtener información del archivo
  getFileInfo(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      isImage: this.isImageFile(file),
      sizeFormatted: this.formatFileSize(file.size)
    };
  }
  
  // Formatear tamaño de archivo
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Exportar instancia singleton
export const fileUploadService = new FileUploadService();
export default fileUploadService;
