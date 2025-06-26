import React, { createContext, useContext, ReactNode } from 'react';

// Definición de la estructura de colores basada en la paleta
interface ThemeColors {
  cardBg: {
    light: string;
    dark: string;
  };
  border: {
    light: string;
    dark: string;
  };
  link: string;
  // Puedes añadir más propiedades según necesites
}

interface ThemeContextType {
  colors: ThemeColors;
}

// Utilizamos las variables CSS definidas en global.css
const defaultTheme: ThemeContextType = {
  colors: {
    cardBg: {
      light: 'var(--color-gray-50)',
      dark: 'var(--color-gray-800)'
    },
    border: {
      light: 'var(--color-gray-200)',
      dark: 'var(--color-gray-700)'
    },
    link: 'var(--color-brand-500)' // Morado principal
  }
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
