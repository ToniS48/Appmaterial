import { db } from '../config/firebase';
import { runTransaction } from 'firebase/firestore';
import { logger } from './loggerUtils';

/**
 * Ejecuta múltiples operaciones en una transacción atómica
 * @param operation Función que contiene las operaciones a realizar en la transacción
 * @returns Resultado de la transacción
 */
export const executeTransaction = async <T>(
  operation: (transaction: any) => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  let currentAttempt = 0;
  
  while (currentAttempt < maxRetries) {
    try {
      return await runTransaction(db, operation);
    } catch (error: any) {
      currentAttempt++;
      
      // Si es el último intento, lanzar el error
      if (currentAttempt >= maxRetries) {
        logger.error('Transacción fallida después de múltiples intentos', { error, maxRetries });
        throw error;
      }
      
      // Espera exponencial entre reintentos
      const waitTime = Math.pow(2, currentAttempt) * 100;
      logger.warn(`Reintentando transacción (${currentAttempt}/${maxRetries}) en ${waitTime}ms`, { error });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Transacción fallida por razones desconocidas');
};

/**
 * Clase de ayuda para trabajar con transacciones
 * Implementa el patrón Unit of Work
 */
export class TransactionManager {
  private operations: Array<() => Promise<void>> = [];
  
  /**
   * Añade una operación a la transacción
   */
  addOperation(operation: () => Promise<void>): void {
    this.operations.push(operation);
  }
  
  /**
   * Ejecuta todas las operaciones en una única transacción
   */
  async execute(): Promise<void> {
    if (this.operations.length === 0) {
      return;
    }
    
    await executeTransaction(async (transaction) => {
      for (const operation of this.operations) {
        await operation();
      }
      return true;
    });
    
    // Limpiar operaciones después de ejecutar
    this.operations = [];
  }
}