# 🔧 DIAGNÓSTICOS DE FIRESTORE

## Opción 1: Service Account para Scripts Node.js

### Crear credenciales de Firebase Admin SDK:

1. **Ve a Firebase Console:**
   - https://console.firebase.google.com/
   - Selecciona tu proyecto

2. **Configuración → Cuentas de servicio:**
   - Ve a "Configuración del proyecto" (⚙️)
   - Pestaña "Cuentas de servicio"
   - Haz clic en "Generar nueva clave privada"
   - Descarga el archivo JSON

3. **Configurar en el proyecto:**
   ```bash
   # Mover el archivo descargado a la raíz del proyecto
   mv ~/Downloads/tu-proyecto-xxxxx.json ./firebase-admin-key.json
   
   # O configurar variable de entorno
   echo "GOOGLE_APPLICATION_CREDENTIALS=./firebase-admin-key.json" >> .env
   ```

4. **Ejecutar scripts:**
   ```bash
   node scripts/diagnostico-documentos-desactualizados.js
   node scripts/diagnostico-colecciones-firestore.js
   ```

## Opción 2: Diagnósticos desde el navegador (RECOMENDADO)

### Usar herramientas web integradas:

1. **Ejecutar la aplicación:**
   ```bash
   npm start
   ```

2. **Abrir DevTools:**
   - F12 → Console

3. **Ejecutar diagnósticos:**
   ```javascript
   // Analizar documentos desactualizados en usuarios
   await window.diagnostics.analyzeOutdatedDocuments('usuarios', 20);
   
   // Analizar otra colección
   await window.diagnostics.analyzeOutdatedDocuments('material_deportivo', 15);
   
   // Comparar documentos específicos
   await window.diagnostics.compareDocuments('usuarios', ['doc_id_1', 'doc_id_2']);
   ```

### Ejemplo de uso para el problema actual:

```javascript
// En la consola del navegador:

// 1. Analizar la colección usuarios donde hay diferencias de 14 vs 16 campos
const resultado = await window.diagnostics.analyzeOutdatedDocuments('usuarios', 25);

// 2. Ver el resultado detallado
console.table(resultado.fieldCountStats);

// 3. Ver campos que faltan en algunos documentos
console.table(resultado.missingFields);

// 4. Ver documentos con menos campos
console.table(resultado.documentsWithFewerFields);
```

## Beneficios de cada opción:

### Service Account (Node.js):
✅ Acceso completo a todas las funciones administrativas
✅ Puede ejecutarse en scripts automatizados
✅ Mejor para operaciones masivas
❌ Requiere configuración adicional de credenciales

### Diagnósticos del navegador:
✅ No requiere credenciales adicionales
✅ Usa la conexión ya establecida
✅ Ejecución inmediata y visual
✅ Ideal para depuración y análisis
❌ Limitado por permisos de usuario
❌ No puede hacer operaciones administrativas masivas

## Para el problema actual:

**RECOMENDACIÓN:** Usar los diagnósticos del navegador para identificar rápidamente qué documentos tienen 14 vs 16 campos y qué campos específicos faltan.

Después, usar esa información para mejorar la función `analyzeDocumentNormalizationNeeds` en `FirestoreDynamicService.ts`.
