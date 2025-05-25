// Archivo de pruebas específico para validar las optimizaciones de rendimiento
// Este archivo puede ser importado en cualquier componente para probar las optimizaciones

import { useState, useEffect, useRef } from 'react';

interface PerformanceTestResults {
  violationCount: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  totalOperations: number;
  successRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private violationCount = 0;
  private operationTimes: number[] = [];
  private observers: ((results: PerformanceTestResults) => void)[] = [];
  private originalConsoleWarn: typeof console.warn;
  private isMonitoring = false;

  private constructor() {
    this.originalConsoleWarn = console.warn;
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.violationCount = 0;
    this.operationTimes = [];

    // Interceptar console.warn para detectar violaciones
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('[Violation]') && message.includes('handler took')) {
        this.violationCount++;
        this.notifyObservers();
      }
      this.originalConsoleWarn(...args);
    };

    console.log('🔍 Monitor de rendimiento iniciado');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.warn = this.originalConsoleWarn;
    console.log('⏹️ Monitor de rendimiento detenido');
  }

  recordOperation(executionTime: number): void {
    this.operationTimes.push(executionTime);
    this.notifyObservers();
  }

  getResults(): PerformanceTestResults {
    const totalOperations = this.operationTimes.length;
    const averageExecutionTime = totalOperations > 0 
      ? this.operationTimes.reduce((sum, time) => sum + time, 0) / totalOperations 
      : 0;
    const maxExecutionTime = totalOperations > 0 
      ? Math.max(...this.operationTimes) 
      : 0;
    const successRate = totalOperations > 0 
      ? ((totalOperations - this.violationCount) / totalOperations) * 100 
      : 100;

    return {
      violationCount: this.violationCount,
      averageExecutionTime,
      maxExecutionTime,
      totalOperations,
      successRate
    };
  }

  reset(): void {
    this.violationCount = 0;
    this.operationTimes = [];
    this.notifyObservers();
  }

  subscribe(observer: (results: PerformanceTestResults) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  private notifyObservers(): void {
    const results = this.getResults();
    this.observers.forEach(observer => observer(results));
  }
}

// Hook para usar el monitor de rendimiento en componentes React
export function usePerformanceMonitor() {
  const [results, setResults] = useState<PerformanceTestResults>({
    violationCount: 0,
    averageExecutionTime: 0,
    maxExecutionTime: 0,
    totalOperations: 0,
    successRate: 100
  });

  const monitor = useRef(PerformanceMonitor.getInstance());

  useEffect(() => {
    const unsubscribe = monitor.current.subscribe(setResults);
    return unsubscribe;
  }, []);

  const startMonitoring = () => monitor.current.startMonitoring();
  const stopMonitoring = () => monitor.current.stopMonitoring();
  const resetResults = () => monitor.current.reset();
  const recordOperation = (time: number) => monitor.current.recordOperation(time);

  return {
    results,
    startMonitoring,
    stopMonitoring,
    resetResults,
    recordOperation
  };
}

// Función para probar una operación específica
export async function testOperation(
  name: string,
  operation: () => Promise<void> | void
): Promise<number> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();
  
  console.log(`🧪 Probando operación: ${name}`);
  
  try {
    await operation();
    const executionTime = performance.now() - startTime;
    monitor.recordOperation(executionTime);
    
    console.log(`✅ ${name} completada en ${executionTime.toFixed(2)}ms`);
    return executionTime;
  } catch (error) {
    const executionTime = performance.now() - startTime;
    monitor.recordOperation(executionTime);
    
    console.error(`❌ Error en ${name}:`, error);
    throw error;
  }
}

// Función para generar carga de trabajo sintética para pruebas
export function generateSyntheticWorkload(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
  const workloads = {
    light: () => {
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
    },
    medium: () => {
      for (let i = 0; i < 10000; i++) {
        Math.random() * Math.random();
      }
    },
    heavy: () => {
      for (let i = 0; i < 100000; i++) {
        Math.sin(Math.random()) * Math.cos(Math.random());
      }
    }
  };

  return workloads[intensity];
}

export default PerformanceMonitor;
