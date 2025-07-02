import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { completeUsuario } from './firestore/EntityDefaults';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { Usuario, RolUsuario } from '../types/usuario';
import { EstadoAprobacion, EstadoActividad } from '../types/usuarioHistorial';
import { getEstadoActivoLegacy } from '../utils/migracionUsuarios';
import { handleFirebaseError } from '../utils/errorHandling';
import { checkEmailAvailability } from '../utils/validationUtils';
import { enviarNotificacionMasiva } from './notificacionService';

// Función de registro de usuario
export const registrarUsuario = async (userData: {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  rol: RolUsuario;
  estadoAprobacion: EstadoAprobacion;
  estadoActividad: EstadoActividad;
}): Promise<void> => {
  try {
    // Verificar disponibilidad de email
    const isEmailAvailable = await checkEmailAvailability(userData.email);
    if (!isEmailAvailable) {
      throw new Error('Este correo electrónico ya está registrado');
    }
    
    // Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const { user } = userCredential;
    
    try {
      // Crear documento de usuario en Firestore
      const usuarioRef = doc(db, 'usuarios', user.uid);
      
      // Datos base del usuario
      const userDataBase = {
        uid: user.uid,
        email: userData.email,
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        rol: userData.rol,
        estadoAprobacion: userData.estadoAprobacion,
        estadoActividad: userData.estadoActividad,
        pendienteVerificacion: true,
        eliminado: false,
        fechaCreacion: Timestamp.now(),
        fechaRegistro: Timestamp.now(),
        ultimaConexion: Timestamp.now()
      };
      
      // Completar con campos por defecto
      const userDataFirestore = completeUsuario(userDataBase);
      
      await setDoc(usuarioRef, userDataFirestore);
      
      // Actualizar el displayName en Authentication
      await updateProfile(user, {
        displayName: `${userData.nombre} ${userData.apellidos}`
      });
      
      // Enviar email de verificación
      await sendEmailVerification(user);

      // Enviar notificación a administradores y vocales
      await enviarNotificacionNuevoUsuario(userDataFirestore);
      
    } catch (firestoreError) {
      // Rollback: Eliminar el usuario creado en Authentication
      try {
        await user.delete();
        console.warn('Usuario eliminado durante rollback debido a error en Firestore:', firestoreError);
      } catch (deleteError) {
        console.error('Error al realizar rollback del usuario:', deleteError);
      }
      throw firestoreError;
    }
  } catch (error) {
    handleFirebaseError(error, 'Error al registrar usuario');
    throw error;
  }
};

// Obtener un usuario por su ID
export const obtenerUsuarioPorId = async (uid: string): Promise<Usuario | null> => {
  try {
    const docRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Usuario;
    } else {
      return null;
    }
  } catch (error) {
    handleFirebaseError(error, 'Error al obtener usuario');
    throw error;
  }
};

// Función para actualizar último acceso
export const actualizarUltimoAcceso = async (uid: string): Promise<void> => {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    await updateDoc(usuarioRef, {
      ultimaConexion: Timestamp.now()
    });
  } catch (error) {
    console.error('Error al actualizar última conexión:', error);
    // No lanzamos error para no interrumpir el login
  }
};

// Obtener o crear usuario (para contexto de autenticación)
export const obtenerOCrearUsuario = async (uid: string, email: string): Promise<Usuario> => {
  try {
    const usuario = await obtenerUsuarioPorId(uid);
    
    if (usuario) {
      // Verificar si el usuario fue marcado como eliminado
      if (usuario.eliminado === true) {
        throw new Error('Esta cuenta ha sido eliminada. Contacta con un administrador.');
      }
      return usuario;
    } else {
      // Si no existe el perfil, crear uno básico
      console.log('Creando perfil básico para usuario:', uid);
      const ahora = Timestamp.now();
      
      // Datos base del usuario
      const usuarioBase = {
        uid,
        email,
        nombre: email.split('@')[0],
        apellidos: '',
        rol: 'invitado' as RolUsuario,
        estadoAprobacion: EstadoAprobacion.PENDIENTE,
        estadoActividad: EstadoActividad.INACTIVO,
        pendienteVerificacion: true,
        eliminado: false,
        fechaCreacion: ahora,
        fechaRegistro: ahora,
        ultimaConexion: ahora
      };
      
      // Completar con campos por defecto
      const nuevoUsuario = completeUsuario(usuarioBase);
      
      await setDoc(doc(db, 'usuarios', uid), nuevoUsuario);
      
      // Enviar notificación a administradores y vocales
      await enviarNotificacionNuevoUsuario(nuevoUsuario);
      
      return nuevoUsuario;
    }
  } catch (error) {
    console.error('Error obteniendo o creando usuario:', error);
    throw error;
  }
};

// Actualizar usuario existente
export const actualizarUsuario = async (uid: string, updates: {
  nombre?: string;
  apellidos?: string;
  rol?: RolUsuario;
  activo?: boolean;
  estadoAprobacion?: EstadoAprobacion;
  estadoActividad?: EstadoActividad;
  telefono?: string;
  telefonosEmergencia?: string[];
  observaciones?: string;
  fechaCreacion?: any;
  fechaRegistro?: any;
  eliminado?: boolean;
  pendienteVerificacion?: boolean;
}, eliminarCampos?: string[]): Promise<void> => {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    
    // Preparar los datos de actualización
    const updateData: any = {
      ...updates,
      fechaActualizacion: Timestamp.now()
    };
    
    // Si hay campos para eliminar, usar deleteField
    if (eliminarCampos && eliminarCampos.length > 0) {
      const { deleteField } = await import('firebase/firestore');
      for (const campo of eliminarCampos) {
        updateData[campo] = deleteField();
      }
    }
    
    await updateDoc(usuarioRef, updateData);
  } catch (error) {
    handleFirebaseError(error, 'Error al actualizar usuario');
    throw error;
  }
};

