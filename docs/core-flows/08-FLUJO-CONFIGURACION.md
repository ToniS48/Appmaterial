# ⚙️ Flujo de Sistema de Configuración

## 📋 Resumen

Sistema centralizado de configuración que gestiona todas las variables y parámetros del sistema de forma dinámica, permitiendo ajustes en tiempo real sin necesidad de redepliegue.

---

## 🏗️ Arquitectura del Sistema de Configuración

### Componentes Principales
- **SystemConfigService**: Servicio central de configuración
- **useUnifiedConfig**: Hook para gestión de configuraciones
- **ConfigurationPanel**: Panel de administración
- **ConfigSections**: Secciones especializadas por módulo
- **ConfigValidation**: Sistema de validación

### Servicios Integrados
- **Firebase Firestore**: Almacenamiento de configuraciones
- **Real-time Updates**: Propagación automática de cambios
- **Validation Engine**: Validación de valores
- **Default Values**: Valores por defecto del sistema

---

## 📊 Estructura de Configuraciones

### Categorías Principales
```typescript
interface SystemConfiguration {
  // Configuraciones de préstamos
  prestamos: {
    diasLimitePorDefecto: number;
    diasGraciaDevolucion: number;
    penalizacionPorDiaRetraso: number;
    maxPrestamosPorUsuario: number;
    permitirPrestamosSuperpuestos: boolean;
    notificacionesAutomaticas: {
      recordatorioDevolucion: number; // días antes
      alertaVencimiento: number; // días después
      escaladaAdministradores: number; // días después
    };
  };
  
  // Configuraciones de actividades
  actividades: {
    antelacionMinimaCreacion: number; // horas
    limitesParticipantes: {
      minimo: number;
      maximo: number;
      porDefecto: number;
    };
    aprobacionAutomatica: boolean;
    cancelacionLimite: number; // horas antes
    recordatorios: {
      participantes: number[]; // días antes [7, 1]
      responsables: number[]; // días antes [14, 3, 1]
    };
  };
  
  // Configuraciones de notificaciones
  notificaciones: {
    intervaloVerificacion: number; // minutos
    maxPorUsuarioPorDia: number;
    tiempoVidaNotificacion: number; // días
    canalesHabilitados: {
      inApp: boolean;
      email: boolean;
      whatsapp: boolean;
    };
    horarioNoMolestar: {
      enabled: boolean;
      horaInicio: number;
      horaFin: number;
    };
  };
  
  // Configuraciones de material
  material: {
    codigoAutomatico: {
      enabled: boolean;
      patron: string; // 'MAT-{YYYY}-{NNN}'
      contadorInicial: number;
    };
    mantenimiento: {
      frecuenciaRevision: number; // días
      alertaAnticipada: number; // días antes
      categoriasRequierenMantenimiento: string[];
    };
    disponibilidad: {
      reservaAutomatica: boolean;
      tiempoReserva: number; // minutos
      overbooking: {
        enabled: boolean;
        porcentaje: number; // % adicional permitido
      };
    };
  };
  
  // Configuraciones meteorológicas
  meteorologia: {
    enabled: boolean;
    apiPrincipal: 'open-meteo' | 'aemet';
    ubicacionPorDefecto: {
      lat: number;
      lon: number;
      nombre: string;
    };
    alertas: {
      enabled: boolean;
      umbrales: {
        lluvia: number; // mm
        viento: number; // km/h
        temperaturaMaxima: number; // °C
        temperaturaMinima: number; // °C
      };
    };
    cache: {
      enabled: boolean;
      tiempoVida: number; // segundos
    };
  };
  
  // Configuraciones de mensajería
  mensajeria: {
    enabled: boolean;
    maxParticipantesPorGrupo: number;
    retencionMensajes: number; // días
    adjuntos: {
      enabled: boolean;
      tamanosMaximos: {
        imagen: number; // MB
        documento: number; // MB
        total: number; // MB por mensaje
      };
    };
    moderacion: {
      enabled: boolean;
      palabrasFiltradas: string[];
      accionAutomatica: 'advertir' | 'bloquear' | 'eliminar';
    };
  };
  
  // Configuraciones del sistema
  sistema: {
    nombreAplicacion: string;
    version: string;
    mantenimiento: {
      enabled: boolean;
      mensaje: string;
      fechaInicio?: Date;
      fechaFin?: Date;
    };
    backup: {
      frecuencia: 'diario' | 'semanal' | 'mensual';
      retencion: number; // días
      enabled: boolean;
    };
    analytics: {
      enabled: boolean;
      retencionDatos: number; // días
    };
  };
}
```

