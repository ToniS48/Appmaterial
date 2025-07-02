/**
 * Mock temporal de GoogleDriveService
 * Este archivo reemplaza temporalmente la implementación real de Google Drive API
 * hasta que se implemente la solución backend con Firebase Functions
 */

import { GoogleBaseService, GoogleAuthConfig } from './GoogleBaseService.mock';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
}

export class GoogleDriveService extends GoogleBaseService {
  constructor(config: GoogleAuthConfig) {
    super(config);
    console.warn('GoogleDriveService: Usando mock temporal. Drive API deshabilitada.');
  }

  async listFiles(query?: string, pageSize: number = 10): Promise<DriveFile[]> {
    console.warn('GoogleDriveService: listFiles() - mock temporal, retornando array vacío');
    return [];
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder | null> {
    console.warn('GoogleDriveService: createFolder() - mock temporal, retornando null');
    return null;
  }

  async uploadFile(name: string, content: string | Buffer, mimeType: string, parentId?: string): Promise<DriveFile | null> {
    console.warn('GoogleDriveService: uploadFile() - mock temporal, retornando null');
    return null;
  }

  async downloadFile(fileId: string): Promise<Buffer | null> {
    console.warn('GoogleDriveService: downloadFile() - mock temporal, retornando null');
    return null;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    console.warn('GoogleDriveService: deleteFile() - mock temporal, retornando false');
    return false;
  }

  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<boolean> {
    console.warn('GoogleDriveService: shareFile() - mock temporal, retornando false');
    return false;
  }
}
