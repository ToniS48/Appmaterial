/**
 * Script de diagnóstico para verificar el estado de usuarios en Firebase
 * Este script verifica discrepancias entre los datos en Firebase y lo que muestra la interfaz
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function diagnosticarUsuarios() {
  try {
    console.log('🔍 Iniciando diagnóstico de usuarios en Firebase...\n');
    
    // Obtener todos los usuarios
    const usuariosSnapshot = await db.collection('usuarios').get();
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Total de usuarios encontrados: ${usuarios.length}\n`);
    
    // Analizar cada usuario
    let usuariosSinEstadoAprobacion = 0;
    let usuariosSinEstadoActividad = 0;
    let usuariosConActivoTrue = 0;
    let usuariosActivosSegunNuevosEstados = 0;
    let problemasEncontrados = [];
    
    for (const usuario of usuarios) {
      const problemas = [];
      
      // Verificar campos de estado
      if (!usuario.estadoAprobacion) {
        usuariosSinEstadoAprobacion++;
        problemas.push('Sin estadoAprobacion');
      }
      
      if (!usuario.estadoActividad) {
        usuariosSinEstadoActividad++;
        problemas.push('Sin estadoActividad');
      }
      
      // Verificar campo activo legacy
      if (usuario.activo === true) {
        usuariosConActivoTrue++;
      }
      
      // Verificar si debería estar activo según nuevos estados
      const deberiaEstarActivo = usuario.estadoAprobacion === 'aprobado' && usuario.estadoActividad === 'activo';
      if (deberiaEstarActivo) {
        usuariosActivosSegunNuevosEstados++;
      }
      
      // Detectar inconsistencias
      if (usuario.activo === true && !deberiaEstarActivo) {
        problemas.push('Tiene activo=true pero no cumple condiciones nuevas');
      }
      
      if (usuario.activo === false && deberiaEstarActivo) {
        problemas.push('Debería estar activo según nuevos estados pero activo=false');
      }
      
      if (problemas.length > 0) {
        problemasEncontrados.push({
          email: usuario.email,
          nombre: `${usuario.nombre} ${usuario.apellidos}`,
          estadoAprobacion: usuario.estadoAprobacion || 'no definido',
          estadoActividad: usuario.estadoActividad || 'no definido',
          activo: usuario.activo !== undefined ? usuario.activo : 'no definido',
          problemas
        });
      }
    }
    
    // Mostrar resumen
    console.log('📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`• Usuarios sin estadoAprobacion: ${usuariosSinEstadoAprobacion}`);
    console.log(`• Usuarios sin estadoActividad: ${usuariosSinEstadoActividad}`);
    console.log(`• Usuarios con activo=true: ${usuariosConActivoTrue}`);
    console.log(`• Usuarios activos según nuevos estados: ${usuariosActivosSegunNuevosEstados}`);
    console.log(`• Usuarios con problemas: ${problemasEncontrados.length}\n`);
    
    if (problemasEncontrados.length > 0) {
      console.log('⚠️ USUARIOS CON PROBLEMAS:');
      problemasEncontrados.forEach((usuario, index) => {
        console.log(`\n${index + 1}. ${usuario.nombre} (${usuario.email})`);
        console.log(`   • Estado aprobación: ${usuario.estadoAprobacion}`);
        console.log(`   • Estado actividad: ${usuario.estadoActividad}`);
        console.log(`   • Campo activo: ${usuario.activo}`);
        console.log(`   • Problemas: ${usuario.problemas.join(', ')}`);
      });
    }
    
    // Verificar algunos usuarios específicos si existen
    console.log('\n🔍 VERIFICACIÓN DETALLADA DE MUESTRA:');
    const muestraUsuarios = usuarios.slice(0, 3);
    for (const usuario of muestraUsuarios) {
      console.log(`\n📧 Usuario: ${usuario.email}`);
      console.log(`   • UID: ${usuario.uid}`);
      console.log(`   • estadoAprobacion: ${usuario.estadoAprobacion || 'no definido'}`);
      console.log(`   • estadoActividad: ${usuario.estadoActividad || 'no definido'}`);
      console.log(`   • activo (legacy): ${usuario.activo !== undefined ? usuario.activo : 'no definido'}`);
      
      const funcionLegacy = usuario.estadoAprobacion === 'aprobado' && usuario.estadoActividad === 'activo';
      console.log(`   • getEstadoActivoLegacy calculado: ${funcionLegacy}`);
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnosticarUsuarios()
  .then(() => {
    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