### Valores por Defecto
```typescript
const defaultSystemConfig: SystemConfiguration = {
  prestamos: {
    diasLimitePorDefecto: 14,
    diasGraciaDevolucion: 3,
    penalizacionPorDiaRetraso: 0,
    maxPrestamosPorUsuario: 5,
    permitirPrestamosSuperpuestos: false,
    notificacionesAutomaticas: {
      recordatorioDevolucion: 2,
      alertaVencimiento: 1,
      escaladaAdministradores: 7
    }
  },
  
  actividades: {
    antelacionMinimaCreacion: 24,
    limitesParticipantes: {
      minimo: 1,
      maximo: 50,
      porDefecto: 10
    },
    aprobacionAutomatica: true,
    cancelacionLimite: 24,
    recordatorios: {
      participantes: [7, 1],
      responsables: [14, 3, 1]
    }
  },
  
  notificaciones: {
    intervaloVerificacion: 15,
    maxPorUsuarioPorDia: 20,
    tiempoVidaNotificacion: 30,
    canalesHabilitados: {
      inApp: true,
      email: false,
      whatsapp: false
    },
    horarioNoMolestar: {
      enabled: false,
      horaInicio: 22,
      horaFin: 8
    }
  },
  
  material: {
    codigoAutomatico: {
      enabled: true,
      patron: 'MAT-{YYYY}-{NNN}',
      contadorInicial: 1
    },
    mantenimiento: {
      frecuenciaRevision: 90,
      alertaAnticipada: 7,
      categoriasRequierenMantenimiento: ['tiendas_camping', 'cuerdas_escalada']
    },
    disponibilidad: {
      reservaAutomatica: true,
      tiempoReserva: 30,
      overbooking: {
        enabled: false,
        porcentaje: 10
      }
    }
  },
  
  meteorologia: {
    enabled: true,
    apiPrincipal: 'open-meteo',
    ubicacionPorDefecto: {
      lat: 40.4168,
      lon: -3.7038,
      nombre: 'Madrid, España'
    },
    alertas: {
      enabled: true,
      umbrales: {
        lluvia: 20,
        viento: 50,
        temperaturaMaxima: 35,
        temperaturaMinima: -5
      }
    },
    cache: {
      enabled: true,
      tiempoVida: 3600
    }
  },
  
  mensajeria: {
    enabled: true,
    maxParticipantesPorGrupo: 20,
    retencionMensajes: 365,
    adjuntos: {
      enabled: true,
      tamanosMaximos: {
        imagen: 10,
        documento: 25,
        total: 50
      }
    },
    moderacion: {
      enabled: false,
      palabrasFiltradas: [],
      accionAutomatica: 'advertir'
    }
  },
  
  sistema: {
    nombreAplicacion: 'AppMaterial',
    version: '2.0.0',
    mantenimiento: {
      enabled: false,
      mensaje: 'Sistema en mantenimiento. Disculpen las molestias.'
    },
    backup: {
      frecuencia: 'diario',
      retencion: 30,
      enabled: true
    },
    analytics: {
      enabled: true,
      retencionDatos: 90
    }
  }
};
```

---

## 🔧 SystemConfigService

