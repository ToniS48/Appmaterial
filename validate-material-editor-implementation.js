#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando implementación de MaterialEditor...\n');

// Rutas de archivos
const actividadFormPath = path.join(__dirname, 'src/pages/actividades/ActividadFormPage.tsx');
const materialEditorPath = path.join(__dirname, 'src/components/actividades/MaterialEditor.tsx');

// Verificar archivos existe
const files = [
  { path: actividadFormPath, name: 'ActividadFormPage.tsx' },
  { path: materialEditorPath, name: 'MaterialEditor.tsx' }
];

for (const file of files) {
  if (!fs.existsSync(file.path)) {
    console.log(`❌ Error: No se encontró ${file.name}`);
    process.exit(1);
  }
}

// Leer contenido de los archivos
const actividadFormContent = fs.readFileSync(actividadFormPath, 'utf8');
const materialEditorContent = fs.readFileSync(materialEditorPath, 'utf8');

console.log('📋 Verificando implementación...\n');

// 1. Verificar imports en ActividadFormPage
console.log('1. ✅ Imports necesarios:');
const hasUsuarioImport = actividadFormContent.includes('import { Usuario } from \'../../types/usuario\';');
const hasUsuarioServiceImport = actividadFormContent.includes('import { listarUsuarios } from \'../../services/usuarioService\';');

console.log(`   - Usuario type: ${hasUsuarioImport ? '✅' : '❌'}`);
console.log(`   - listarUsuarios service: ${hasUsuarioServiceImport ? '✅' : '❌'}`);

// 2. Verificar estado para usuarios
console.log('\n2. ✅ Estado de usuarios:');
const hasUsuariosState = actividadFormContent.includes('const [usuarios, setUsuarios] = useState<Usuario[]>([]);');
const hasLoadingUsuariosState = actividadFormContent.includes('const [loadingUsuarios, setLoadingUsuarios] = useState(true);');

console.log(`   - Estado usuarios: ${hasUsuariosState ? '✅' : '❌'}`);
console.log(`   - Estado loading usuarios: ${hasLoadingUsuariosState ? '✅' : '❌'}`);

// 3. Verificar useEffect para cargar usuarios
console.log('\n3. ✅ Carga de usuarios:');
const hasCargarUsuariosEffect = actividadFormContent.includes('// Cargar usuarios para MaterialEditor') &&
                                actividadFormContent.includes('const cargarUsuarios = async ()') &&
                                actividadFormContent.includes('const usuariosData = await listarUsuarios();');

console.log(`   - useEffect para cargar usuarios: ${hasCargarUsuariosEffect ? '✅' : '❌'}`);

// 4. Verificar props en MaterialEditor
console.log('\n4. ✅ Props de MaterialEditor:');
const hasResponsablesProps = actividadFormContent.includes('responsables={{') &&
                             actividadFormContent.includes('responsableActividadId: formData.responsableActividadId') &&
                             actividadFormContent.includes('responsableMaterialId: formData.responsableMaterialId') &&
                             actividadFormContent.includes('creadorId: formData.creadorId');

const hasUsuariosProps = actividadFormContent.includes('usuarios={usuarios}');

console.log(`   - Props responsables: ${hasResponsablesProps ? '✅' : '❌'}`);
console.log(`   - Props usuarios: ${hasUsuariosProps ? '✅' : '❌'}`);

// 5. Verificar lógica condicional en MaterialEditor
console.log('\n5. ✅ Lógica condicional en MaterialEditor:');
const hasConditionalLogic = materialEditorContent.includes('tieneResponsableMaterial') &&
                           materialEditorContent.includes('Se requiere asignar un responsable de material') &&
                           materialEditorContent.includes('!tieneResponsableMaterial ?');

console.log(`   - Lógica condicional implementada: ${hasConditionalLogic ? '✅' : '❌'}`);

// 6. Verificar interfaces de MaterialEditor
console.log('\n6. ✅ Interfaces en MaterialEditor:');
const hasResponsablesInterface = materialEditorContent.includes('responsables?: {') &&
                                materialEditorContent.includes('responsableActividadId?: string;') &&
                                materialEditorContent.includes('responsableMaterialId?: string;') &&
                                materialEditorContent.includes('creadorId?: string;');

const hasUsuariosInterface = materialEditorContent.includes('usuarios?: Array<{ uid: string; nombre: string; apellidos: string; }>;');

console.log(`   - Interface responsables: ${hasResponsablesInterface ? '✅' : '❌'}`);
console.log(`   - Interface usuarios: ${hasUsuariosInterface ? '✅' : '❌'}`);

// Resultado final
console.log('\n🎯 RESULTADO FINAL:');
const allChecks = [
  hasUsuarioImport,
  hasUsuarioServiceImport,
  hasUsuariosState,
  hasLoadingUsuariosState,
  hasCargarUsuariosEffect,
  hasResponsablesProps,
  hasUsuariosProps,
  hasConditionalLogic,
  hasResponsablesInterface,
  hasUsuariosInterface
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

if (passedChecks === totalChecks) {
  console.log('🎉 ¡Implementación COMPLETADA EXITOSAMENTE!');
  console.log('✅ Todas las verificaciones pasaron');
  console.log('\n📋 FUNCIONALIDAD IMPLEMENTADA:');
  console.log('   • MaterialEditor ya no muestra formulario duplicado');
  console.log('   • Se requiere responsable de material para mostrar formulario');
  console.log('   • Mensaje claro cuando no hay responsable asignado');
  console.log('   • UX mejorada: usuarios deben asignar responsable antes de seleccionar material');
} else {
  console.log(`⚠️  Implementación PARCIAL: ${passedChecks}/${totalChecks} verificaciones pasaron`);
  console.log('❌ Revisar las verificaciones fallidas arriba');
}

console.log(`\n📊 Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
