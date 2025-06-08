#!/usr/bin/env node

/**
 * Script de verificación para confirmar que el fix de tipo/subtipo funciona correctamente
 * Ejecutar con: node verify-fix.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileContains(filePath, searchText) {
  if (!checkFileExists(filePath)) {
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(searchText);
}

async function verifyFix() {
  log('\n🔍 Verificando solución del problema tipo/subtipo...', COLORS.BLUE);
  
  const checks = [
    {
      name: 'InfoEditor.tsx existe',
      test: () => checkFileExists('src/components/actividades/InfoEditor.tsx'),
      description: 'El archivo InfoEditor.tsx debe existir'
    },
    {
      name: 'ActividadFormPage.tsx existe',
      test: () => checkFileExists('src/pages/actividades/ActividadFormPage.tsx'),
      description: 'El archivo ActividadFormPage.tsx debe existir'
    },
    {
      name: 'InfoEditor tiene useEffect de sincronización',
      test: () => checkFileContains('src/components/actividades/InfoEditor.tsx', 'setSelectedTipos(actividad.tipo || [])'),
      description: 'InfoEditor debe tener useEffect para sincronizar tipos'
    },
    {
      name: 'InfoEditor tiene useEffect de reset',
      test: () => checkFileContains('src/components/actividades/InfoEditor.tsx', 'reset({'),
      description: 'InfoEditor debe tener useEffect para resetear formulario'
    },
    {
      name: 'ActividadFormPage no tiene declaraciones duplicadas',
      test: () => {
        const content = fs.readFileSync('src/pages/actividades/ActividadFormPage.tsx', 'utf8');
        const activdadMatches = (content.match(/const \[actividad, setActividad\]/g) || []).length;
        return activdadMatches === 1;
      },
      description: 'ActividadFormPage no debe tener variables duplicadas'
    },
    {
      name: 'Documentación de solución existe',
      test: () => checkFileExists('SOLUCION_TIPO_SUBTIPO.md'),
      description: 'Debe existir documentación de la solución'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      if (check.test()) {
        log(`✅ ${check.name}`, COLORS.GREEN);
        passed++;
      } else {
        log(`❌ ${check.name}`, COLORS.RED);
        log(`   ${check.description}`, COLORS.YELLOW);
        failed++;
      }
    } catch (error) {
      log(`❌ ${check.name} (Error: ${error.message})`, COLORS.RED);
      failed++;
    }
  }

  log(`\n📊 Resultados:`, COLORS.BLUE);
  log(`✅ Pasadas: ${passed}`, COLORS.GREEN);
  if (failed > 0) {
    log(`❌ Fallidas: ${failed}`, COLORS.RED);
  }

  if (failed === 0) {
    log('\n🎉 ¡Todas las verificaciones pasaron! El fix está correctamente implementado.', COLORS.GREEN);
    return true;
  } else {
    log('\n⚠️ Algunas verificaciones fallaron. Revise los archivos mencionados.', COLORS.YELLOW);
    return false;
  }
}

// Ejecutar verificación
verifyFix().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`Error durante verificación: ${error.message}`, COLORS.RED);
  process.exit(1);
});