### Implementación Principal
```typescript
class SystemConfigService {
  private db = getFirestore();
  private cache = new Map<string, ConfigCache>();
  private listeners = new Map<string, (() => void)[]>();
  
  async loadConfig<T>(seccion: string, defaultValue?: T): Promise<T> {
    // Verificar cache
    const cached = this.cache.get(seccion);
    if (cached && !this.isCacheExpired(cached)) {
      return cached.data as T;
    }
    
    try {
      // Cargar desde Firestore
      const configDoc = await getDoc(doc(this.db, 'configuracion', seccion));
      
      if (configDoc.exists()) {
        const data = configDoc.data() as T;
        this.saveToCache(seccion, data);
        return data;
      } else if (defaultValue) {
        // Crear configuración con valores por defecto
        await this.saveConfig(seccion, defaultValue);
        return defaultValue;
      } else {
        throw new Error(`Configuración ${seccion} no encontrada`);
      }
    } catch (error) {
      console.error(`Error cargando configuración ${seccion}:`, error);
      
      // Devolver cache aunque esté expirado si hay error
      if (cached) {
        return cached.data as T;
      }
      
      // Como último recurso, devolver valor por defecto
      if (defaultValue) {
        return defaultValue;
      }
      
      throw error;
    }
  }
  
  async saveConfig<T>(seccion: string, config: T): Promise<void> {
    // Validar configuración antes de guardar
    await this.validateConfig(seccion, config);
    
    try {
      await setDoc(doc(this.db, 'configuracion', seccion), config);
      
      // Actualizar cache
      this.saveToCache(seccion, config);
      
      // Notificar a listeners
      this.notifyListeners(seccion);
      
      // Propagar cambios a servicios dependientes
      await this.propagateChanges(seccion, config);
      
    } catch (error) {
      console.error(`Error guardando configuración ${seccion}:`, error);
      throw error;
    }
  }
  
  async loadSystemVariables(): Promise<SystemConfiguration> {
    const secciones = [
      'prestamos',
      'actividades', 
      'notificaciones',
      'material',
      'meteorologia',
      'mensajeria',
      'sistema'
    ];
    
    const configuraciones = await Promise.all(
      secciones.map(async (seccion) => {
        const config = await this.loadConfig(
          seccion, 
          defaultSystemConfig[seccion as keyof SystemConfiguration]
        );
        return { [seccion]: config };
      })
    );
    
    return configuraciones.reduce((acc, config) => ({ ...acc, ...config }), {}) as SystemConfiguration;
  }
  
  private async validateConfig<T>(seccion: string, config: T): Promise<void> {
    const validator = this.getValidator(seccion);
    if (validator) {
      const resultado = await validator(config);
      if (!resultado.valido) {
        throw new Error(`Configuración inválida: ${resultado.errores.join(', ')}`);
      }
    }
  }
  
  private getValidator(seccion: string): ((config: any) => Promise<ValidationResult>) | null {
    const validators = {
      prestamos: this.validatePrestamosConfig,
      actividades: this.validateActividadesConfig,
      material: this.validateMaterialConfig,
      meteorologia: this.validateMeteorologiaConfig,
      mensajeria: this.validateMensajeriaConfig,
      sistema: this.validateSistemaConfig
    };
    
    return validators[seccion as keyof typeof validators] || null;
  }
  
  private async validatePrestamosConfig(config: any): Promise<ValidationResult> {
    const errores: string[] = [];
    
    if (config.diasLimitePorDefecto < 1 || config.diasLimitePorDefecto > 365) {
      errores.push('Días límite debe estar entre 1 y 365');
    }
    
    if (config.maxPrestamosPorUsuario < 1 || config.maxPrestamosPorUsuario > 100) {
      errores.push('Máximo de préstamos por usuario debe estar entre 1 y 100');
    }
    
    if (config.penalizacionPorDiaRetraso < 0) {
      errores.push('Penalización no puede ser negativa');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }
  
  private async propagateChanges<T>(seccion: string, config: T): Promise<void> {
    // Propagar cambios específicos según la sección
    switch (seccion) {
      case 'meteorologia':
        await this.propagateWeatherConfigChanges(config);
        break;
        
      case 'prestamos':
        await this.propagateLoanConfigChanges(config);
        break;
        
      case 'notificaciones':
        await this.propagateNotificationConfigChanges(config);
        break;
        
      // ... otros casos
    }
  }
  
  private async propagateWeatherConfigChanges(config: any): Promise<void> {
    // Notificar al servicio meteorológico sobre cambios
    if (typeof window !== 'undefined' && (window as any).weatherService) {
      (window as any).weatherService.updateConfig(config);
    }
  }
  
  // Listener para cambios en tiempo real
  subscribeToConfigChanges(seccion: string, callback: () => void): () => void {
    if (!this.listeners.has(seccion)) {
      this.listeners.set(seccion, []);
    }
    
    this.listeners.get(seccion)!.push(callback);
    
    // Configurar listener de Firestore
    const unsubscribe = onSnapshot(
      doc(this.db, 'configuracion', seccion),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          this.saveToCache(seccion, data);
          this.notifyListeners(seccion);
        }
      }
    );
    
    // Devolver función para cancelar suscripción
    return () => {
      const callbacks = this.listeners.get(seccion);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      unsubscribe();
    };
  }
  
  private notifyListeners(seccion: string): void {
    const callbacks = this.listeners.get(seccion);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }
}

// Instancia singleton
export const systemConfig = new SystemConfigService();
```

