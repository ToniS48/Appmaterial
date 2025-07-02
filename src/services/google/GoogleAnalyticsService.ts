/**
 * Google Analytics API Service
 * Servicio para integrar con Google Analytics API
 */

import { obtenerConfiguracionGoogleApis } from '../configuracionService';

export interface AnalyticsEvent {
  eventName: string;
  eventParams?: { [key: string]: any };
}

export interface AnalyticsPageView {
  pageTitle: string;
  pagePath: string;
  pageLocation?: string;
}

export interface AnalyticsMetrics {
  sessions: number;
  pageViews: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export class GoogleAnalyticsService {
  private static instance: GoogleAnalyticsService;
  private apiKey: string = '';
  private propertyId: string = '';
  private enabled: boolean = false;

  private constructor() {
    this.initializeConfig();
  }

  public static getInstance(): GoogleAnalyticsService {
    if (!GoogleAnalyticsService.instance) {
      GoogleAnalyticsService.instance = new GoogleAnalyticsService();
    }
    return GoogleAnalyticsService.instance;
  }

  private async initializeConfig(): Promise<void> {
    try {
      const config = await obtenerConfiguracionGoogleApis();
      this.apiKey = config.analyticsApiKey || '';
      this.enabled = config.analyticsEnabled || false;
      
      // Property ID se puede obtener de variables de entorno o configuración
      this.propertyId = process.env.REACT_APP_GA_PROPERTY_ID || '';
    } catch (error) {
      console.error('Error inicializando Google Analytics:', error);
      this.enabled = false;
    }
  }

  /**
   * Inicializar Google Analytics con gtag
   */
  public async initialize(): Promise<void> {
    if (!this.enabled || !this.propertyId) {
      console.warn('Google Analytics no está habilitado o configurado');
      return;
    }

    try {
      // Cargar gtag si no está cargado
      if (typeof window.gtag === 'undefined') {
        await this.loadGtagScript();
      }

      // Configurar Google Analytics
      window.gtag('config', this.propertyId, {
        page_title: document.title,
        page_location: window.location.href
      });

      console.log('Google Analytics inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando Google Analytics:', error);
    }
  }

  /**
   * Cargar el script de gtag
   */
  private async loadGtagScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.propertyId}`;
      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Enviar evento personalizado
   */
  public trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled || typeof window.gtag === 'undefined') {
      console.warn('Google Analytics no está disponible');
      return;
    }

    try {
      window.gtag('event', event.eventName, event.eventParams || {});
      console.log('Evento enviado a Analytics:', event.eventName);
    } catch (error) {
      console.error('Error enviando evento a Analytics:', error);
    }
  }

  /**
   * Enviar vista de página
   */
  public trackPageView(pageView: AnalyticsPageView): void {
    if (!this.enabled || typeof window.gtag === 'undefined') {
      console.warn('Google Analytics no está disponible');
      return;
    }

    try {
      window.gtag('config', this.propertyId, {
        page_title: pageView.pageTitle,
        page_location: pageView.pageLocation || window.location.href,
        page_path: pageView.pagePath
      });
      console.log('Vista de página enviada a Analytics:', pageView.pagePath);
    } catch (error) {
      console.error('Error enviando vista de página a Analytics:', error);
    }
  }

  /**
   * Obtener métricas básicas (requiere API key válida)
   */
  public async getBasicMetrics(startDate: string, endDate: string): Promise<AnalyticsMetrics | null> {
    if (!this.enabled || !this.apiKey) {
      console.warn('Google Analytics API no está configurada');
      return null;
    }

    try {
      // Placeholder para implementación futura de reporting API
      console.log('Obteniendo métricas para:', { startDate, endDate });
      
      // Por ahora, devolver datos mock
      return {
        sessions: 100,
        pageViews: 500,
        users: 80,
        bounceRate: 0.45,
        avgSessionDuration: 120
      };
    } catch (error) {
      console.error('Error obteniendo métricas de Analytics:', error);
      return null;
    }
  }

  /**
   * Verificar estado de configuración
   */
  public getStatus(): { enabled: boolean; configured: boolean; error?: string } {
    return {
      enabled: this.enabled,
      configured: Boolean(this.propertyId && (this.apiKey || typeof window.gtag !== 'undefined')),
      error: !this.enabled ? 'Google Analytics no está habilitado' : undefined
    };
  }
}

// Tipos para gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export default GoogleAnalyticsService;
