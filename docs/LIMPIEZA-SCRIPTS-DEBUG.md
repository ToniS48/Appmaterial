# 🧹 Scripts de Debug - Estado Limpio

## ✅ Scripts Eliminados
Se han eliminado todos los scripts de debug temporales que se crearon durante el proceso de diagnóstico del dashboard de materiales:

### Eliminados del directorio raíz:
- `verificacion-rapida.js` 
- `debug-diagnostico-historial.js`
- `debug-historial-navegador.js`
- `debug-historial-navegador-mejorado.js`
- `debug-material-test.js`
- `monitor-progreso.js`
- `crear-indices-material-historial.js`
- `verificacion-indices-rapida.js`
- `firestore.indexes.temp.json`

### Eliminados de tests/:
- `tests/debug/debug-prestamos-*.js` (8 archivos)
- `tests/debug/debug-material-*.js` (varios archivos)
- `tests/utils/verificar-*.js`
- `tests/utils/test-*.js`
- `tests/utils/testing-*.js`
- `tests/utils/monitor-*.js`
- `tests/utils/analisis-*.js`

## 📁 Scripts Conservados

### Directorio raíz:
- `debug-weather-status.js` - Debug del sistema meteorológico (útil)

### Carpeta scripts/:
- `scripts/generador-historial-robusto.js` - Generador principal para demos/tests
- `scripts/script-generar-historial-directo.js` - Generador alternativo
- `scripts/generar-historial-materiales.js` - Generador backend (Node.js)

### Carpeta tests/:
- `tests/debug/` - 35 scripts (reducido de 43)
- `tests/utils/` - 5 scripts (reducido significativamente)

## 🎯 Estado Final
- ✅ Directorio raíz limpio
- ✅ Scripts útiles organizados en `scripts/`
- ✅ Tests mantenidos solo los necesarios
- ✅ Documentación clara de ubicaciones

---
**Fecha de limpieza**: 2025-06-19  
**Contexto**: Post-resolución dashboard materiales (problema de índices Firestore)
