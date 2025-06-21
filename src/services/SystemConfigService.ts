import React from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Interfaz para las variables del sistema
export interface SystemVariables {
  // Gestión de préstamos y devoluciones
  diasGraciaDevolucion: number;
  diasMaximoRetraso: number;
  diasBloqueoPorRetraso: number;
  tiempoMinimoEntrePrestamos: number;
  
  // Notificaciones automáticas
  recordatorioPreActividad: number;
  recordatorioDevolucion: number;
  notificacionRetrasoDevolucion: number;
  
  // Gestión de material
  porcentajeStockMinimo: number;
  diasRevisionPeriodica: number;
  
  // Gestión de actividades
  diasMinimoAntelacionCreacion: number;
  diasMaximoModificacion: number;
  limiteParticipantesPorDefecto: number;
  
  // Sistema de puntuación y reputación
  penalizacionRetraso: number;
  bonificacionDevolucionTemprana: number;
  umbraLinactividadUsuario: number;
  
  // Configuración de reportes
  diasHistorialReportes: number;
  limiteElementosExportacion: number;
}

// Valores por defecto del sistema
const DEFAULT_VARIABLES: SystemVariables = {
  // Gestión de préstamos y devoluciones
  diasGraciaDevolucion: 3,
  diasMaximoRetraso: 15,
  diasBloqueoPorRetraso: 30,
  tiempoMinimoEntrePrestamos: 1,
  
  // Notificaciones automáticas
  recordatorioPreActividad: 7,
  recordatorioDevolucion: 1,
  notificacionRetrasoDevolucion: 3,
  
  // Gestión de material
  porcentajeStockMinimo: 20,
  diasRevisionPeriodica: 180,
  
  // Gestión de actividades
  diasMinimoAntelacionCreacion: 3,
  diasMaximoModificacion: 2,
  limiteParticipantesPorDefecto: 20,
  
  // Sistema de puntuación y reputación
  penalizacionRetraso: 5,
  bonificacionDevolucionTemprana: 2,
  umbraLinactividadUsuario: 365,
  
  // Configuración de reportes
  diasHistorialReportes: 365,
  limiteElementosExportacion: 1000,
};

class SystemConfigService {
  private static instance: SystemConfigService;
  private variables: SystemVariables = DEFAULT_VARIABLES;
  private isLoaded = false;

  public static getInstance(): SystemConfigService {
    if (!SystemConfigService.instance) {
      SystemConfigService.instance = new SystemConfigService();
    }
    return SystemConfigService.instance;
  }

