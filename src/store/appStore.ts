import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Store unificado que gestiona el estado global de la aplicación
 * Elimina la duplicación de estado entre contextos y componentes
 */

// Tipos para el estado global
export interface AppState {
  // UI State
  ui: {
    isLoading: boolean;
    errors: Record<string, string>;
    activeModal: string | null;
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
  };

  // User State  
  user: {
    profile: any | null;
    isAuthenticated: boolean;
    permissions: string[];
  };

  // Entities Cache
  cache: {
    materiales: any[];
    actividades: any[];
    usuarios: any[];
    prestamos: any[];
    lastUpdated: Record<string, number>;
  };

  // Form State
  forms: {
    actividad: {
      data: any;
      activeTab: number;
      completedTabs: number[];
      isDirty: boolean;
    };
    material: {
      data: any;
      isDirty: boolean;
    };
  };
}

// Acciones
export interface AppActions {
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // User Actions
  setUserProfile: (profile: any) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;

  // Cache Actions
  updateCache: (entity: keyof AppState['cache'], data: any[]) => void;
  invalidateCache: (entity: keyof AppState['cache']) => void;
  getCacheAge: (entity: keyof AppState['cache']) => number;

  // Form Actions
  updateActividadForm: (data: Partial<AppState['forms']['actividad']>) => void;
  resetActividadForm: () => void;
  updateMaterialForm: (data: Partial<AppState['forms']['material']>) => void;
  resetMaterialForm: () => void;
}

// Estado inicial
const initialState: AppState = {
  ui: {
    isLoading: false,
    errors: {},
    activeModal: null,
    sidebarOpen: false,
    theme: 'light'
  },
  user: {
    profile: null,
    isAuthenticated: false,
    permissions: []
  },
  cache: {
    materiales: [],
    actividades: [],
    usuarios: [],
    prestamos: [],
    lastUpdated: {}
  },
  forms: {
    actividad: {
      data: {},
      activeTab: 0,
      completedTabs: [],
      isDirty: false
    },
    material: {
      data: {},
      isDirty: false
    }
  }
};

// Store principal
export const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // UI Actions
    setLoading: (loading: boolean) =>
      set((state) => ({
        ui: { ...state.ui, isLoading: loading }
      })),

    setError: (key: string, error: string) =>
      set((state) => ({
        ui: {
          ...state.ui,
          errors: { ...state.ui.errors, [key]: error }
        }
      })),

    clearError: (key: string) =>
      set((state) => {
        const { [key]: removed, ...rest } = state.ui.errors;
        return {
          ui: { ...state.ui, errors: rest }
        };
      }),

    clearAllErrors: () =>
      set((state) => ({
        ui: { ...state.ui, errors: {} }
      })),

    openModal: (modalId: string) =>
      set((state) => ({
        ui: { ...state.ui, activeModal: modalId }
      })),

    closeModal: () =>
      set((state) => ({
        ui: { ...state.ui, activeModal: null }
      })),

    toggleSidebar: () =>
      set((state) => ({
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
      })),

    setTheme: (theme: 'light' | 'dark') =>
      set((state) => ({
        ui: { ...state.ui, theme }
      })),

    // User Actions
    setUserProfile: (profile: any) =>
      set((state) => ({
        user: { 
          ...state.user, 
          profile,
          isAuthenticated: !!profile,
          permissions: profile?.permissions || []
        }
      })),

    setAuthenticated: (authenticated: boolean) =>
      set((state) => ({
        user: { ...state.user, isAuthenticated: authenticated }
      })),

    logout: () =>
      set((state) => ({
        user: {
          profile: null,
          isAuthenticated: false,
          permissions: []
        },
        cache: {
          materiales: [],
          actividades: [],
          usuarios: [],
          prestamos: [],
          lastUpdated: {}
        }
      })),

    // Cache Actions
    updateCache: (entity: keyof AppState['cache'], data: any[]) =>
      set((state) => ({
        cache: {
          ...state.cache,
          [entity]: data,
          lastUpdated: {
            ...state.cache.lastUpdated,
            [entity]: Date.now()
          }
        }
      })),

    invalidateCache: (entity: keyof AppState['cache']) =>
      set((state) => ({
        cache: {
          ...state.cache,
          [entity]: [],
          lastUpdated: {
            ...state.cache.lastUpdated,
            [entity]: 0
          }
        }
      })),

    getCacheAge: (entity: keyof AppState['cache']) => {
      const lastUpdated = get().cache.lastUpdated[entity] || 0;
      return Date.now() - lastUpdated;
    },

    // Form Actions
    updateActividadForm: (data: Partial<AppState['forms']['actividad']>) =>
      set((state) => ({
        forms: {
          ...state.forms,
          actividad: {
            ...state.forms.actividad,
            ...data,
            isDirty: true
          }
        }
      })),

    resetActividadForm: () =>
      set((state) => ({
        forms: {
          ...state.forms,
          actividad: {
            data: {},
            activeTab: 0,
            completedTabs: [],
            isDirty: false
          }
        }
      })),

    updateMaterialForm: (data: Partial<AppState['forms']['material']>) =>
      set((state) => ({
        forms: {
          ...state.forms,
          material: {
            ...state.forms.material,
            ...data,
            isDirty: true
          }
        }
      })),

    resetMaterialForm: () =>
      set((state) => ({
        forms: {
          ...state.forms,
          material: {
            data: {},
            isDirty: false
          }
        }
      }))
  }))
);

// Selectores optimizados para evitar re-renders innecesarios
export const useUI = () => useAppStore((state) => state.ui);
export const useUser = () => useAppStore((state) => state.user);
export const useCache = () => useAppStore((state) => state.cache);
export const useForms = () => useAppStore((state) => state.forms);

// Selectores específicos más granulares
export const useIsLoading = () => useAppStore((state) => state.ui.isLoading);
export const useErrors = () => useAppStore((state) => state.ui.errors);
export const useUserProfile = () => useAppStore((state) => state.user.profile);
export const useIsAuthenticated = () => useAppStore((state) => state.user.isAuthenticated);

// Hook para cache con TTL (Time To Live)
export const useCacheWithTTL = (entity: keyof AppState['cache'], ttlMs: number = 5 * 60 * 1000) => {
  const cache = useAppStore((state) => state.cache);
  const getCacheAge = useAppStore((state) => state.getCacheAge);
  
  const isStale = getCacheAge(entity) > ttlMs;
  
  return {
    data: cache[entity],
    isStale,
    lastUpdated: cache.lastUpdated[entity] || 0
  };
};