---

## 🎯 Hook useUnifiedConfig

### Implementación del Hook
```typescript
interface UseUnifiedConfigResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  save: (newConfig: T) => Promise<void>;
  reset: () => Promise<void>;
  isModified: boolean;
}

export function useUnifiedConfig<T>(
  seccion: string,
  defaultValue: T
): UseUnifiedConfigResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<T | null>(null);
  
  // Cargar configuración inicial
  useEffect(() => {
    const loadInitialConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const config = await systemConfig.loadConfig(seccion, defaultValue);
        setData(config);
        setOriginalData(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(`Error cargando configuración ${seccion}:`, err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialConfig();
  }, [seccion, defaultValue]);
  
  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const unsubscribe = systemConfig.subscribeToConfigChanges(seccion, async () => {
      try {
        const updatedConfig = await systemConfig.loadConfig(seccion, defaultValue);
        setData(updatedConfig);
        setOriginalData(updatedConfig);
      } catch (err) {
        console.error(`Error actualizando configuración ${seccion}:`, err);
      }
    });
    
    return unsubscribe;
  }, [seccion, defaultValue]);
  
  const save = useCallback(async (newConfig: T) => {
    try {
      setLoading(true);
      setError(null);
      
      await systemConfig.saveConfig(seccion, newConfig);
      setData(newConfig);
      setOriginalData(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [seccion]);
  
  const reset = useCallback(async () => {
    if (originalData) {
      setData(originalData);
    }
  }, [originalData]);
  
  const isModified = useMemo(() => {
    if (!data || !originalData) return false;
    return JSON.stringify(data) !== JSON.stringify(originalData);
  }, [data, originalData]);
  
  return {
    data,
    loading,
    error,
    save,
    reset,
    isModified
  };
}
```

---

## 🎨 Componentes de UI

