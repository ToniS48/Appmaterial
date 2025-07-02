/**
 * Lógica de negocio para configuración meteorológica
 * Separada completamente de UI y Firestore
 */

export interface WeatherConfig {
  weatherEnabled: boolean;
  aemetEnabled: boolean;
  aemetUseForSpain: boolean;
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'ms' | 'mph';
  precipitationUnit: 'mm' | 'inch';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WeatherRecommendation {
  provider: 'AEMET' | 'Open-Meteo';
  reason: string;
}

export class WeatherBusinessLogic {
  /**
   * Valida la configuración meteorológica completa
   */
  static validateConfiguration(config: WeatherConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Regla: AEMET requiere servicio meteorológico habilitado
    if (config.aemetEnabled && !config.weatherEnabled) {
      errors.push('AEMET requiere que el servicio meteorológico general esté habilitado');
    }

    // Regla: Servicio habilitado requiere unidades configuradas
    if (config.weatherEnabled) {
      if (!config.temperatureUnit) {
        errors.push('La unidad de temperatura es obligatoria cuando el servicio está habilitado');
      }
      if (!config.windSpeedUnit) {
        errors.push('La unidad de velocidad del viento es obligatoria');
      }
      if (!config.precipitationUnit) {
        errors.push('La unidad de precipitación es obligatoria');
      }
    }

    // Regla: Uso automático de AEMET sin habilitarlo
    if (config.aemetUseForSpain && !config.aemetEnabled) {
      warnings.push('El uso automático de AEMET requiere tener AEMET habilitado');
    }

    // Validar unidades válidas solo si el servicio está habilitado
    if (config.weatherEnabled) {
      // Validar temperatura - incluir valores legacy para migración
      const tempUnit = config.temperatureUnit as string;
      if (tempUnit && !['celsius', 'fahrenheit', 'C', '°C', 'F', '°F'].includes(tempUnit)) {
        errors.push('Unidad de temperatura no válida');
      }

      // Validar viento - incluir valores legacy para migración  
      const windUnit = config.windSpeedUnit as string;
      if (windUnit && !['kmh', 'ms', 'mph', 'km/h', 'kph', 'm/s'].includes(windUnit)) {
        errors.push('Unidad de velocidad del viento no válida');
      }

      // Validar precipitación - incluir valores legacy para migración
      const precipUnit = config.precipitationUnit as string;
      if (precipUnit && !['mm', 'inch', 'inches'].includes(precipUnit)) {
        errors.push('Unidad de precipitación no válida');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Determina si se debe mostrar las opciones de AEMET
   */
  static shouldShowAemetOptions(config: WeatherConfig): boolean {
    return config.weatherEnabled;
  }

  /**
   * Determina si se deben deshabilitar las unidades
   */
  static shouldDisableUnits(config: WeatherConfig): boolean {
    return !config.weatherEnabled;
  }

  /**
   * Recomienda el proveedor meteorológico para una ubicación
   */
  static getProviderRecommendation(
    location: { lat: number; lon: number },
    config: WeatherConfig
  ): WeatherRecommendation {
    if (!config.weatherEnabled) {
      return {
        provider: 'Open-Meteo',
        reason: 'Servicio meteorológico deshabilitado'
      };
    }

    if (config.aemetEnabled && config.aemetUseForSpain && this.isLocationInSpain(location)) {
      return {
        provider: 'AEMET',
        reason: 'Ubicación en España con AEMET habilitado y configurado para uso automático'
      };
    }

    return {
      provider: 'Open-Meteo',
      reason: 'Proveedor global por defecto'
    };
  }

  /**
   * Verifica si una ubicación está en España
   */
  static isLocationInSpain(location: { lat: number; lon: number }): boolean {
    const { lat, lon } = location;

    // España peninsular
    const spainBounds = {
      north: 43.9,
      south: 35.2,
      east: 4.5,
      west: -9.5
    };

    // Islas Baleares
    const balearicBounds = {
      north: 40.1,
      south: 38.6,
      east: 4.4,
      west: 1.1
    };

    // Islas Canarias
    const canaryBounds = {
      north: 29.5,
      south: 27.6,
      east: -13.4,
      west: -18.2
    };

    const inPeninsula = lat >= spainBounds.south && lat <= spainBounds.north &&
                       lon >= spainBounds.west && lon <= spainBounds.east;

    const inBaleares = lat >= balearicBounds.south && lat <= balearicBounds.north &&
                      lon >= balearicBounds.west && lon <= balearicBounds.east;

    const inCanarias = lat >= canaryBounds.south && lat <= canaryBounds.north &&
                      lon >= canaryBounds.west && lon <= canaryBounds.east;

    return inPeninsula || inBaleares || inCanarias;
  }

  /**
   * Aplica correcciones automáticas a la configuración
   */
  static applyAutoCorrections(config: WeatherConfig): WeatherConfig {
    const corrected = { ...config };

    // Si se deshabilita el servicio meteorológico, deshabilitar AEMET también
    if (!corrected.weatherEnabled) {
      corrected.aemetEnabled = false;
      corrected.aemetUseForSpain = false;
    }

    // Si se deshabilita AEMET, deshabilitar uso automático
    if (!corrected.aemetEnabled) {
      corrected.aemetUseForSpain = false;
    }

    // Normalizar valores legacy de unidades (usando casting para evitar errores de tipo)
    const tempUnit = corrected.temperatureUnit as string;
    if (tempUnit === 'C' || tempUnit === '°C') {
      corrected.temperatureUnit = 'celsius';
    } else if (tempUnit === 'F' || tempUnit === '°F') {
      corrected.temperatureUnit = 'fahrenheit';
    }

    const windUnit = corrected.windSpeedUnit as string;
    if (windUnit === 'km/h' || windUnit === 'kph') {
      corrected.windSpeedUnit = 'kmh';
    } else if (windUnit === 'm/s') {
      corrected.windSpeedUnit = 'ms';
    }

    const precipUnit = corrected.precipitationUnit as string;
    if (precipUnit === 'inches') {
      corrected.precipitationUnit = 'inch';
    }

    // Establecer valores por defecto si están vacíos y el servicio está habilitado
    if (corrected.weatherEnabled) {
      if (!corrected.temperatureUnit) {
        corrected.temperatureUnit = 'celsius';
      }
      if (!corrected.windSpeedUnit) {
        corrected.windSpeedUnit = 'kmh';
      }
      if (!corrected.precipitationUnit) {
        corrected.precipitationUnit = 'mm';
      }
    }

    return corrected;
  }

  /**
   * Obtiene las opciones disponibles para cada unidad
   */
  static getUnitOptions() {
    return {
      temperature: [
        { value: 'celsius', label: 'Celsius (°C)' },
        { value: 'fahrenheit', label: 'Fahrenheit (°F)' }
      ],
      windSpeed: [
        { value: 'kmh', label: 'km/h' },
        { value: 'ms', label: 'm/s' },
        { value: 'mph', label: 'mph' }
      ],
      precipitation: [
        { value: 'mm', label: 'Milímetros (mm)' },
        { value: 'inch', label: 'Pulgadas (inch)' }
      ]
    };
  }

  /**
   * Obtiene la etiqueta amigable para mostrar de una unidad
   */
  static getUnitLabel(unitType: 'temperature' | 'windSpeed' | 'precipitation', value: string): string {
    const options = this.getUnitOptions();
    
    switch (unitType) {
      case 'temperature':
        return options.temperature.find(opt => opt.value === value)?.label || value;
      case 'windSpeed':
        return options.windSpeed.find(opt => opt.value === value)?.label || value;
      case 'precipitation':
        return options.precipitation.find(opt => opt.value === value)?.label || value;
      default:
        return value;
    }
  }

  /**
   * Genera un resumen de la configuración para mostrar al usuario
   */
  static getConfigurationSummary(config: WeatherConfig): string {
    if (!config.weatherEnabled) {
      return 'Servicio meteorológico deshabilitado';
    }

    const parts = ['Servicio meteorológico habilitado'];
    
    if (config.aemetEnabled) {
      parts.push('AEMET habilitado para España');
      if (config.aemetUseForSpain) {
        parts.push('uso automático activado');
      }
    }

    // Usar etiquetas amigables en lugar de valores internos
    const tempLabel = this.getUnitLabel('temperature', config.temperatureUnit);
    const windLabel = this.getUnitLabel('windSpeed', config.windSpeedUnit);
    const precipLabel = this.getUnitLabel('precipitation', config.precipitationUnit);
    
    parts.push(`Unidades: ${tempLabel}, ${windLabel}, ${precipLabel}`);

    return parts.join(' • ');
  }
}