  /**
   * Carga las variables del sistema desde Firebase
   */
  public async loadSystemVariables(): Promise<SystemVariables> {
    try {
      const docRef = doc(db, 'configuracion', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.variables) {
          this.variables = { ...DEFAULT_VARIABLES, ...data.variables };
        }
      }
      
      this.isLoaded = true;
      console.log('✅ Variables del sistema cargadas:', this.variables);
      return this.variables;
    } catch (error) {
      console.error('❌ Error cargando variables del sistema:', error);
      // En caso de error, usar valores por defecto
      this.variables = DEFAULT_VARIABLES;
      this.isLoaded = true;
      return this.variables;
    }
  }

  /**
   * Actualiza las variables del sistema en Firebase
   */
  public async updateSystemVariables(newVariables: Partial<SystemVariables>): Promise<boolean> {
    try {
      const docRef = doc(db, 'configuracion', 'global');
      const updatedVariables = { ...this.variables, ...newVariables };
      
      await updateDoc(docRef, {
        variables: updatedVariables,
        lastUpdated: new Date(),
        updatedBy: 'system'
      });
      
      this.variables = updatedVariables;
      console.log('✅ Variables del sistema actualizadas:', updatedVariables);
      return true;
    } catch (error) {
      console.error('❌ Error actualizando variables del sistema:', error);
      return false;
    }
  }

  /**
   * Obtiene una variable específica del sistema
   */
  public getVariable<K extends keyof SystemVariables>(key: K): SystemVariables[K] {
    if (!this.isLoaded) {
      console.warn('⚠️ Variables del sistema no han sido cargadas. Usando valor por defecto.');
      return DEFAULT_VARIABLES[key];
    }
    return this.variables[key];
  }

  /**
   * Obtiene todas las variables del sistema
   */
  public getAllVariables(): SystemVariables {
    if (!this.isLoaded) {
      console.warn('⚠️ Variables del sistema no han sido cargadas. Usando valores por defecto.');
      return DEFAULT_VARIABLES;
    }
    return { ...this.variables };
  }

  /**
   * Verifica si una fecha está dentro del período de gracia para devolución
   */
  public isWithinGracePeriod(activityEndDate: Date): boolean {
    const gracePeriodDays = this.getVariable('diasGraciaDevolucion');
    const graceEndDate = new Date(activityEndDate);
    graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
    
    return new Date() <= graceEndDate;
  }

  /**
   * Calcula la fecha límite para devolución (incluyendo período de gracia)
   */
  public calculateReturnDeadline(activityEndDate: Date): Date {
    const gracePeriodDays = this.getVariable('diasGraciaDevolucion');
    const deadline = new Date(activityEndDate);
    deadline.setDate(deadline.getDate() + gracePeriodDays);
    return deadline;
  }

  /**
   * Verifica si un retraso amerita penalización
   */
  public shouldApplyPenalty(daysLate: number): boolean {
    const maxDelayDays = this.getVariable('diasMaximoRetraso');
    return daysLate > maxDelayDays;
  }

  /**
   * Verifica si un retraso amerita bloqueo temporal
   */
  public shouldApplyBlock(daysLate: number): boolean {
    const blockDelayDays = this.getVariable('diasBloqueoPorRetraso');
    return daysLate > blockDelayDays;
  }

  /**
   * Calcula si el stock está por debajo del mínimo
   */
  public isStockBelowMinimum(currentStock: number, totalStock: number): boolean {
    const minPercentage = this.getVariable('porcentajeStockMinimo');
    const currentPercentage = (currentStock / totalStock) * 100;
    return currentPercentage < minPercentage;
  }

  /**
   * Verifica si se puede crear una actividad con la antelación dada
   */
  public canCreateActivity(activityDate: Date): boolean {
    const minAdvanceDays = this.getVariable('diasMinimoAntelacionCreacion');
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + minAdvanceDays);
    
    return activityDate >= minDate;
  }

  /**
   * Verifica si se puede modificar una actividad
   */
  public canModifyActivity(activityDate: Date): boolean {
    const maxModifyDays = this.getVariable('diasMaximoModificacion');
    const cutoffDate = new Date(activityDate);
    cutoffDate.setDate(cutoffDate.getDate() - maxModifyDays);
    
    return new Date() <= cutoffDate;
  }

  /**
   * Verifica si un usuario está inactivo
   */
  public isUserInactive(lastActivityDate: Date): boolean {
    const inactivityThreshold = this.getVariable('umbraLinactividadUsuario');
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - inactivityThreshold);
    
    return lastActivityDate < thresholdDate;
  }

  /**
   * Resetea las variables a los valores por defecto
   */
  public resetToDefaults(): SystemVariables {
    this.variables = { ...DEFAULT_VARIABLES };
    return this.variables;
  }
}

// Instancia singleton
export const systemConfig = SystemConfigService.getInstance();

// Hook personalizado para React
export const useSystemConfig = () => {
  const [variables, setVariables] = React.useState<SystemVariables>(DEFAULT_VARIABLES);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      const loadedVariables = await systemConfig.loadSystemVariables();
      setVariables(loadedVariables);
      setLoading(false);
    };

    loadConfig();
  }, []);

  const updateConfig = async (newVariables: Partial<SystemVariables>) => {
    const success = await systemConfig.updateSystemVariables(newVariables);
    if (success) {
      setVariables(systemConfig.getAllVariables());
    }
    return success;
  };

  return {
    variables,
    loading,
    updateConfig,
    getVariable: systemConfig.getVariable.bind(systemConfig),
    // Métodos utilitarios
    isWithinGracePeriod: systemConfig.isWithinGracePeriod.bind(systemConfig),
    calculateReturnDeadline: systemConfig.calculateReturnDeadline.bind(systemConfig),
    shouldApplyPenalty: systemConfig.shouldApplyPenalty.bind(systemConfig),
    shouldApplyBlock: systemConfig.shouldApplyBlock.bind(systemConfig),
    isStockBelowMinimum: systemConfig.isStockBelowMinimum.bind(systemConfig),
    canCreateActivity: systemConfig.canCreateActivity.bind(systemConfig),
    canModifyActivity: systemConfig.canModifyActivity.bind(systemConfig),
    isUserInactive: systemConfig.isUserInactive.bind(systemConfig),
  };
};

export default SystemConfigService;
