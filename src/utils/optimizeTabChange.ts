/**
 * Optimiza los cambios de pestaña que pueden generar violaciones
 * al validar datos o realizar transiciones de UI
 * @param changeTabFn Función original para cambiar de pestaña
 * @returns Función optimizada
 */
export function optimizeTabChange(
  changeTabFn: (index: number) => void
): (index: number) => Promise<void> {
  return (newIndex: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Usar MessageChannel para planificar el cambio de manera asincrónica
        // Esta técnica evita específicamente las violaciones de 'message' handler
        const channel = new MessageChannel();
        
        // Establecer un timeout de seguridad por si el MessageChannel falla
        const safetyTimeout = setTimeout(() => {
          try {
            // Plan B: Intentar con un enfoque más simple si MessageChannel falla
            requestAnimationFrame(() => {
              try {
                changeTabFn(newIndex);
                resolve();
              } catch (error) {
                console.error('Error en el fallback del cambio de pestaña:', error);
                reject(error);
              }
            });
          } catch (error) {
            console.error('Error en el timeout de seguridad:', error);
            reject(error);
          }
        }, 300);
        
        channel.port1.onmessage = () => {
          clearTimeout(safetyTimeout); // Limpiar el timeout de seguridad
          // Ejecutar el cambio de pestaña con triple barrera para evitar violaciones:
          // 1. Promise.resolve para microtask queue
          // 2. requestAnimationFrame para sincronizar con el frame
          // 3. setTimeout para salir del ciclo actual
          Promise.resolve().then(() => {
            requestAnimationFrame(() => {
              try {
                changeTabFn(newIndex);
                
                // Esperar un poco antes de resolver para dar tiempo al DOM de actualizarse
                // y prevenir problemas de sincronización con los efectos de la UI
                setTimeout(() => {
                  resolve();
                }, 20);
              } catch (error) {
                console.error('Error durante el cambio de pestaña:', error);
                reject(error);
              }
            });
          });
        };
        
        // Enviar mensaje para programar el cambio
        channel.port2.postMessage(null);
      } catch (error) {
        reject(error);
      }
    });
  };
}