### Panel Principal de Configuración
```typescript
const ConfigurationPanel: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState('prestamos');
  const { userProfile } = useAuth();
  
  // Verificar permisos de administración
  if (!['admin', 'vocal'].includes(userProfile?.rol || '')) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos para acceder a la configuración del sistema.
        </AlertDescription>
      </Alert>
    );
  }
  
  const secciones = [
    { id: 'prestamos', nombre: 'Préstamos', icono: '📦' },
    { id: 'actividades', nombre: 'Actividades', icono: '🏃‍♂️' },
    { id: 'material', nombre: 'Material', icono: '🎒' },
    { id: 'meteorologia', nombre: 'Meteorología', icono: '🌤️' },
    { id: 'notificaciones', nombre: 'Notificaciones', icono: '📢' },
    { id: 'mensajeria', nombre: 'Mensajería', icono: '💬' },
    { id: 'sistema', nombre: 'Sistema', icono: '⚙️' }
  ];
  
  return (
    <Container maxW="container.xl">
      <VStack spacing={6} align="stretch">
        <Heading size="xl">Configuración del Sistema</Heading>
        
        <Grid templateColumns={{ base: '1fr', lg: '250px 1fr' }} gap={6}>
          {/* Sidebar de secciones */}
          <GridItem>
            <VStack spacing={2} align="stretch">
              {secciones.map(seccion => (
                <Button
                  key={seccion.id}
                  variant={seccionActiva === seccion.id ? 'solid' : 'ghost'}
                  colorScheme={seccionActiva === seccion.id ? 'blue' : 'gray'}
                  justifyContent="flex-start"
                  leftIcon={<Text>{seccion.icono}</Text>}
                  onClick={() => setSeccionActiva(seccion.id)}
                >
                  {seccion.nombre}
                </Button>
              ))}
            </VStack>
          </GridItem>
          
          {/* Panel de configuración */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
              <ConfigSection seccion={seccionActiva} />
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
};
```

### Sección de Configuración de Préstamos
```typescript
const PrestamosConfigSection: React.FC = () => {
  const { data: config, save, loading, error, isModified } = useUnifiedConfig(
    'prestamos',
    defaultSystemConfig.prestamos
  );
  
  const [localConfig, setLocalConfig] = useState(config);
  const toast = useToast();
  
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);
  
  const handleSave = async () => {
    if (!localConfig) return;
    
    try {
      await save(localConfig);
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han aplicado correctamente',
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 5000
      });
    }
  };
  
  if (loading) return <Skeleton height="400px" />;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;
  if (!localConfig) return null;
  
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Configuración de Préstamos</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <FormControl>
          <FormLabel>Días límite por defecto</FormLabel>
          <NumberInput
            value={localConfig.diasLimitePorDefecto}
            onChange={(_, value) => setLocalConfig({
              ...localConfig,
              diasLimitePorDefecto: value
            })}
            min={1}
            max={365}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            Número de días por defecto para préstamos
          </FormHelperText>
        </FormControl>
        
        <FormControl>
          <FormLabel>Días de gracia para devolución</FormLabel>
          <NumberInput
            value={localConfig.diasGraciaDevolucion}
            onChange={(_, value) => setLocalConfig({
              ...localConfig,
              diasGraciaDevolucion: value
            })}
            min={0}
            max={30}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        
        <FormControl>
          <FormLabel>Máximo préstamos por usuario</FormLabel>
          <NumberInput
            value={localConfig.maxPrestamosPorUsuario}
            onChange={(_, value) => setLocalConfig({
              ...localConfig,
              maxPrestamosPorUsuario: value
            })}
            min={1}
            max={100}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        
        <FormControl>
          <FormLabel>Penalización por día de retraso</FormLabel>
          <NumberInput
            value={localConfig.penalizacionPorDiaRetraso}
            onChange={(_, value) => setLocalConfig({
              ...localConfig,
              penalizacionPorDiaRetraso: value
            })}
            min={0}
            precision={2}
            step={0.5}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            Penalización económica (€) por día de retraso
          </FormHelperText>
        </FormControl>
      </SimpleGrid>
      
      <FormControl>
        <Checkbox
          isChecked={localConfig.permitirPrestamosSuperpuestos}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            permitirPrestamosSuperpuestos: e.target.checked
          })}
        >
          Permitir préstamos superpuestos
        </Checkbox>
        <FormHelperText>
          Permite que un usuario tenga múltiples préstamos del mismo material
        </FormHelperText>
      </FormControl>
      
      <Box>
        <Text fontWeight="semibold" mb={4}>Notificaciones Automáticas</Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel>Recordatorio devolución (días antes)</FormLabel>
            <NumberInput
              value={localConfig.notificacionesAutomaticas.recordatorioDevolucion}
              onChange={(_, value) => setLocalConfig({
                ...localConfig,
                notificacionesAutomaticas: {
                  ...localConfig.notificacionesAutomaticas,
                  recordatorioDevolucion: value
                }
              })}
              min={0}
              max={30}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          
          <FormControl>
            <FormLabel>Alerta vencimiento (días después)</FormLabel>
            <NumberInput
              value={localConfig.notificacionesAutomaticas.alertaVencimiento}
              onChange={(_, value) => setLocalConfig({
                ...localConfig,
                notificacionesAutomaticas: {
                  ...localConfig.notificacionesAutomaticas,
                  alertaVencimiento: value
                }
              })}
              min={0}
              max={30}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
          
          <FormControl>
            <FormLabel>Escalada administradores (días después)</FormLabel>
            <NumberInput
              value={localConfig.notificacionesAutomaticas.escaladaAdministradores}
              onChange={(_, value) => setLocalConfig({
                ...localConfig,
                notificacionesAutomaticas: {
                  ...localConfig.notificacionesAutomaticas,
                  escaladaAdministradores: value
                }
              })}
              min={1}
              max={60}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
        </SimpleGrid>
      </Box>
      
      <HStack justify="space-between">
        <Button
          variant="outline"
          onClick={() => setLocalConfig(config)}
          isDisabled={!isModified}
        >
          Descartar Cambios
        </Button>
        
        <Button
          colorScheme="blue"
          onClick={handleSave}
          isDisabled={!isModified}
          isLoading={loading}
          loadingText="Guardando..."
        >
          Guardar Configuración
        </Button>
      </HStack>
    </VStack>
  );
};
```

