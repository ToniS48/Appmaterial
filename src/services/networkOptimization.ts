/**
 * Servicio para detectar y optimizar el rendimiento según la velocidad de conexión
 * Especialmente optimizado para conexiones 4G lentas
 */

export interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

export interface PerformanceConfig {
  // Configuración de cache según velocidad de conexión
  cacheMultiplier: number;
  
  // Configuración de lazy loading
  eagerLoadTabs: boolean;
  preloadNext: boolean;
  
  // Configuración de datos
  batchSize: number;
  debounceTime: number;
  
  // Configuración de imágenes/gráficos
  reduceQuality: boolean;
  enableCompression: boolean;
}

class NetworkOptimizationService {
  private currentConfig: PerformanceConfig;
  private networkInfo: NetworkInfo | null = null;
  private listeners: ((config: PerformanceConfig) => void)[] = [];

  constructor() {
    this.currentConfig = this.getDefaultConfig();
    this.detectNetworkInfo();
    this.setupNetworkMonitoring();
  }

  /**
   * Detecta información de la red actual
   */
  private detectNetworkInfo(): void {
    // Usar Network Information API si está disponible
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.networkInfo = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
      
      console.log('🌐 [NetworkOptimization] Network detected:', this.networkInfo);
      this.updateConfiguration();
    } else {
      // Fallback: estimar velocidad basada en tiempos de carga
      this.estimateNetworkSpeed();
    }
  }

  /**
   * Estima la velocidad de red midiendo tiempo de respuesta
   */
  private async estimateNetworkSpeed(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Hacer una pequeña petición para medir latencia
      await fetch('/manifest.json', { 
        method: 'HEAD',
        cache: 'no-cache' 
      });
      
      const rtt = Date.now() - startTime;
      
      // Estimar tipo de conexión basado en RTT
      let effectiveType: NetworkInfo['effectiveType'] = 'unknown';
      if (rtt < 50) effectiveType = '4g';
      else if (rtt < 150) effectiveType = '3g';
      else if (rtt < 300) effectiveType = 'slow-2g';
      else effectiveType = '2g';

      this.networkInfo = {
        effectiveType,
        downlink: rtt < 100 ? 10 : rtt < 200 ? 1.5 : 0.5,
        rtt,
        saveData: false
      };

      console.log('🌐 [NetworkOptimization] Network estimated:', this.networkInfo);
      this.updateConfiguration();
    } catch (error) {
      console.warn('Could not estimate network speed:', error);
      this.networkInfo = {
        effectiveType: 'unknown',
        downlink: 1,
        rtt: 100,
        saveData: false
      };
      this.updateConfiguration();
    }
  }

  /**
   * Configura el monitoreo de cambios de red
   */
  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        console.log('🌐 [NetworkOptimization] Network changed');
        this.detectNetworkInfo();
      });
    }

    // Monitor manual cada 30 segundos
    setInterval(() => {
      this.estimateNetworkSpeed();
    }, 30000);
  }

  /**
   * Actualiza la configuración según la red detectada
   */
  private updateConfiguration(): void {
    if (!this.networkInfo) return;

    const { effectiveType, saveData, rtt } = this.networkInfo;
    
    this.currentConfig = {
      ...this.getDefaultConfig(),
      ...this.getConfigForNetwork(effectiveType, saveData, rtt)
    };

    console.log('⚙️ [NetworkOptimization] Config updated:', this.currentConfig);
    
    // Notificar a los listeners
    this.listeners.forEach(listener => listener(this.currentConfig));
  }

  /**
   * Configuración por defecto (para conexiones rápidas)
   */
  private getDefaultConfig(): PerformanceConfig {
    return {
      cacheMultiplier: 1,
      eagerLoadTabs: true,
      preloadNext: true,
      batchSize: 50,
      debounceTime: 300,
      reduceQuality: false,
      enableCompression: false
    };
  }

  /**
   * Configuración específica según tipo de red
   */
  private getConfigForNetwork(
    effectiveType: NetworkInfo['effectiveType'], 
    saveData: boolean,
    rtt: number
  ): Partial<PerformanceConfig> {
    // Configuración agresiva para ahorrar datos
    if (saveData) {
      return {
        cacheMultiplier: 3,
        eagerLoadTabs: false,
        preloadNext: false,
        batchSize: 10,
        debounceTime: 800,
        reduceQuality: true,
        enableCompression: true
      };
    }

    // Configuración según tipo de conexión
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return {
          cacheMultiplier: 4,
          eagerLoadTabs: false,
          preloadNext: false,
          batchSize: 5,
          debounceTime: 1000,
          reduceQuality: true,
          enableCompression: true
        };

      case '3g':
        return {
          cacheMultiplier: 2,
          eagerLoadTabs: false,
          preloadNext: false,
          batchSize: 20,
          debounceTime: 600,
          reduceQuality: true,
          enableCompression: true
        };

      case '4g':
        // Para 4G, optimizar según latencia
        if (rtt > 200) {
          // 4G lento
          return {
            cacheMultiplier: 2,
            eagerLoadTabs: false,
            preloadNext: true,
            batchSize: 30,
            debounceTime: 400,
            reduceQuality: false,
            enableCompression: true
          };
        } else {
          // 4G normal/rápido
          return {
            cacheMultiplier: 1.5,
            eagerLoadTabs: true,
            preloadNext: true,
            batchSize: 40,
            debounceTime: 300,
            reduceQuality: false,
            enableCompression: false
          };
        }

      default:
        return this.getDefaultConfig();
    }
  }
  /**
   * Obtiene la configuración actual
   */
  getConfig(): PerformanceConfig {
    return { ...this.currentConfig };
  }

  /**
   * Calcula el tiempo de cache recomendado para un tipo de dato
   */
  getCacheTimeout(baseTimeout: number): number {
    return Math.round(baseTimeout * this.currentConfig.cacheMultiplier);
  }

  /**
   * Determina si se debe precargar contenido
   */
  shouldPreload(): boolean {
    return this.currentConfig.preloadNext;
  }

  /**
   * Determina si se debe cargar contenido inmediatamente
   */
  shouldEagerLoad(): boolean {
    return this.currentConfig.eagerLoadTabs;
  }

  /**
   * Obtiene el tamaño de lote recomendado para consultas
   */
  getBatchSize(): number {
    return this.currentConfig.batchSize;
  }

  /**
   * Obtiene el tiempo de debounce recomendado
   */
  getDebounceTime(): number {
    return this.currentConfig.debounceTime;
  }
  /**
   * Obtiene la configuración actual de rendimiento
   */
  getCurrentConfig(): PerformanceConfig {
    return { ...this.currentConfig };
  }

  /**
   * Obtiene información actual de la red
   */
  getNetworkInfo(): NetworkInfo | null {
    return this.networkInfo ? { ...this.networkInfo } : null;
  }

  /**
   * Suscribe un listener a cambios de configuración
   */
  subscribe(listener: (config: PerformanceConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Retornar función de cleanup
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifica a todos los listeners sobre cambios de configuración
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentConfig);
      } catch (error) {
        console.error('Error notifying network config listener:', error);
      }
    });
  }

  /**
   * Indica si la conexión es lenta y requiere optimizaciones especiales
   */
  isSlowConnection(): boolean {
    if (!this.networkInfo) return false;
    
    const { effectiveType, rtt, saveData } = this.networkInfo;
    return saveData || 
           effectiveType === '2g' || 
           effectiveType === 'slow-2g' || 
           effectiveType === '3g' ||
           rtt > 300;
  }

  /**
   * Obtiene un mensaje descriptivo del estado de la conexión
   */
  getConnectionDescription(): string {
    if (!this.networkInfo) return 'Velocidad desconocida';
    
    const { effectiveType, rtt, saveData } = this.networkInfo;
    
    if (saveData) return 'Modo ahorro de datos activado';
    
    switch (effectiveType) {
      case 'slow-2g':
        return 'Conexión muy lenta (2G)';
      case '2g':
        return 'Conexión lenta (2G)';
      case '3g':
        return 'Conexión moderada (3G)';
      case '4g':
        if (rtt > 200) return 'Conexión 4G lenta';
        return 'Conexión 4G';
      default:
        return `Conexión estable (${rtt}ms)`;
    }
  }
}

// Instancia singleton
export const networkOptimization = new NetworkOptimizationService();
