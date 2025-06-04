// Declaraciones de tipos globales para el proyecto

// Declarar variables de entorno
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_FIREBASE_API_KEY: string;
    REACT_APP_FIREBASE_AUTH_DOMAIN: string;
    REACT_APP_FIREBASE_PROJECT_ID: string;
    REACT_APP_FIREBASE_STORAGE_BUCKET: string;
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: string;
    REACT_APP_FIREBASE_APP_ID: string;
  }
}

// Declarar tipos que podrían estar faltando
declare module 'react-toastify' {
  export function toast(message: string): void;
  export namespace toast {
    function success(message: string): void;
    function error(message: string): void;
    function warning(message: string): void;
    function info(message: string): void;
  }
}

// Declarar tipos para bibliotecas que podrían no tener tipos
declare module 'lodash' {
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: any
  ): T;
}
