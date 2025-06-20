# 🚀 GUÍA COMPLETA: GENERACIÓN DE DATOS HISTÓRICOS PARA DASHBOARD

## ✅ ESTADO ACTUAL DEL PROYECTO

### Componentes Reparados y Optimizados:
- ✅ **MaterialSeguimientoDashboard.tsx** - Dashboard optimizado con gráficas activadas
- ✅ **MaterialHistorialRepository.ts** - Repositorio reparado y funcional
- ✅ **MaterialHistorialService.ts** - Servicio robusto con ordenamiento manual
- ✅ **generar-datos-terminal.js** - Script de generación corregido (sin errores de sintaxis)
- ✅ **verificador-consola-navegador.js** - Script para navegador funcional

### Dependencias Verificadas:
- ✅ Firebase Admin SDK instalado
- ✅ Chart.js y react-chartjs-2 instalados
- ✅ Firebase CLI configurado y autenticado
- ✅ Proyecto 'fichamaterial' activo

---

## 🎯 MÉTODOS PARA GENERAR DATOS HISTÓRICOS

### MÉTODO 1: GENERACIÓN DESDE NAVEGADOR (RECOMENDADO)

#### Paso 1: Ejecutar la aplicación
```bash
npm start
```

#### Paso 2: Cargar el servicio
- Ir a: http://localhost:3000
- **IMPORTANTE:** Navegar a la pestaña "Seguimiento de Materiales"
- Esto carga y expone el MaterialHistorialService globalmente

#### Paso 3: Ejecutar script de generación
- Abrir DevTools (F12)
- Ir a la pestaña "Console"
- Copiar y pegar este código completo:

```javascript
// GENERADOR DEFINITIVO - Copia TODO este código
(async function() {
  console.log('🚀 Generando datos históricos...');
  
  if (!window.materialHistorialService) {
    console.log('❌ Servicio no disponible. Ve a "Seguimiento de Materiales" primero');
    return;
  }
  
  const service = window.materialHistorialService;
  const materiales = [
    { id: 'MAT001', nombre: 'Cemento Portland' },
    { id: 'MAT002', nombre: 'Acero Corrugado' },
    { id: 'MAT003', nombre: 'Ladrillo Común' },
    { id: 'MAT004', nombre: 'Pintura Acrílica' },
    { id: 'MAT005', nombre: 'Tubo PVC' }
  ];
  
  const tipos = ['mantenimiento', 'reparacion', 'inspeccion', 'reemplazo'];
  let insertados = 0;
  
  for (let i = 0; i < 50; i++) {
    const material = materiales[Math.floor(Math.random() * materiales.length)];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 365));
    
    try {
      await service.registrarEvento({
        materialId: material.id,
        nombreMaterial: material.nombre,
        tipoEvento: tipo,
        descripcion: `${tipo} de ${material.nombre} - Evento ${i + 1}`,
        fecha: fecha,
        responsable: 'Sistema Automático',
        costoAsociado: Math.floor(Math.random() * 1000),
        estado: 'completado'
      });
      insertados++;
      if (insertados % 10 === 0) console.log(`✅ ${insertados} eventos insertados`);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  console.log(`🎉 COMPLETADO: ${insertados} eventos generados`);
  console.log('🔄 Recarga la página para ver los datos');
})();
```

#### Paso 4: Verificar en el dashboard
- Los datos se insertan usando el servicio real
- Recargar la página (Ctrl+F5) para ver cambios
- Ir a la pestaña "Seguimiento de Materiales"
- Las gráficas y métricas deberían mostrar datos inmediatamente

---

### MÉTODO 2: GENERACIÓN DESDE TERMINAL

#### Configuración de Firebase Admin (requerido una sola vez):

##### Opción A: Service Account Key
```bash
# 1. Ir a Firebase Console: https://console.firebase.google.com/
# 2. Seleccionar proyecto "fichamaterial"
# 3. Ir a "Configuración del proyecto" > "Cuentas de servicio"
# 4. Hacer clic en "Generar nueva clave privada"
# 5. Descargar el archivo JSON
# 6. Guardar como: functions/service-account-key.json
```

##### Opción B: Variable de entorno
```powershell
# PowerShell:
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\completa\al\archivo.json"

# CMD:
set GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\completa\al\archivo.json
```

#### Ejecutar script:
```bash
node scripts/generar-datos-terminal.js
```

---

## 🔧 VERIFICACIÓN Y DIAGNÓSTICO

### Verificar configuración de Firebase:
```bash
node scripts/configurar-firebase-admin.js
```

### Verificar datos desde navegador:
```bash
# 1. Abrir http://localhost:3000
# 2. Abrir DevTools > Console
# 3. Ejecutar:
window.firebase.firestore().collection('material_historial').get().then(snapshot => {
  console.log(`Total de documentos: ${snapshot.size}`);
  snapshot.docs.slice(0, 3).forEach(doc => console.log(doc.data()));
});
```

### Limpiar datos (si necesario):
```javascript
// EN CONSOLA DEL NAVEGADOR:
const db = window.firebase.firestore();
const batch = db.batch();
const snapshot = await db.collection('material_historial').get();
snapshot.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();
console.log('Datos eliminados');
```

---

## 🎨 COMPONENTES DEL DASHBOARD

### Gráficas activadas:
- ✅ **Eventos por Tipo** (Chart.js Bar)
- ✅ **Tendencia Temporal** (Chart.js Line)
- ✅ **Distribución por Gravedad** (Chart.js Doughnut)

### Métricas mostradas:
- ✅ Total de eventos
- ✅ Materiales únicos
- ✅ Costo total asociado
- ✅ Eventos completados/pendientes

---

## 📁 ARCHIVOS PRINCIPALES

```
src/components/material/MaterialSeguimientoDashboard.tsx  # Dashboard principal
src/services/domain/MaterialHistorialService.ts         # Servicio de datos
src/repositories/MaterialHistorialRepository.ts         # Repositorio reparado
scripts/generar-datos-terminal.js                      # Generador para terminal
scripts/verificador-consola-navegador.js               # Generador para navegador
scripts/configurar-firebase-admin.js                   # Configurador de Firebase
```

---

## ⚠️ TROUBLESHOOTING

### Si no aparecen datos en el dashboard:
1. ✅ Verificar que la aplicación esté corriendo: `npm start`
2. ✅ Generar datos usando el método de navegador (más confiable)
3. ✅ Recargar la página después de generar datos
4. ✅ Verificar la consola del navegador por errores

### Si el script de terminal falla:
1. ✅ Verificar autenticación: `firebase login`
2. ✅ Verificar proyecto activo: `firebase use fichamaterial`
3. ✅ Configurar service account key o usar método de navegador

### Si las gráficas no aparecen:
1. ✅ Las gráficas ya están activadas en el código
2. ✅ Chart.js está instalado correctamente
3. ✅ Verificar que existan datos en Firestore

---

## 🎯 RESULTADO ESPERADO

Después de seguir esta guía:
- ✅ Dashboard mostrará gráficas con datos reales
- ✅ Métricas históricas estarán disponibles
- ✅ Navegación fluida entre pestañas
- ✅ Datos persistentes en Firestore

---

## 📞 PRÓXIMOS PASOS

1. **Ejecutar generación de datos** (Método 1 recomendado)
2. **Verificar dashboard** funcional
3. **Documentar proceso** para uso futuro
4. **Limpiar scripts** redundantes (opcional)

---

*Documento generado el: ${new Date().toLocaleString()}*
*Estado: LISTO PARA EJECUCIÓN*
