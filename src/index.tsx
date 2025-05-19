import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ColorModeScript } from '@chakra-ui/react';
import theme from './styles/theme';

// Verificar estado de autenticación almacenado para depuración
if (process.env.NODE_ENV !== 'production') {
  console.log('---- Diagnóstico de autenticación ----');
  // Buscar el token en localStorage de forma más robusta
  const tokenKey = Object.keys(localStorage).find(key => key.startsWith('firebase:authUser:'));
  
  if (tokenKey) {
    console.log('Token almacenado: Presente');
    console.log('Clave del token:', tokenKey);
    try {
      // Intentar extraer email para diagnóstico
      const tokenData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
      console.log('Email asociado:', tokenData.email || 'No disponible');
    } catch (e) {
      console.log('No se pudo leer el contenido del token');
    }
  } else {
    console.log('Token almacenado: No encontrado');
  }
  
  console.log('Verificando persistencia...');
}

// Hacer más selectiva la limpieza de caché
if (process.env.NODE_ENV !== 'production') {
  // Solo limpiar caché si existe un parámetro en la URL
  if (window.location.search.includes('clear_cache=true')) {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('espemo-app')) {
            caches.delete(cacheName);
            console.log(`Cache ${cacheName} eliminado`);
          }
        });
      });
    }
    
    // Preservar más valores importantes - incluir claves de Firebase Auth
    const itemsToPreserve: Record<string, string> = {};
    
    // Guardar explícitamente claves de Firebase Auth
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('firebase:') || 
          key === 'auth_token' || 
          key === 'auth_user' || 
          key === 'user_preferences' || 
          key === 'theme_preference') {
        const value = localStorage.getItem(key);
        if (value) itemsToPreserve[key] = value;
      }
    });
    
    // Limpiar y restaurar
    localStorage.clear();
    Object.entries(itemsToPreserve).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('Storage limpiado selectivamente, preservando tokens de autenticación');
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();
