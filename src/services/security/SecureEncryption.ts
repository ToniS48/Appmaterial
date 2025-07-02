/**
 * SERVICIO DE ENCRIPTACIÓN SEGURO
 * 
 * Sistema de encriptación mejorado que no depende de claves expuestas en el frontend.
 * Usa derivación de claves basada en datos del usuario autenticado y información de sesión.
 */

import CryptoJS from 'crypto-js';
import { User } from 'firebase/auth';

interface EncryptionMetadata {
  iv: string;
  salt: string;
  timestamp: number;
  version: string;
  userHash: string;
}

interface EncryptedData {
  data: string;
  metadata: EncryptionMetadata;
  integrity: string;
}

/**
 * Clase para manejo seguro de encriptación de API keys
 */
export class SecureEncryption {
  private static readonly ENCRYPTION_VERSION = process.env.REACT_APP_ENCRYPTION_VERSION || 'v2025';
  private static readonly ALGORITHM = process.env.REACT_APP_CRYPTO_ALGORITHM || 'AES-256-GCM';
  
  /**
   * Deriva una clave de encriptación única basada en el usuario y contexto
   */
  private static async deriveKey(user: User, salt: string, context: string = 'api_keys'): Promise<string> {
    // Crear datos únicos del usuario (no sensibles)
    const userData = {
      uid: user.uid,
      email: user.email,
      creationTime: user.metadata.creationTime,
      context: context,
      version: this.ENCRYPTION_VERSION
    };
    
    // Generar hash base del usuario
    const userDataString = JSON.stringify(userData);
    const userHash = CryptoJS.SHA256(userDataString).toString();
    
    // Combinar con salt para derivación de clave
    const keyMaterial = `${userHash}:${salt}:${context}:${this.ENCRYPTION_VERSION}`;
    
    // Derivar clave usando PBKDF2
    const derivedKey = CryptoJS.PBKDF2(keyMaterial, salt, {
      keySize: 256/32, // 256 bits
      iterations: 10000,
      hasher: CryptoJS.algo.SHA256
    });
    
    return derivedKey.toString();
  }
  
  /**
   * Genera un hash único del usuario para metadatos
   */
  private static generateUserHash(user: User): string {
    const userData = {
      uid: user.uid,
      email: user.email,
      creationTime: user.metadata.creationTime
    };
    
    return CryptoJS.SHA256(JSON.stringify(userData)).toString().substring(0, 16);
  }
  
  /**
   * Encripta una API key de forma segura
   */
  static async encryptApiKey(apiKey: string, user: User, context: string = 'aemet'): Promise<string> {
    try {
      // Generar salt único
      const salt = CryptoJS.lib.WordArray.random(128/8).toString();
      
      // Generar IV único
      const iv = CryptoJS.lib.WordArray.random(128/8).toString();
      
      // Derivar clave de encriptación
      const encryptionKey = await this.deriveKey(user, salt, context);
      
      // Encriptar los datos
      const encrypted = CryptoJS.AES.encrypt(apiKey, encryptionKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Crear metadatos
      const metadata: EncryptionMetadata = {
        iv,
        salt,
        timestamp: Date.now(),
        version: this.ENCRYPTION_VERSION,
        userHash: this.generateUserHash(user)
      };
      
      // Crear datos encriptados
      const encryptedData: EncryptedData = {
        data: encrypted.toString(),
        metadata,
        integrity: '' // Se calculará después
      };
      
      // Calcular hash de integridad
      const dataString = JSON.stringify({
        data: encryptedData.data,
        metadata: encryptedData.metadata
      });
      encryptedData.integrity = CryptoJS.SHA256(dataString).toString().substring(0, 32);
      
      // Retornar como string JSON
      return JSON.stringify(encryptedData);
    } catch (error) {
      console.error('Error encriptando API key:', error);
      throw new Error('Error en encriptación de API key');
    }
  }
  
  /**
   * Desencripta una API key de forma segura
   */
  static async decryptApiKey(encryptedString: string, user: User, context: string = 'aemet'): Promise<string> {
    try {
      // Parsear datos encriptados
      const encryptedData: EncryptedData = JSON.parse(encryptedString);
      
      // Verificar versión
      if (encryptedData.metadata.version !== this.ENCRYPTION_VERSION) {
        throw new Error(`Versión de encriptación no compatible: ${encryptedData.metadata.version}`);
      }
      
      // Verificar que es del mismo usuario
      const currentUserHash = this.generateUserHash(user);
      if (encryptedData.metadata.userHash !== currentUserHash) {
        throw new Error('La API key no pertenece al usuario actual');
      }
      
      // Verificar integridad
      const dataString = JSON.stringify({
        data: encryptedData.data,
        metadata: encryptedData.metadata
      });
      const expectedIntegrity = CryptoJS.SHA256(dataString).toString().substring(0, 32);
      
      if (encryptedData.integrity !== expectedIntegrity) {
        throw new Error('Error de integridad en datos encriptados');
      }
      
      // Derivar la misma clave de encriptación
      const encryptionKey = await this.deriveKey(
        user, 
        encryptedData.metadata.salt, 
        context
      );
      
      // Desencriptar
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, encryptionKey, {
        iv: CryptoJS.enc.Hex.parse(encryptedData.metadata.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Error desencriptando: resultado vacío');
      }
      
      return decryptedString;
    } catch (error) {
      console.error('Error desencriptando API key:', error);
      throw new Error('Error en desencriptación de API key');
    }
  }
  
  /**
   * Valida si una API key encriptada es válida y puede ser desencriptada
   */
  static async validateEncryptedApiKey(encryptedString: string, user: User): Promise<boolean> {
    try {
      await this.decryptApiKey(encryptedString, user);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Reencripta una API key (útil para rotación de claves)
   */
  static async reencryptApiKey(
    oldEncryptedString: string, 
    user: User, 
    context: string = 'aemet'
  ): Promise<string> {
    try {
      // Desencriptar con la clave antigua
      const decryptedKey = await this.decryptApiKey(oldEncryptedString, user, context);
      
      // Encriptar de nuevo con nueva sal y IV
      return await this.encryptApiKey(decryptedKey, user, context);
    } catch (error) {
      console.error('Error reencriptando API key:', error);
      throw new Error('Error en reencriptación de API key');
    }
  }
  
  /**
   * Obtiene información sobre una API key encriptada sin desencriptarla
   */
  static getEncryptionInfo(encryptedString: string): Partial<EncryptionMetadata> | null {
    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedString);
      return {
        timestamp: encryptedData.metadata.timestamp,
        version: encryptedData.metadata.version,
        userHash: encryptedData.metadata.userHash
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Verifica si una API key encriptada necesita ser actualizada
   */
  static needsUpdate(encryptedString: string): boolean {
    const info = this.getEncryptionInfo(encryptedString);
    if (!info) return true;
    
    // Verificar versión
    if (info.version !== this.ENCRYPTION_VERSION) return true;
    
    // Verificar edad (reencriptar después de 30 días)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (info.timestamp && info.timestamp < thirtyDaysAgo) return true;
    
    return false;
  }
}

export default SecureEncryption;