---

## 🔄 Propagación de Cambios

### Sistema de Notificación de Cambios
```typescript
class ConfigChangeNotifier {
  private subscribers = new Map<string, Array<(config: any) => void>>();
  
  subscribe(section: string, callback: (config: any) => void): () => void {
    if (!this.subscribers.has(section)) {
      this.subscribers.set(section, []);
    }
    
    this.subscribers.get(section)!.push(callback);
    
    return () => {
      const callbacks = this.subscribers.get(section);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  notify(section: string, config: any): void {
    const callbacks = this.subscribers.get(section);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(config);
        } catch (error) {
          console.error(`Error en callback de configuración ${section}:`, error);
        }
      });
    }
  }
}

export const configChangeNotifier = new ConfigChangeNotifier();

// Uso en servicios
// En weatherService.ts
configChangeNotifier.subscribe('meteorologia', (config) => {
  weatherService.updateConfiguration(config);
});

// En loanService.ts  
configChangeNotifier.subscribe('prestamos', (config) => {
  loanService.updateLimits(config);
});
```

---

## 📊 Validación y Seguridad

### Sistema de Validación Avanzada
```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'range' | 'pattern' | 'custom';
  params?: any;
  message: string;
}

const validationRules: { [section: string]: ValidationRule[] } = {
  prestamos: [
    {
      field: 'diasLimitePorDefecto',
      type: 'range',
      params: { min: 1, max: 365 },
      message: 'Los días límite deben estar entre 1 y 365'
    },
    {
      field: 'maxPrestamosPorUsuario',
      type: 'range',
      params: { min: 1, max: 100 },
      message: 'El máximo de préstamos debe estar entre 1 y 100'
    },
    {
      field: 'penalizacionPorDiaRetraso',
      type: 'custom',
      params: (value: number) => value >= 0,
      message: 'La penalización no puede ser negativa'
    }
  ],
  
  meteorologia: [
    {
      field: 'ubicacionPorDefecto.lat',
      type: 'range',
      params: { min: -90, max: 90 },
      message: 'La latitud debe estar entre -90 y 90'
    },
    {
      field: 'ubicacionPorDefecto.lon',
      type: 'range',
      params: { min: -180, max: 180 },
      message: 'La longitud debe estar entre -180 y 180'
    }
  ]
};

const validateConfiguration = (section: string, config: any): ValidationResult => {
  const rules = validationRules[section] || [];
  const errors: string[] = [];
  
  for (const rule of rules) {
    const value = getNestedValue(config, rule.field);
    
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          errors.push(rule.message);
        }
        break;
        
      case 'range':
        if (typeof value === 'number') {
          if (value < rule.params.min || value > rule.params.max) {
            errors.push(rule.message);
          }
        }
        break;
        
      case 'custom':
        if (typeof rule.params === 'function') {
          if (!rule.params(value)) {
            errors.push(rule.message);
          }
        }
        break;
    }
  }
  
  return {
    valido: errors.length === 0,
    errores: errors
  };
};
```

