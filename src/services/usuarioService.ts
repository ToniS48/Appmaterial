import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  updateDoc,
  arrayUnion,
  deleteDoc,
  Timestamp // Importar Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Usuario, RolUsuario } from '../types/usuario'; // Importar RolUsuario
import { handleFirebaseError } from '../utils/errorHandling';
import { checkEmailAvailability } from '../utils/validationUtils';
import messages from '../constants/messages';
import { enviarNotificacionMasiva } from './notificacionService'; // Importar enviarNotificacionMasiva

// Mejorar la función de registro de usuario
export const registrarUsuario = async (userData: {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  rol: RolUsuario;
  activo: boolean;
}): Promise<void> => {
  try {
    // Verificar disponibilidad de email con la función centralizada
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
      const userDataFirestore: Usuario = {
        uid: user.uid,
        email: userData.email,
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        rol: userData.rol || 'invitado',
        activo: userData.activo, // Usar el valor proporcionado (normalmente true)
        pendienteVerificacion: true, // Por defecto requiere verificación
        fechaCreacion: Timestamp.now(),
        fechaRegistro: serverTimestamp(),
        ultimaConexion: serverTimestamp()
      };
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

// Añade o modifica esta función
export const obtenerOCrearUsuarioPorId = async (uid: string, email: string): Promise<Usuario> => {
  try {
    const usuario = await obtenerUsuarioPorId(uid);
    
    if (usuario) {
      return usuario;
    } else {
      // Si no existe el perfil, crear uno básico
      console.log('Creando perfil básico para usuario:', uid);
      const ahora = Timestamp.now();
      
      const nuevoUsuario: Usuario = {
        uid,
        email,
        nombre: email.split('@')[0],
        apellidos: '',
        rol: 'invitado' as RolUsuario, // Cambiado de 'usuario' a 'invitado'
        activo: true,
        pendienteVerificacion: true, // Por defecto requiere verificación
        fechaCreacion: ahora,
        fechaRegistro: ahora,
        ultimaConexion: ahora
      };
      
      await setDoc(doc(db, 'usuarios', uid), nuevoUsuario);
      return nuevoUsuario;
    }
  } catch (error) {
    console.error('Error obteniendo o creando usuario:', error);
    throw error;
  }
};

// Actualizar usuario existente
export const actualizarUsuario = async (uid: string, userData: {
  nombre?: string;
  apellidos?: string;
  rol?: RolUsuario;
  activo?: boolean;
  telefono?: string;
  telefonosEmergencia?: string[];
  observaciones?: string;
}): Promise<void> => {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    await updateDoc(usuarioRef, {
      ...userData,
      // Si se actualiza el rol, asegurarse de que sea del tipo RolUsuario
      ...(userData.rol && { rol: userData.rol as RolUsuario })
    });
  } catch (error) {
    handleFirebaseError(error, 'Error al actualizar usuario');
    throw error;
  }
};

// Función para actualizar el último acceso del usuario
export const actualizarUltimoAcceso = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, {
      ultimaConexion: Timestamp.now() // Usar Timestamp.now() en lugar de serverTimestamp()
    });
  } catch (error) {
    handleFirebaseError(error, messages.errors.lastAccess);
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
  activo: boolean;
  telefono?: string;
  telefonosEmergencia?: string[];
  observaciones?: string;
}): Promise<Usuario> => {
  try {
    // Verificar disponibilidad de email con la función centralizada
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
    
    const nuevoUsuario: Usuario = {
      uid: user.uid,
      email: userData.email,
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      rol: userData.rol,
      activo: false, // Por defecto inactivo hasta aprobación
      pendienteVerificacion: true, // Por defecto requiere verificación
      fechaCreacion: Timestamp.now(),
      fechaRegistro: Timestamp.now(),
      ultimaConexion: Timestamp.now()
    };
    
    // Añadir campos opcionales
    if (userData.telefono) nuevoUsuario.telefono = userData.telefono;
    if (userData.telefonosEmergencia) nuevoUsuario.telefonosEmergencia = userData.telefonosEmergencia;
    if (userData.observaciones) nuevoUsuario.observaciones = userData.observaciones;
    
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
    // Eliminar de Firestore
    await deleteDoc(doc(db, 'usuarios', uid));
    
    // Intentar eliminar de Authentication si es posible
    // Nota: Esto puede requerir privilegios de admin o que el usuario esté autenticado
    try {
      // Esta función requeriría implementación con Firebase Admin SDK en un entorno seguro
      // o utilizando Cloud Functions
      console.log('Se debe eliminar el usuario de Authentication usando Firebase Admin SDK');
    } catch (authError) {
      console.error('No se pudo eliminar el usuario de Authentication:', authError);
    }
  } catch (error) {
    handleFirebaseError(error, 'Error al eliminar usuario');
    throw error;
  }
};

// Añadir esta función para obtener múltiples usuarios por sus IDs

export const listarUsuariosPorIds = async (userIds: string[]): Promise<Usuario[]> => {
  try {
    // Si no hay IDs, devolver array vacío
    if (!userIds.length) return [];
    
    const promises = userIds.map(async (userId) => {
      const usuario = await obtenerUsuarioPorId(userId);
      return usuario;
    });
    
    const usuarios = await Promise.all(promises);
    // Filtrar posibles nulls (usuarios no encontrados)
    return usuarios.filter((usuario: Usuario | null) => usuario !== null) as Usuario[];
  } catch (error) {
    handleFirebaseError(error, 'Error al listar usuarios por IDs');
    throw error;
  }
};

// Obtener estadísticas de usuarios
export const obtenerEstadisticasUsuarios = async () => {
  try {
    const usuarios = await listarUsuarios();
    return {
      activos: usuarios.filter(u => u.activo).length,
      inactivos: usuarios.filter(u => !u.activo).length,
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
    // Obtener todos los usuarios con roles admin y vocal
    const usuarios = await listarUsuarios();
    const usuariosNotificar = usuarios.filter(u => u.rol === 'admin' || u.rol === 'vocal');
    
    if (usuariosNotificar.length > 0) {
      // Extraer solo los IDs de usuario
      const usuarioIds = usuariosNotificar.map(u => u.uid);
      
      // Crear mensaje de notificación
      const mensaje = `Nuevo usuario registrado: ${usuario.nombre} ${usuario.apellidos} (${usuario.email})`;
      
      // Enviar notificación masiva
      await enviarNotificacionMasiva(
        usuarioIds,
        'sistema',
        mensaje,
        usuario.uid,
        'usuario',
        '/admin/usuarios' // Enlace directo a la gestión de usuarios (para admins)
      );
    }
  } catch (error) {
    console.error('Error al enviar notificaciones de nuevo usuario:', error);
    // No lanzamos error para no interrumpir el registro de usuario
  }
}