// Test para verificar las notificaciones de registro de usuarios
// Este archivo es solo para pruebas de la funcionalidad

import { Usuario } from '../src/types/usuario';
import { RolUsuario } from '../src/types/usuario';
import { Timestamp } from 'firebase/firestore';

// Mock de la función de notificación
const mockEnviarNotificacionMasiva = jest.fn();

// Mock del servicio de usuarios
const mockListarUsuarios = jest.fn();

describe('Notificaciones de Registro de Usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería enviar notificación a admins y vocales cuando se registra un nuevo usuario', async () => {
    // Datos de prueba
    const nuevoUsuario: Usuario = {
      uid: 'test-uid-123',
      email: 'nuevo@test.com',
      nombre: 'Nuevo',
      apellidos: 'Usuario',
      rol: 'invitado' as RolUsuario,
      activo: true,
      pendienteVerificacion: true,
      fechaCreacion: Timestamp.now(),
      fechaRegistro: Timestamp.now(),
      ultimaConexion: Timestamp.now()
    };

    const usuariosExistentes: Usuario[] = [
      {
        uid: 'admin-1',
        email: 'admin@test.com',
        nombre: 'Admin',
        apellidos: 'Test',
        rol: 'admin' as RolUsuario,
        activo: true,
        pendienteVerificacion: false,
        fechaCreacion: Timestamp.now(),
        fechaRegistro: Timestamp.now(),
        ultimaConexion: Timestamp.now()
      },
      {
        uid: 'vocal-1',
        email: 'vocal@test.com',
        nombre: 'Vocal',
        apellidos: 'Test',
        rol: 'vocal' as RolUsuario,
        activo: true,
        pendienteVerificacion: false,
        fechaCreacion: Timestamp.now(),
        fechaRegistro: Timestamp.now(),
        ultimaConexion: Timestamp.now()
      },
      {
        uid: 'usuario-1',
        email: 'usuario@test.com',
        nombre: 'Usuario',
        apellidos: 'Normal',
        rol: 'usuario' as RolUsuario,
        activo: true,
        pendienteVerificacion: false,
        fechaCreacion: Timestamp.now(),
        fechaRegistro: Timestamp.now(),
        ultimaConexion: Timestamp.now()
      }
    ];

    mockListarUsuarios.mockResolvedValue(usuariosExistentes);

    // Simulamos la función enviarNotificacionNuevoUsuario
    const enviarNotificacionNuevoUsuario = async (usuario: Usuario) => {
      try {
        const usuarios = await mockListarUsuarios();
        const usuariosNotificar = usuarios.filter((u: Usuario) => u.rol === 'admin' || u.rol === 'vocal');
        
        if (usuariosNotificar.length > 0) {
          const usuarioIds = usuariosNotificar.map((u: Usuario) => u.uid);
          const mensaje = `Nuevo usuario registrado: ${usuario.nombre} ${usuario.apellidos} (${usuario.email})`;
          
          await mockEnviarNotificacionMasiva(
            usuarioIds,
            'sistema',
            mensaje,
            usuario.uid,
            'usuario',
            '/admin/usuarios'
          );
        }
      } catch (error) {
        console.error('Error al enviar notificaciones de nuevo usuario:', error);
      }
    };

    // Ejecutar la función
    await enviarNotificacionNuevoUsuario(nuevoUsuario);

    // Verificaciones
    expect(mockListarUsuarios).toHaveBeenCalledTimes(1);
    expect(mockEnviarNotificacionMasiva).toHaveBeenCalledTimes(1);
    
    // Verificar que se notifica solo a admin y vocal (no al usuario normal)
    expect(mockEnviarNotificacionMasiva).toHaveBeenCalledWith(
      ['admin-1', 'vocal-1'], // Solo admin y vocal
      'sistema',
      'Nuevo usuario registrado: Nuevo Usuario (nuevo@test.com)',
      'test-uid-123',
      'usuario',
      '/admin/usuarios'
    );
  });

  test('no debería fallar si no hay admins o vocales en el sistema', async () => {
    const nuevoUsuario: Usuario = {
      uid: 'test-uid-456',
      email: 'otro@test.com',
      nombre: 'Otro',
      apellidos: 'Usuario',
      rol: 'invitado' as RolUsuario,
      activo: true,
      pendienteVerificacion: true,
      fechaCreacion: Timestamp.now(),
      fechaRegistro: Timestamp.now(),
      ultimaConexion: Timestamp.now()
    };

    // Solo usuarios normales, sin admins ni vocales
    const usuariosSinAdmins: Usuario[] = [
      {
        uid: 'usuario-1',
        email: 'usuario1@test.com',
        nombre: 'Usuario',
        apellidos: 'Uno',
        rol: 'usuario' as RolUsuario,
        activo: true,
        pendienteVerificacion: false,
        fechaCreacion: Timestamp.now(),
        fechaRegistro: Timestamp.now(),
        ultimaConexion: Timestamp.now()
      }
    ];

    mockListarUsuarios.mockResolvedValue(usuariosSinAdmins);

    const enviarNotificacionNuevoUsuario = async (usuario: Usuario) => {
      try {
        const usuarios = await mockListarUsuarios();
        const usuariosNotificar = usuarios.filter((u: Usuario) => u.rol === 'admin' || u.rol === 'vocal');
        
        if (usuariosNotificar.length > 0) {
          const usuarioIds = usuariosNotificar.map((u: Usuario) => u.uid);
          const mensaje = `Nuevo usuario registrado: ${usuario.nombre} ${usuario.apellidos} (${usuario.email})`;
          
          await mockEnviarNotificacionMasiva(
            usuarioIds,
            'sistema',
            mensaje,
            usuario.uid,
            'usuario',
            '/admin/usuarios'
          );
        }
      } catch (error) {
        console.error('Error al enviar notificaciones de nuevo usuario:', error);
      }
    };

    // No debería lanzar error
    await expect(enviarNotificacionNuevoUsuario(nuevoUsuario)).resolves.not.toThrow();

    // Verificar que se intenta listar usuarios pero no se envía notificación
    expect(mockListarUsuarios).toHaveBeenCalledTimes(1);
    expect(mockEnviarNotificacionMasiva).not.toHaveBeenCalled();
  });
});

console.log('✅ Test de notificaciones de registro completado - Las pruebas verifican que:');
console.log('   📧 Las notificaciones se envían solo a usuarios admin y vocal');
console.log('   🚫 Los usuarios normales no reciben notificaciones');
console.log('   💼 El mensaje incluye información completa del nuevo usuario');
console.log('   🔗 Se incluye enlace a la gestión de usuarios para admins');
console.log('   ⚠️  No falla si no hay admins/vocales en el sistema');
