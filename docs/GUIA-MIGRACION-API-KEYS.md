# Guía de Migración de API Keys a Sistema Seguro

## ¿Qué es esto?

El sistema de API Keys de Material App ha sido mejorado para mayor seguridad. Las claves de API (como la de AEMET) ahora se almacenan de forma más segura utilizando encriptación basada en el usuario autenticado.

## ¿Necesito hacer algo?

**SÍ**, si tienes configurada una API key de AEMET, necesitas migrarla al nuevo sistema seguro.

## ¿Cómo migrar mis API Keys?

### Opción 1: Desde la Interfaz (Próximamente)
La interfaz de usuario incluirá controles para migrar automáticamente.

### Opción 2: Desde la Consola del Navegador (Disponible Ahora)

#### Pasos detallados:

1. **Abrir Material App** en tu navegador
2. **Iniciar sesión** con tu cuenta de administrador
3. **Abrir la consola del navegador** (F12 → pestaña "Console")
4. **Copiar y pegar** el siguiente código:

```javascript
// Pegar este código en la consola
/**
 * Script de migración de API Keys a sistema seguro
 */

// Función para limpiar y preparar la consola
window.limpiarConsola = () => {
  console.clear();
  console.log('🚀 MIGRACIÓN DE API KEYS - MATERIAL APP');
  console.log('=====================================\n');
  
  if (typeof window.SecureEncryption === 'undefined') {
    console.error('❌ ERROR: Funciones no disponibles');
    console.log('💡 Asegúrate de que la app haya cargado completamente');
    return false;
  }
  
  console.log('✅ Sistema listo para migración');
  console.log('\n📋 COMANDOS DISPONIBLES:');
  console.log('• await migrarAhora() - Ejecutar migración');
  console.log('• await verificarSistema() - Diagnóstico completo');
  console.log('• limpiarConsola() - Limpiar pantalla\n');
  return true;
};

// Función para migrar
window.migrarAhora = async () => {
  if (typeof window.migrarApiKeysSeguras === 'function') {
    await window.migrarApiKeysSeguras();
  } else {
    console.error('❌ Función de migración no disponible');
  }
};

// Función para verificar
window.verificarSistema = async () => {
  if (typeof window.diagnosticarSistemaSeguro === 'function') {
    await window.diagnosticarSistemaSeguro();
  } else {
    console.error('❌ Función de diagnóstico no disponible');
  }
};

// Inicializar
limpiarConsola();
```

5. **Presionar Enter** para ejecutar el código
6. **Ejecutar la migración** escribiendo:
   ```javascript
   await migrarAhora()
   ```

#### ¿Qué verás durante la migración?

```
🔄 MIGRACIÓN: API Keys a Sistema Seguro
=====================================

1️⃣ VERIFICANDO DEPENDENCIAS...
✅ Firebase disponible como módulo
✅ Usuario autenticado: tu-email@dominio.com

2️⃣ VERIFICANDO API KEYS EXISTENTES...
✅ Configuración de APIs encontrada
📋 API key de AEMET encontrada

3️⃣ MIGRANDO AL FORMATO SEGURO...
✅ CryptoJS cargado correctamente
✅ API key desencriptada con método antiguo
✅ API key encriptada con sistema seguro

4️⃣ VERIFICANDO MIGRACIÓN...
✅ Verificación exitosa - La API key se può leer correctamente
✅ Migración completada exitosamente
```

## Verificar que la migración funcionó

Después de la migración, puedes verificar que todo está correcto:

1. **Ir a Configuración → APIs** en Material App
2. **Verificar** que la API key de AEMET aparece como "Configurada"
3. **Probar** el servicio meteorológico para confirmar que funciona

## Solución de Problemas

### "Usuario no autenticado"
- Asegúrate de haber iniciado sesión
- Espera unos segundos después de iniciar sesión
- Vuelve a intentar la migración

### "Funciones no disponibles"
- Recarga la página completamente
- Espera a que la app cargue totalmente
- Vuelve a pegar el código en la consola

### "Error desencriptando"
- Esto es normal si la key ya estaba en texto plano
- La migración continuará automáticamente
- Verifica el resultado final

### "API key no válida o inaccesible"
- Puede que necesites volver a configurar la API key
- Ve a Configuración → APIs y vuelve a introducir la key

## ¿Es seguro?

**SÍ**. El nuevo sistema:

- ❌ **NO expone** claves de encriptación en el frontend
- ✅ **Genera claves** únicas para cada usuario
- ✅ **Verifica integridad** de los datos
- ✅ **Compatible** con Firebase Spark (gratis)
- ✅ **Transparente** para el usuario final

## Contacto

Si tienes problemas con la migración, contacta al administrador del sistema o revisa los logs de la consola para más detalles sobre cualquier error.
