// Ejemplo de uso de la integración meteorológica con Open-Meteo y AEMET
// Este archivo muestra cómo usar el servicio de clima en diferentes escenarios

import { weatherService } from '../services/weatherService';
import { Timestamp } from 'firebase/firestore';

/**
 * Ejemplo 1: Configuración básica del servicio
 */
async function ejemploConfiguracion() {
  // Configuración mínima solo con Open-Meteo
  await weatherService.configure({
    enabled: true,
    defaultLocation: {
      lat: 40.4168,
      lon: -3.7038,
      name: 'Madrid, España'
    },
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    precipitationUnit: 'mm',
    aemet: {
      enabled: false,
      apiKey: '',
      useForSpain: false
    }
  });

  console.log('✅ Configuración básica aplicada');
}

/**
 * Ejemplo 2: Configuración completa con AEMET
 */
async function ejemploConfiguracionCompleta() {
  // Configuración completa con AEMET para España
  await weatherService.configure({
    enabled: true,
    defaultLocation: {
      lat: 40.4168,
      lon: -3.7038,
      name: 'Madrid, España'
    },
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    precipitationUnit: 'mm',
    aemet: {
      enabled: true,
      apiKey: 'tu-api-key-de-aemet-aqui',
      useForSpain: true
    }
  });

  console.log('✅ Configuración completa con AEMET aplicada');
}

/**
 * Ejemplo 3: Obtener pronóstico para diferentes ubicaciones
 */
async function ejemploPronosticos() {
  // Ubicación en España - usará AEMET si está configurado
  const barcelonaWeather = await weatherService.getWeatherForecast('Barcelona, España', 5);
  console.log('🇪🇸 Pronóstico Barcelona (AEMET):', barcelonaWeather);

  // Ubicación fuera de España - usará Open-Meteo
  const parisWeather = await weatherService.getWeatherForecast('París, Francia', 5);
  console.log('🇫🇷 Pronóstico París (Open-Meteo):', parisWeather);

  // Sin especificar ubicación - usa ubicación por defecto
  const defaultWeather = await weatherService.getWeatherForecast(undefined, 3);
  console.log('📍 Pronóstico ubicación por defecto:', defaultWeather);
}

/**
 * Ejemplo 4: Obtener clima para actividades específicas
 */
async function ejemploActividadEspana() {
  // Actividad en España (2 días) - usará AEMET
  const fechaInicio = new Date('2025-06-25');
  const fechaFin = new Date('2025-06-26');
  
  const climaActividad = await weatherService.getWeatherForActivity(
    fechaInicio,
    fechaFin,
    'Montserrat, Barcelona'
  );

  console.log('🏔️ Clima para actividad en Montserrat:', climaActividad);
  // Resultado esperado:
  // [
  //   {
  //     date: '2025-06-25',
  //     temperature: { min: 15, max: 22 },
  //     description: 'Parcialmente nublado',
  //     icon: '03d',
  //     humidity: 65,
  //     windSpeed: 12,
  //     precipitation: 0,
  //     condition: 'clouds'
  //   },
  //   {
  //     date: '2025-06-26',
  //     temperature: { min: 16, max: 25 },
  //     description: 'Despejado',
  //     icon: '01d',
  //     humidity: 45,
  //     windSpeed: 8,
  //     precipitation: 0,
  //     condition: 'clear'
  //   }
  // ]
}

/**
 * Ejemplo 5: Actividad fuera de España
 */
async function ejemploActividadInternacional() {
  // Actividad en Francia - usará Open-Meteo
  const fechaActividad = Timestamp.fromDate(new Date('2025-07-15'));
  
  const climaFrancia = await weatherService.getWeatherForActivity(
    fechaActividad,
    undefined, // Sin fecha fin = actividad de un día
    'Chamonix, Francia'
  );

  console.log('🗻 Clima para actividad en Chamonix:', climaFrancia);
}

/**
 * Ejemplo 6: Manejo de errores y fallback
 */
async function ejemploFallback() {
  try {
    // Si AEMET falla, automáticamente usa Open-Meteo
    const clima = await weatherService.getWeatherForecast('Sevilla, España', 3);
    
    if (clima) {
      console.log('✅ Datos obtenidos (fuente automática):', clima.daily.length, 'días');
    } else {
      console.log('❌ No se pudieron obtener datos meteorológicos');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Ejemplo 7: Verificar configuración y estado
 */
async function ejemploEstado() {
  // Verificar si el servicio está habilitado
  const habilitado = weatherService.isEnabled();
  console.log('🔧 Servicio habilitado:', habilitado);

  // Obtener configuración actual
  const config = await weatherService.getConfig();
  console.log('⚙️ Configuración actual:', {
    habilitado: config.enabled,
    ubicacionPorDefecto: config.defaultLocation.name,
    aemetHabilitado: config.aemet.enabled,
    aemetParaEspana: config.aemet.useForSpain
  });
}

/**
 * Función principal para ejecutar todos los ejemplos
 */
export async function ejecutarEjemplos() {
  console.log('🌤️ Iniciando ejemplos de integración meteorológica\n');

  try {
    // Configurar servicio
    await ejemploConfiguracionCompleta();
    
    // Obtener pronósticos
    await ejemploPronosticos();
    
    // Actividades específicas
    await ejemploActividadEspana();
    await ejemploActividadInternacional();
    
    // Estado del servicio
    await ejemploEstado();
    
    // Manejo de errores
    await ejemploFallback();

    console.log('\n✅ Todos los ejemplos ejecutados correctamente');
  } catch (error) {
    console.error('\n❌ Error en ejemplos:', error);
  }
}

export default {
  ejemploConfiguracion,
  ejemploConfiguracionCompleta,
  ejemploPronosticos,
  ejemploActividadEspana,
  ejemploActividadInternacional,
  ejemploFallback,
  ejemploEstado,
  ejecutarEjemplos
};
