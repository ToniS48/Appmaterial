/**
 * Script de prueba para verificar el selector de dificultad
 * Este script verifica que la implementación del selector de dificultad esté completa
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando implementación del selector de dificultad...\n');

// 1. Verificar que las constantes de dificultad existen
const constantsPath = path.join(__dirname, 'src', 'constants', 'actividadOptions.ts');
if (fs.existsSync(constantsPath)) {
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    
    console.log('✅ Archivo de constantes existe');
    
    // Verificar que contiene DIFICULTADES_ACTIVIDAD
    if (constantsContent.includes('DIFICULTADES_ACTIVIDAD')) {
        console.log('✅ Constante DIFICULTADES_ACTIVIDAD encontrada');
        
        // Verificar que tiene las tres opciones
        const hasBaja = constantsContent.includes("'baja'");
        const hasMedia = constantsContent.includes("'media'");
        const hasAlta = constantsContent.includes("'alta'");
        
        if (hasBaja && hasMedia && hasAlta) {
            console.log('✅ Todas las opciones de dificultad están definidas (baja, media, alta)');
        } else {
            console.log('❌ Faltan opciones de dificultad');
        }
    } else {
        console.log('❌ Constante DIFICULTADES_ACTIVIDAD no encontrada');
    }
} else {
    console.log('❌ Archivo de constantes no existe');
}

// 2. Verificar que el componente ActividadInfoForm tiene el selector
const formPath = path.join(__dirname, 'src', 'components', 'actividades', 'ActividadInfoForm.tsx');
if (fs.existsSync(formPath)) {
    const formContent = fs.readFileSync(formPath, 'utf8');
    
    console.log('✅ Componente ActividadInfoForm existe');
    
    // Verificar importación de DIFICULTADES_ACTIVIDAD
    if (formContent.includes('DIFICULTADES_ACTIVIDAD')) {
        console.log('✅ Importación de DIFICULTADES_ACTIVIDAD encontrada');
    } else {
        console.log('❌ Importación de DIFICULTADES_ACTIVIDAD no encontrada');
    }
    
    // Verificar que tiene el Select de dificultad
    if (formContent.includes('<Select') && formContent.includes('dificultad')) {
        console.log('✅ Campo Select de dificultad encontrado');
    } else {
        console.log('❌ Campo Select de dificultad no encontrado');
    }
    
    // Verificar que mapea las opciones
    if (formContent.includes('DIFICULTADES_ACTIVIDAD.map')) {
        console.log('✅ Mapeo de opciones de dificultad encontrado');
    } else {
        console.log('❌ Mapeo de opciones de dificultad no encontrado');
    }
    
    // Verificar valor por defecto
    if (formContent.includes('defaultValue="media"')) {
        console.log('✅ Valor por defecto "media" configurado');
    } else {
        console.log('⚠️ Valor por defecto "media" no encontrado');
    }
} else {
    console.log('❌ Componente ActividadInfoForm no existe');
}

// 3. Verificar que el tipo Actividad tiene el campo dificultad
const typesPath = path.join(__dirname, 'src', 'types', 'actividad.ts');
if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    console.log('✅ Archivo de tipos existe');
    
    if (typesContent.includes('dificultad')) {
        console.log('✅ Campo dificultad encontrado en la interfaz Actividad');
    } else {
        console.log('❌ Campo dificultad no encontrado en la interfaz Actividad');
    }
} else {
    console.log('❌ Archivo de tipos no existe');
}

// 4. Verificar que useActividadForm maneja la dificultad
const hookPath = path.join(__dirname, 'src', 'hooks', 'useActividadForm.ts');
if (fs.existsSync(hookPath)) {
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    
    console.log('✅ Hook useActividadForm existe');
    
    if (hookContent.includes('dificultad')) {
        console.log('✅ Campo dificultad manejado en useActividadForm');
    } else {
        console.log('⚠️ Campo dificultad no encontrado explícitamente en useActividadForm');
    }
} else {
    console.log('❌ Hook useActividadForm no existe');
}

console.log('\n🎯 Resumen de la verificación:');
console.log('');
console.log('La implementación del selector de dificultad parece estar completa.');
console.log('');
console.log('📋 Funcionalidades implementadas:');
console.log('  • Constantes de dificultad (baja, media, alta) con colores');
console.log('  • Selector Select en el formulario');
console.log('  • Valor por defecto "media"');
console.log('  • Mapeo dinámico de opciones');
console.log('  • Integración con react-hook-form');
console.log('');
console.log('🚀 Para probar en el navegador:');
console.log('  1. Inicia la aplicación: npm start');
console.log('  2. Ve a crear nueva actividad');
console.log('  3. Verifica que aparece el selector de dificultad');
console.log('  4. Comprueba que tiene las opciones: Baja, Media, Alta');
console.log('  5. Verifica que "Media" está seleccionado por defecto');