---

## 📈 Monitorización y Auditoría

### Registro de Cambios de Configuración
```typescript
interface ConfigAuditLog {
  id: string;
  seccion: string;
  usuarioId: string;
  usuarioNombre: string;
  cambiosAnteriores: any;
  cambiosNuevos: any;
  fecha: Timestamp;
  ip?: string;
  userAgent?: string;
}

const registrarCambioConfiguracion = async (
  seccion: string,
  cambiosAnteriores: any,
  cambiosNuevos: any
): Promise<void> => {
  const auditLog: Partial<ConfigAuditLog> = {
    seccion,
    usuarioId: auth.currentUser?.uid || '',
    usuarioNombre: auth.currentUser?.displayName || 'Sistema',
    cambiosAnteriores,
    cambiosNuevos,
    fecha: serverTimestamp(),
    userAgent: navigator.userAgent
  };
  
  await addDoc(collection(db, 'config_audit_logs'), auditLog);
};

// Dashboard de auditoría
const ConfigAuditDashboard: React.FC = () => {
  const [logs, setLogs] = useState<ConfigAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cargarLogs = async () => {
      const q = query(
        collection(db, 'config_audit_logs'),
        orderBy('fecha', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate()
      })) as ConfigAuditLog[];
      
      setLogs(logsData);
      setLoading(false);
    };
    
    cargarLogs();
  }, []);
  
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="lg">Registro de Cambios de Configuración</Heading>
      
      {loading ? (
        <Skeleton height="200px" />
      ) : (
        <VStack spacing={2} align="stretch">
          {logs.map(log => (
            <Box key={log.id} p={4} bg="gray.50" borderRadius="md">
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Badge colorScheme="blue">{log.seccion}</Badge>
                  <Text fontWeight="semibold">{log.usuarioNombre}</Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {formatDistanceToNow(log.fecha, { addSuffix: true, locale: es })}
                </Text>
              </HStack>
              
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton px={0}>
                    <Box flex="1" textAlign="left">
                      Ver cambios detallados
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel px={0}>
                    <SimpleGrid columns={2} gap={4}>
                      <Box>
                        <Text fontWeight="semibold" mb={2}>Anterior:</Text>
                        <Code p={2} bg="red.50" borderRadius="md" display="block" whiteSpace="pre-wrap">
                          {JSON.stringify(log.cambiosAnteriores, null, 2)}
                        </Code>
                      </Box>
                      <Box>
                        <Text fontWeight="semibold" mb={2}>Nuevo:</Text>
                        <Code p={2} bg="green.50" borderRadius="md" display="block" whiteSpace="pre-wrap">
                          {JSON.stringify(log.cambiosNuevos, null, 2)}
                        </Code>
                      </Box>
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
};
```

---

## 🔮 Futuras Mejoras

### En Desarrollo
- **Configuración por Entorno**: Diferentes configuraciones para desarrollo/producción
- **API de Configuración**: Endpoints REST para integración externa
- **Configuración Dinámica**: Cambios sin reinicio del sistema
- **Templates de Configuración**: Configuraciones predefinidas

### Optimizaciones
- **Validación en Tiempo Real**: Feedback inmediato de errores
- **Configuración A/B**: Testing de diferentes configuraciones
- **Backup Automático**: Respaldo antes de cambios críticos
- **Rollback Automático**: Reversión automática en caso de errores

---

**Última actualización**: 28 de junio de 2025  
**Responsable**: Sistema de Configuración AppMaterial
