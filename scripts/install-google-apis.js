/**
 * Script para instalar dependencias de Google APIs
 * Instala y configura las librerías necesarias para la integración
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Instalando dependencias de Google APIs...\n');

// Lista de dependencias necesarias
const dependencies = [
  '@google-cloud/firestore',
  '@google-cloud/storage', 
  '@types/google.maps',
  'crypto-js',
];

const devDependencies = [
  '@types/crypto-js'
];

try {
  // Instalar dependencias principales
  console.log('📦 Instalando dependencias principales...');
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
  
  // Instalar dependencias de desarrollo
  console.log('🔧 Instalando dependencias de desarrollo...');
  execSync(`npm install --save-dev ${devDependencies.join(' ')}`, { stdio: 'inherit' });
  
  // Leer package.json actual
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Añadir scripts específicos para Google APIs si no existen
  const scriptsToAdd = {
    'apis:check': 'node scripts/check-google-apis.js',
    'apis:configure': 'node scripts/configure-google-apis.js',
    'apis:test': 'node scripts/test-google-apis.js'
  };
  
  let scriptsAdded = false;
  for (const [scriptName, scriptCommand] of Object.entries(scriptsToAdd)) {
    if (!packageJson.scripts[scriptName]) {
      packageJson.scripts[scriptName] = scriptCommand;
      scriptsAdded = true;
      console.log(`✅ Script añadido: ${scriptName}`);
    }
  }
  
  // Guardar package.json si se añadieron scripts
  if (scriptsAdded) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('📄 package.json actualizado con nuevos scripts');
  }
  
  // Crear archivo de tipos para Google APIs si no existe
  const typesDir = path.join(process.cwd(), 'src', 'types');
  const googleApiTypesFile = path.join(typesDir, 'google-apis.d.ts');
  
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  if (!fs.existsSync(googleApiTypesFile)) {
    const typesContent = `
/**
 * Tipos para Google APIs
 */

declare global {
  interface Window {
    google?: {
      maps: {
        Map: any;
        Marker: any;
        InfoWindow: any;
        LatLng: any;
        event: any;
        places: any;
        geometry: any;
      };
    };
    gapi?: {
      load: (libraries: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
        calendar: {
          events: {
            insert: (params: any) => { execute: () => Promise<any> };
          };
        };
      };
      auth2: {
        getAuthInstance: () => any;
      };
    };
  }
}

export interface GoogleMapsOptions {
  zoom?: number;
  center?: { lat: number; lng: number };
  mapTypeId?: string;
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  streetViewControl?: boolean;
  rotateControl?: boolean;
  fullscreenControl?: boolean;
}

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
}

export {};
`;
    
    fs.writeFileSync(googleApiTypesFile, typesContent.trim());
    console.log('📝 Archivo de tipos creado: src/types/google-apis.d.ts');
  }
  
  // Crear archivo de configuración de ejemplo
  const exampleConfigPath = path.join(process.cwd(), 'src', 'config', 'google-apis.example.ts');
  const configDir = path.dirname(exampleConfigPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  if (!fs.existsSync(exampleConfigPath)) {
    const exampleConfig = `
/**
 * Configuración de ejemplo para Google APIs
 * Copia este archivo como google-apis.ts y configura tus API keys
 */

export const GOOGLE_APIS_CONFIG = {
  // APIs Geográficas
  MAPS_JAVASCRIPT_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  MAPS_EMBED_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY || '',
  GEOCODING_API_KEY: process.env.REACT_APP_GOOGLE_GEOCODING_API_KEY || '',
  
  // APIs de Productividad
  DRIVE_API_KEY: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || '',
  CALENDAR_API_KEY: process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY || '',
  
  // APIs de Comunicación
  GMAIL_API_KEY: process.env.REACT_APP_GOOGLE_GMAIL_API_KEY || '',
  CHAT_API_KEY: process.env.REACT_APP_GOOGLE_CHAT_API_KEY || '',
  CLOUD_MESSAGING_API_KEY: process.env.REACT_APP_GOOGLE_FCM_API_KEY || '',
  
  // Configuraciones por defecto
  DEFAULT_MAP_CENTER: {
    lat: 40.4168, // Madrid
    lng: -3.7038
  },
  DEFAULT_MAP_ZOOM: 10,
};

export default GOOGLE_APIS_CONFIG;
`;
    
    fs.writeFileSync(exampleConfigPath, exampleConfig.trim());
    console.log('⚙️  Archivo de configuración de ejemplo creado: src/config/google-apis.example.ts');
  }
  
  // Crear script de verificación
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const checkScriptPath = path.join(scriptsDir, 'check-google-apis.js');
  
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  if (!fs.existsSync(checkScriptPath)) {
    const checkScript = `
/**
 * Script para verificar la configuración de Google APIs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de Google APIs...\\n');

// Verificar dependencias
const packageJson = require('../package.json');
const requiredDeps = [
  '@google-cloud/firestore',
  '@types/google.maps',
  'crypto-js'
];

console.log('📦 Verificando dependencias:');
requiredDeps.forEach(dep => {
  const installed = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  console.log(\`  \${installed ? '✅' : '❌'} \${dep} \${installed ? \`(\${installed})\` : '(no instalada)'}\`);
});

console.log('\\n📁 Verificando archivos:');
const requiredFiles = [
  'src/types/google-apis.d.ts',
  'src/config/google-apis.example.ts',
  'src/hooks/useGoogleApis.ts',
  'src/services/googleApisService.ts',
  'src/contexts/GoogleApisContext.tsx'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(\`  \${exists ? '✅' : '❌'} \${file}\`);
});

console.log('\\n🔑 Variables de entorno disponibles:');
const envVars = [
  'REACT_APP_GOOGLE_MAPS_API_KEY',
  'REACT_APP_GOOGLE_CALENDAR_API_KEY',
  'REACT_APP_GOOGLE_DRIVE_API_KEY',
  'REACT_APP_API_ENCRYPT_KEY'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(\`  \${value ? '✅' : '❌'} \${envVar} \${value ? '(configurada)' : '(no configurada)'}\`);
});

console.log('\\n✨ Verificación completada');
`;
    
    fs.writeFileSync(checkScriptPath, checkScript.trim());
    console.log('🔍 Script de verificación creado: scripts/check-google-apis.js');
  }
  
  console.log('\n✅ Instalación completada exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Configura tus API keys en Configuración → APIs');
  console.log('2. Ejecuta "npm run apis:check" para verificar la configuración');
  console.log('3. Usa el componente GoogleMapComponent en tus páginas');
  console.log('4. Utiliza el hook useGoogleApis para acceder a las APIs');
  
} catch (error) {
  console.error('❌ Error durante la instalación:', error);
  process.exit(1);
}
