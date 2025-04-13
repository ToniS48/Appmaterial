import { extendTheme, ThemeConfig } from "@chakra-ui/react";

// Configuración global del tema
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: true,
};

// Función para crear variantes con transparencia
const withAlpha = (color: string, alphas: Record<string, number>) => {
  const result: Record<string, string> = {};
  Object.entries(alphas).forEach(([key, value]) => {
    result[key] = `rgba(${color}, ${value})`;
  });
  return result;
};

// Definir los colores principales usando las variables CSS existentes
const colors = {
  brand: {
    50: "var(--color-brand-50)",    // #FFF5F8
    100: "var(--color-brand-100)",  // #FFE4ED
    200: "var(--color-brand-200)",  // #FFD4E3
    300: "var(--color-brand-300)",  // #FFB3CD
    400: "var(--color-brand-400)",  // #E3699A - Rosa principal
    500: "var(--color-brand-500)",  // #932B71 - Morado principal
    600: "var(--color-brand-600)",  // #7A2460
    700: "var(--color-brand-700)",  // #611D4E
    800: "var(--color-brand-800)",  // #48163C
    900: "var(--color-brand-900)",  // #2F0F2A
    // Agregamos transparencias para brand-500 (Morado principal)
    "500-alpha": withAlpha("147, 43, 113", {
      10: 0.1,
      20: 0.2,
      30: 0.3,
      40: 0.4,
      50: 0.5,
      60: 0.6,
      70: 0.7,
      80: 0.8,
      90: 0.9,
    }),
    // Transparencias para brand-400 (Rosa principal)
    "400-alpha": withAlpha("227, 105, 154", {
      10: 0.1,
      20: 0.2,
      30: 0.3,
      40: 0.4,
      50: 0.5,
      60: 0.6,
      70: 0.7,
      80: 0.8,
      90: 0.9,
    }),
  },
  accent: {
    50: "var(--color-accent-50)",   // #F8F2F7
    100: "var(--color-accent-100)", // #EBD9E8
    200: "var(--color-accent-200)", // #DEC0D9
    300: "var(--color-accent-300)", // #D1A7CB
    400: "var(--color-accent-400)", // #C48EBC
    500: "var(--color-accent-500)", // #B47BA3 - Lila principal
    600: "var(--color-accent-600)", // #9A6289
    700: "var(--color-accent-700)", // #804970
    800: "var(--color-accent-800)", // #663057
    900: "var(--color-accent-900)", // #4C173E
    "500-alpha": withAlpha("180, 123, 163", {
      10: 0.1,
      20: 0.2,
      30: 0.3,
      40: 0.4,
      50: 0.5,
      60: 0.6,
      70: 0.7,
      80: 0.8,
      90: 0.9,
    }),
  },
  gray: {
    50: "var(--color-gray-50)",     // #F7F7F8
    100: "var(--color-gray-100)",   // #E8E9EA
    200: "var(--color-gray-200)",   // #A9ACAE - Gris medio claro
    300: "var(--color-gray-300)",   // #8B9094
    400: "var(--color-gray-400)",   // #6D747A
    500: "var(--color-gray-500)",   // #545D61 - Gris principal
    600: "var(--color-gray-600)",   // #434A4D
    700: "var(--color-gray-700)",   // #323739
    800: "var(--color-gray-800)",   // #212425
    900: "var(--color-gray-900)",   // #080D10 - Negro
    "500-alpha": withAlpha("84, 93, 97", {
      10: 0.1,
      20: 0.2,
      30: 0.3,
      40: 0.4,
      50: 0.5,
      60: 0.6,
      70: 0.7,
      80: 0.8,
      90: 0.9,
    }),
  },
  status: {
    available: "var(--color-available)",    // #38a169
    borrowed: "var(--color-borrowed)",      // #dd6b20
    maintenance: "var(--color-maintenance)", // #3182ce
    disabled: "var(--color-disabled)",      // #718096
    lost: "var(--color-lost)",              // #e53e3e
  },
};

// Bordes redondeados
const radii = {
  sm: "var(--border-radius-sm)",    // 0.125rem
  md: "var(--border-radius-md)",    // 0.25rem
  lg: "var(--border-radius-lg)",    // 0.5rem
  xl: "var(--border-radius-xl)",    // 0.75rem
  "2xl": "var(--border-radius-2xl)", // 1rem
  "3xl": "var(--border-radius-3xl)", // 1.5rem
  full: "var(--border-radius-full)", // 9999px
};

// Transiciones
const transition = {
  fast: "var(--transition-fast)",     // 0.15s ease-in-out
  normal: "var(--transition-normal)", // 0.3s ease-in-out
  slow: "var(--transition-slow)",     // 0.5s ease-in-out
};

// Estilos de componentes
const components = {
  Button: {
    // Variantes por defecto para todos los botones
    baseStyle: {
      borderRadius: "md",
      fontWeight: "500",
      _focus: {
        boxShadow: "0 0 0 3px var(--color-brand-400)",
      },
    },
    defaultProps: {
      colorScheme: "brand",
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: "md",
      },
    },
    defaultProps: {
      focusBorderColor: "brand.400",
    },
  },
  FormLabel: {
    baseStyle: {
      fontSize: "sm",
      fontWeight: "500",
      mb: "2",
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: "heading",
      fontWeight: "bold",
    },
  },
  Link: {
    baseStyle: {
      color: "brand.500",
      _hover: {
        textDecoration: "underline",
        color: "brand.600",
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: "md",
        overflow: "hidden",
      },
    },
  },
  Alert: {
    baseStyle: {
      title: {
        fontFamily: "'Noto Sans', sans-serif",
        fontWeight: 600,
      },
    },
  },
};

// Fuentes
const fonts = {
  body: "'Roboto', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  heading: "'Roboto', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  mono: "'IBM Plex Mono', source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
};

// Estilos globales
const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === "dark" ? "gray.900" : "gray.50",
      color: props.colorMode === "dark" ? "gray.100" : "gray.800",
    },
    // Añadir estilos de animación global
    ".fade-in": {
      animation: `fadeIn ${transition.normal}`,
    },
    ".slide-in": {
      animation: `slideInFromRight ${transition.normal}`,
    },
    // Estilos para el contenedor del logo
    ".logo-container": {
      
    },
    ".logo": {
      transition: transition.normal,
      _hover: {
        transform: "scale(1.05)",
      },
    },
    // Estilos para formularios
    ".form-container": {
      width: "100%",
    },
    ".form-group": {
      marginBottom: "1.5rem",
    },
    ".form-label": {
      display: "block",
      marginBottom: "0.5rem",
      fontWeight: "500",
    },
    ".form-control": {
      display: "block",
      width: "100%",
      padding: "0.5rem 0.75rem",
      fontSize: "1rem",
      lineHeight: "1.5",
      borderRadius: "var(--border-radius-md)",
      transition: "border-color var(--transition-normal)",
      _focus: {
        borderColor: "brand.400",
        boxShadow: "var(--shadow-focus)",
      },
    },
  }),
};

// Crear y exportar el tema como exportación por defecto
const theme = extendTheme({
  config,
  colors,
  radii,
  components,
  fonts,
  styles,
  transition,
});

export default theme;