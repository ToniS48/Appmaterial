/**
 * Mock temporal de GoogleBaseService
 * Este archivo reemplaza temporalmente la implementación real de Google APIs
 * hasta que se implemente la solución backend con Firebase Functions
 */

export interface GoogleAuthConfig {
  serviceAccountPath: string;
  scopes: string[];
}

export interface GoogleApiAuth {
  isAuthenticated: boolean;
  error?: string;
}

export class GoogleBaseService {
  protected auth: GoogleApiAuth = {
    isAuthenticated: false,
    error: 'Google APIs temporalmente deshabilitadas - implementación backend pendiente'
  };

  constructor(config: GoogleAuthConfig) {
    console.warn('GoogleBaseService: Usando mock temporal. Las APIs de Google están deshabilitadas.');
  }

  async initialize(): Promise<boolean> {
    console.warn('GoogleBaseService: Inicialización mock - APIs deshabilitadas');
    return false;
  }

  async checkAuth(): Promise<GoogleApiAuth> {
    return this.auth;
  }

  isAuthenticated(): boolean {
    return false;
  }

  getAuthError(): string | undefined {
    return this.auth.error;
  }
}