// Listar todos los usuarios
export const listarUsuarios = async (): Promise<Usuario[]> => {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    return snapshot.docs.map(doc => doc.data() as Usuario);
  } catch (error) {
    handleFirebaseError(error, 'Error al listar usuarios');
    throw error;
  }
};

// Crear un nuevo usuario (sin autenticación)
export const crearUsuario = async (userData: {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  rol: RolUsuario;
  estadoAprobacion: EstadoAprobacion;
  estadoActividad: EstadoActividad;
  telefono?: string;
  telefonosEmergencia?: string[];
  observaciones?: string;
}): Promise<Usuario> => {
  try {
    // Verificar disponibilidad de email
    const isEmailAvailable = await checkEmailAvailability(userData.email);
    if (!isEmailAvailable) {
      throw new Error('Este correo electrónico ya está registrado');
    }
    
    // Guardar el usuario actual antes de cualquier operación
    const currentAuth = auth.currentUser;
    
    // Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Restaurar inmediatamente el usuario original para evitar problemas
    if (currentAuth) {
      await auth.updateCurrentUser(currentAuth);
    } else {
      // Si no había usuario autenticado, cerrar sesión del usuario recién creado
      await auth.signOut();
    }
    
    const { user } = userCredential;
    
    // Crear documento de usuario en Firestore
    const usuarioRef = doc(db, 'usuarios', user.uid);
    
    // Datos base del usuario
    const usuarioBase: any = {
      uid: user.uid,
      email: userData.email,
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      rol: userData.rol,
      estadoAprobacion: userData.estadoAprobacion,
      estadoActividad: userData.estadoActividad,
      pendienteVerificacion: true,
      eliminado: false,
      fechaCreacion: Timestamp.now(),
      fechaRegistro: Timestamp.now(),
      ultimaConexion: Timestamp.now()
    };
    
    // Añadir campos opcionales
    if (userData.telefono) usuarioBase.telefono = userData.telefono;
    if (userData.telefonosEmergencia) usuarioBase.telefonosEmergencia = userData.telefonosEmergencia;
    if (userData.observaciones) usuarioBase.observaciones = userData.observaciones;
    
    // Completar con campos por defecto
    const nuevoUsuario = completeUsuario(usuarioBase);
    
    await setDoc(usuarioRef, nuevoUsuario);
    
    // Actualizar el displayName en Authentication
    await updateProfile(user, {
      displayName: `${userData.nombre} ${userData.apellidos}`
    });
    
    // Enviar email de verificación
    await sendEmailVerification(user);

    // Enviar notificación a administradores y vocales
    await enviarNotificacionNuevoUsuario(nuevoUsuario);
    
    return nuevoUsuario;
  } catch (error) {
    handleFirebaseError(error, 'Error al crear usuario');
    throw error;
  }
};

// Eliminar usuario
export const eliminarUsuario = async (uid: string): Promise<void> => {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(usuarioRef);
    
    if (!docSnap.exists()) {
      throw new Error('El usuario no existe');
    }
    
    // Marcar como eliminado
    await updateDoc(usuarioRef, {
      activo: false,
      eliminado: true,
      fechaEliminacion: Timestamp.now()
    });
  } catch (error) {
    handleFirebaseError(error, 'Error al marcar usuario como eliminado');
    throw error;
  }
};

// Listar usuarios por IDs
export const listarUsuariosPorIds = async (userIds: string[]): Promise<Usuario[]> => {
  try {
    if (!userIds.length) return [];
    
    const usuarios: Usuario[] = [];
    
    // Obtener usuarios de a uno por vez para evitar problemas con Firestore
    for (const userId of userIds) {
      const usuario = await obtenerUsuarioPorId(userId);
      if (usuario) {
        usuarios.push(usuario);
      }
    }
    
    return usuarios;
  } catch (error) {
    handleFirebaseError(error, 'Error al listar usuarios por IDs');
    throw error;
  }
};

// Obtener estadísticas de usuarios
export const obtenerEstadisticasUsuarios = async (): Promise<{
  activos: number;
  inactivos: number;
  pendientes: number;
}> => {
  try {
    const usuarios = await listarUsuarios();    return {
      activos: usuarios.filter(u => getEstadoActivoLegacy(u)).length,
      inactivos: usuarios.filter(u => !getEstadoActivoLegacy(u)).length,
      pendientes: usuarios.filter(u => u.pendienteVerificacion).length,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    throw error;
  }
};

// Función para notificar a admins y vocales sobre un nuevo usuario
async function enviarNotificacionNuevoUsuario(usuario: Usuario): Promise<void> {
  try {
    // Obtener administradores y vocales
    const usuarios = await listarUsuarios();
    const adminsYVocales = usuarios.filter((u: Usuario) => u.rol === 'admin' || u.rol === 'vocal');
    
    if (adminsYVocales.length > 0) {
      const mensaje = `Nuevo usuario registrado: ${usuario.nombre} ${usuario.apellidos} (${usuario.email})`;
        await enviarNotificacionMasiva(
        adminsYVocales.map((u: Usuario) => u.uid),
        'sistema',
        mensaje,
        usuario.uid,
        'usuario',
        '/admin/usuarios'
      );
    }
  } catch (error) {
    console.error('Error al enviar notificaciones de nuevo usuario:', error);
    // No lanzamos error para no interrumpir el registro de usuario
  }
}
