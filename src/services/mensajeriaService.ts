import {
  collection,
  addDoc,
  setDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  getDoc,
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Mensaje,
  Conversacion,
  ParticipanteConversacion,
  NuevaConversacion,
  NuevoMensaje,
  FiltroConversaciones,
  FiltroMensajes,
  EstadisticasMensajeria,
  MensajeLeido,
  ConfiguracionConversacion
} from '../types/mensaje';
import { Usuario, RolUsuario } from '../types/usuario';
import { notificarNuevoMensaje, notificarInvitacionConversacion } from './mensajeriaNotificacionService';

// ============= CONVERSACIONES =============

// Crear nueva conversación
export const crearConversacion = async (
  datos: NuevaConversacion,
  creadorId: string,
  creadorNombre: string,
  creadorRol: RolUsuario
): Promise<Conversacion> => {
  try {
    const configuracionPorDefecto: ConfiguracionConversacion = {
      permiteArchivos: true,
      permiteImagenes: true,
      permiteEnlaces: true,
      soloAdministradores: false,
      notificacionesActivas: true,
      limiteTamaño: 10, // 10MB
      moderada: false,
      ...datos.configuracion
    };

    const nuevaConversacion = {
      ...datos,
      creadorId,
      participantes: Array.from(new Set([creadorId, ...datos.participantes])), // Asegurar que el creador esté incluido
      administradores: [creadorId],
      fechaCreacion: serverTimestamp(),
      activa: true,
      configuracion: configuracionPorDefecto
    };

    const docRef = await addDoc(collection(db, 'conversaciones'), nuevaConversacion);
      // Crear registros de participantes de forma más simple
    const participantes = nuevaConversacion.participantes;
    try {
      const promesasParticipantes = participantes.map(usuarioId => 
        addDoc(collection(db, 'participantesConversacion'), {
          conversacionId: docRef.id,
          usuarioId,
          fechaUnion: serverTimestamp(),
          mensajesNoLeidos: 0,
          notificacionesActivas: true,
          silenciada: false,
          favorita: false,
          rol: usuarioId === creadorId ? 'administrador' : 'miembro'
        })
      );

      await Promise.all(promesasParticipantes);
    } catch (participantError) {
      console.error('Error al crear participantes:', participantError);
      // Si falla, eliminamos la conversación para mantener consistencia
      await deleteDoc(doc(db, 'conversaciones', docRef.id));
      throw new Error('Error al añadir participantes a la conversación');
    }

    // Enviar notificaciones de invitación a los participantes (excepto al creador)
    try {
      const participantesANotificar = participantes.filter(usuarioId => usuarioId !== creadorId);
      const notificacionesPromesas = participantesANotificar.map(usuarioId =>
        notificarInvitacionConversacion(
          usuarioId,
          datos.nombre,
          creadorNombre,
          docRef.id
        )
      );
      await Promise.all(notificacionesPromesas);
    } catch (notificationError) {
      // No fallar la creación si las notificaciones fallan
      console.error('Error al enviar notificaciones de invitación:', notificationError);
    }    // Enviar mensaje de bienvenida
    try {
      await enviarMensaje({
        conversacionId: docRef.id,
        tipo: 'texto',
        contenido: `${creadorNombre} ha creado la conversación "${datos.nombre}"`
      }, creadorId, creadorNombre, creadorRol);
    } catch (welcomeError) {
      console.error('Error al enviar mensaje de bienvenida (no crítico):', welcomeError);
      // No fallar la creación de conversación por esto
    }

    return {
      id: docRef.id,
      ...nuevaConversacion,
      fechaCreacion: new Date()
    } as Conversacion;
  } catch (error) {
    console.error('Error al crear conversación:', error);
    throw error;
  }
};

// Obtener conversaciones del usuario
export const obtenerConversacionesUsuario = async (
  usuarioId: string,
  filtros?: FiltroConversaciones,
  limite: number = 20
): Promise<Conversacion[]> => {
  try {
    // Primero obtenemos las participaciones del usuario
    const participacionesQuery = query(
      collection(db, 'participantesConversacion'),
      where('usuarioId', '==', usuarioId)
    );

    const participacionesSnapshot = await getDocs(participacionesQuery);
    const conversacionIds = participacionesSnapshot.docs.map(doc => doc.data().conversacionId);

    if (conversacionIds.length === 0) {
      return [];
    }

    // Dividir en chunks si hay muchas conversaciones (Firestore limita 'in' a 10 elementos)
    const chunks = [];
    for (let i = 0; i < conversacionIds.length; i += 10) {
      chunks.push(conversacionIds.slice(i, i + 10));
    }    const conversacionesPromesas = chunks.map(async (chunk) => {
      let conversacionesQuery = query(
        collection(db, 'conversaciones'),
        where('__name__', 'in', chunk),
        orderBy('fechaUltimoMensaje', 'desc'),
        limit(limite)
      );

      // Aplicar filtros adicionales solo si es necesario
      if (filtros?.tipo) {
        conversacionesQuery = query(
          collection(db, 'conversaciones'),
          where('__name__', 'in', chunk),
          where('tipo', '==', filtros.tipo),
          orderBy('fechaUltimoMensaje', 'desc'),
          limit(limite)
        );
      }

      if (filtros?.activa !== undefined) {
        conversacionesQuery = query(
          collection(db, 'conversaciones'),
          where('__name__', 'in', chunk),
          where('activa', '==', filtros.activa),
          orderBy('fechaUltimoMensaje', 'desc'),
          limit(limite)
        );
      }

      const snapshot = await getDocs(conversacionesQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // NUEVA ESTRATEGIA: Mantener Timestamps internamente
          fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion : (data.fechaCreacion ? Timestamp.fromDate(new Date(data.fechaCreacion)) : Timestamp.now()),
          fechaUltimoMensaje: data.fechaUltimoMensaje instanceof Timestamp ? data.fechaUltimoMensaje : (data.fechaUltimoMensaje ? Timestamp.fromDate(new Date(data.fechaUltimoMensaje)) : Timestamp.now())
        } as Conversacion;
      });
    });

    const resultadosChunks = await Promise.all(conversacionesPromesas);
    const todasLasConversaciones = resultadosChunks.flat();
      // Ordenar por fecha del último mensaje y limitar
    return todasLasConversaciones
      .sort((a, b) => {
        const fechaA = a.fechaUltimoMensaje 
          ? (a.fechaUltimoMensaje instanceof Timestamp ? a.fechaUltimoMensaje.toDate() : new Date(a.fechaUltimoMensaje))
          : new Date(0);
        const fechaB = b.fechaUltimoMensaje 
          ? (b.fechaUltimoMensaje instanceof Timestamp ? b.fechaUltimoMensaje.toDate() : new Date(b.fechaUltimoMensaje))
          : new Date(0);
        return fechaB.getTime() - fechaA.getTime();
      })
      .slice(0, limite);
      
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    throw error;
  }
};

// Obtener conversación por ID
export const obtenerConversacion = async (conversacionId: string): Promise<Conversacion | null> => {
  try {
    const docRef = doc(db, 'conversaciones', conversacionId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();    return {
      id: snapshot.id,
      ...data,
      // NUEVA ESTRATEGIA: Mantener Timestamps internamente
      fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion : (data.fechaCreacion ? Timestamp.fromDate(new Date(data.fechaCreacion)) : Timestamp.now()),
      fechaUltimoMensaje: data.fechaUltimoMensaje instanceof Timestamp ? data.fechaUltimoMensaje : (data.fechaUltimoMensaje ? Timestamp.fromDate(new Date(data.fechaUltimoMensaje)) : Timestamp.now())
    } as Conversacion;
  } catch (error) {
    console.error('Error al obtener conversación:', error);
    throw error;
  }
};

// ============= MENSAJES =============

// Enviar mensaje
export const enviarMensaje = async (
  nuevoMensaje: NuevoMensaje,
  remitenteId: string,
  remitenteNombre: string,
  remitenteRol: RolUsuario
): Promise<Mensaje> => {
  try {
    console.log('🔄 [SERVICE] Iniciando enviarMensaje:', {
      nuevoMensaje,
      remitenteId,
      remitenteNombre,
      remitenteRol
    });

    // Crear objeto mensaje con estructura limpia
    const mensaje = {
      conversacionId: nuevoMensaje.conversacionId,
      contenido: nuevoMensaje.contenido,
      tipo: nuevoMensaje.tipo,
      remitenteId,
      remitenteNombre,
      remitenteRol,
      fechaEnvio: new Date(),
      estado: 'enviado',
      editado: false,
      eliminado: false
    };

    console.log('📝 [SERVICE] Mensaje creado:', mensaje);    // Verificar participación en la conversación
    const conversacion = await obtenerConversacion(nuevoMensaje.conversacionId);
    if (!conversacion) {
      throw new Error(`La conversación ${nuevoMensaje.conversacionId} no existe`);
    }
    
    console.log('📋 [SERVICE] Conversación encontrada:', conversacion.nombre);
    
    if (!conversacion.participantes.includes(remitenteId)) {
      throw new Error(`El usuario ${remitenteId} no es participante de la conversación`);
    }

    console.log('✅ [SERVICE] Usuario verificado como participante');

    // Agregar reacciones como objeto vacío
    const mensajeFinal = {
      ...mensaje,
      reacciones: {}
    };

    console.log('📦 [SERVICE] Mensaje final a guardar:', mensajeFinal);

    // Guardar mensaje en Firestore
    const mensajeId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mensajeRef = doc(db, 'mensajes', mensajeId);
    
    console.log('💾 [SERVICE] Guardando mensaje con ID:', mensajeId);
    await setDoc(mensajeRef, mensajeFinal);
    console.log('✅ [SERVICE] Mensaje guardado en Firestore');
      // Crear un objeto docRef compatible para el resto del código
    const docRef = { id: mensajeId };

    // Actualizar conversación
    console.log('🔄 [SERVICE] Actualizando conversación...');
    await updateDoc(doc(db, 'conversaciones', nuevoMensaje.conversacionId), {
      fechaUltimoMensaje: new Date(),
      ultimoMensaje: nuevoMensaje.contenido.substring(0, 100)
    });
    console.log('✅ [SERVICE] Conversación actualizada');    // Actualizar contadores de participantes
    console.log('🔄 [SERVICE] Actualizando contadores de participantes...');
    
    try {
      const participantesQuery = query(
        collection(db, 'participantesConversacion'),
        where('conversacionId', '==', nuevoMensaje.conversacionId),
        where('usuarioId', '!=', remitenteId)
      );

      console.log('📋 [SERVICE] Consulta de participantes configurada, ejecutando...');
      const participantesSnapshot = await getDocs(participantesQuery);
      console.log(`📊 [SERVICE] Encontrados ${participantesSnapshot.docs.length} participantes para actualizar`);
      
      const actualizacionesParticipantes = participantesSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          mensajesNoLeidos: increment(1)
        })
      );

      await Promise.all(actualizacionesParticipantes);
      console.log('✅ [SERVICE] Contadores actualizados exitosamente');
    } catch (participantesError) {
      console.error('⚠️ [SERVICE] Error al actualizar contadores (no crítico):', participantesError);
      // No lanzar el error, solo registrarlo
    }    // Crear mensaje de retorno
    const mensajeRetorno = {
      id: docRef.id,
      ...mensajeFinal,
      fechaEnvio: new Date()
    } as Mensaje;
    
    console.log('🎉 [SERVICE] Mensaje completado exitosamente:', mensajeRetorno);

    return mensajeRetorno;} catch (error: unknown) {
    console.error('❌ [SERVICE] Error crítico en enviarMensaje:', error);
    console.error('❌ [SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('❌ [SERVICE] Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Obtener mensajes de una conversación
export const obtenerMensajes = async (
  conversacionId: string,
  limite: number = 50,
  ultimoMensaje?: QueryDocumentSnapshot<DocumentData>
): Promise<{ mensajes: Mensaje[]; ultimoDoc?: QueryDocumentSnapshot<DocumentData> }> => {
  try {
    let mensajesQuery = query(
      collection(db, 'mensajes'),
      where('conversacionId', '==', conversacionId),
      where('eliminado', '==', false),
      orderBy('fechaEnvio', 'desc'),
      limit(limite)
    );

    if (ultimoMensaje) {
      mensajesQuery = query(
        collection(db, 'mensajes'),
        where('conversacionId', '==', conversacionId),
        where('eliminado', '==', false),
        orderBy('fechaEnvio', 'desc'),
        startAfter(ultimoMensaje),
        limit(limite)
      );
    }    const snapshot = await getDocs(mensajesQuery);
    const mensajes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // NUEVA ESTRATEGIA: Mantener Timestamps internamente
        fechaEnvio: data.fechaEnvio instanceof Timestamp ? data.fechaEnvio : (data.fechaEnvio ? Timestamp.fromDate(new Date(data.fechaEnvio)) : Timestamp.now()),
        fechaEdicion: data.fechaEdicion instanceof Timestamp ? data.fechaEdicion : (data.fechaEdicion ? Timestamp.fromDate(new Date(data.fechaEdicion)) : null)
      } as Mensaje;
    }).reverse(); // Invertir para mostrar del más antiguo al más reciente

    const ultimoDoc = snapshot.docs[snapshot.docs.length - 1];

    return { mensajes, ultimoDoc };
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    throw error;
  }
};

// Escuchar mensajes en tiempo real
export const escucharMensajes = (
  conversacionId: string,
  callback: (mensajes: Mensaje[]) => void,
  onError?: (error: Error) => void
) => {
  console.log('🎧 [SERVICE] Configurando listener para conversación:', conversacionId);
  
  const mensajesQuery = query(
    collection(db, 'mensajes'),
    where('conversacionId', '==', conversacionId),
    where('eliminado', '==', false),
    orderBy('fechaEnvio', 'desc'),
    limit(50)
  );

  console.log('📋 [SERVICE] Query configurada, iniciando onSnapshot...');

  return onSnapshot(
    mensajesQuery,
    (snapshot) => {
      console.log('🔔 [SERVICE] Listener activado exitosamente, documentos recibidos:', snapshot.docs.length);
      
      if (snapshot.docs.length === 0) {
        console.log('📭 [SERVICE] No hay mensajes en esta conversación');
        callback([]);
        return;
      }
      
      const mensajes = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📨 [SERVICE] Procesando mensaje:', { id: doc.id, contenido: data.contenido, remitente: data.remitenteNombre });
        return {
          id: doc.id,
          ...data,
          // NUEVA ESTRATEGIA: Mantener Timestamps internamente
          fechaEnvio: data.fechaEnvio instanceof Timestamp ? data.fechaEnvio : (data.fechaEnvio ? Timestamp.fromDate(new Date(data.fechaEnvio)) : Timestamp.now()),
          fechaEdicion: data.fechaEdicion instanceof Timestamp ? data.fechaEdicion : (data.fechaEdicion ? Timestamp.fromDate(new Date(data.fechaEdicion)) : null)
        } as Mensaje;
      }).reverse();

      console.log('📋 [SERVICE] Mensajes procesados y enviados al callback:', mensajes.length);
      callback(mensajes);
    },
    (error) => {
      console.error('❌ [SERVICE] Error crítico en listener de mensajes:', error);
      console.error('❌ [SERVICE] Error code:', error.code);
      console.error('❌ [SERVICE] Error message:', error.message);
      console.error('❌ [SERVICE] Error stack:', error.stack);
      
      // Si es un error de índice, intentar sin el orderBy
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        console.log('🔄 [SERVICE] Error de índice detectado, reintentando sin orderBy...');
        
        const mensajesQuerySimple = query(
          collection(db, 'mensajes'),
          where('conversacionId', '==', conversacionId),
          where('eliminado', '==', false),
          limit(50)
        );
        
        return onSnapshot(
          mensajesQuerySimple,
          (snapshot) => {
            console.log('🔔 [SERVICE] Listener simple activado, documentos:', snapshot.docs.length);
            const mensajes = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                fechaEnvio: data.fechaEnvio instanceof Timestamp ? data.fechaEnvio : (data.fechaEnvio ? Timestamp.fromDate(new Date(data.fechaEnvio)) : Timestamp.now()),
                fechaEdicion: data.fechaEdicion instanceof Timestamp ? data.fechaEdicion : (data.fechaEdicion ? Timestamp.fromDate(new Date(data.fechaEdicion)) : null)
              } as Mensaje;
            });
            
            // Ordenar manualmente por fecha
            mensajes.sort((a, b) => {
              const fechaA = a.fechaEnvio instanceof Timestamp ? a.fechaEnvio.toDate() : new Date(a.fechaEnvio);
              const fechaB = b.fechaEnvio instanceof Timestamp ? b.fechaEnvio.toDate() : new Date(b.fechaEnvio);
              return fechaA.getTime() - fechaB.getTime();
            });
            
            callback(mensajes);
          },
          (retryError) => {
            console.error('❌ [SERVICE] Error en listener simple también:', retryError);
            if (onError) onError(retryError);
          }
        );
      }
      
      if (onError) onError(error);
    }
  );
};

// Marcar mensajes como leídos
export const marcarMensajesComoLeidos = async (
  conversacionId: string,
  usuarioId: string,
  ultimoMensajeId: string
): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      // Actualizar participante - resetear contador de no leídos
      const participanteQuery = query(
        collection(db, 'participantesConversacion'),
        where('conversacionId', '==', conversacionId),
        where('usuarioId', '==', usuarioId)
      );

      const participanteSnapshot = await getDocs(participanteQuery);
      if (!participanteSnapshot.empty) {
        const participanteDoc = participanteSnapshot.docs[0];
        transaction.update(participanteDoc.ref, {
          mensajesNoLeidos: 0,
          fechaUltimaLectura: serverTimestamp()
        });
      }

      // Crear registro de lectura
      const lecturaRef = doc(collection(db, 'mensajesLeidos'));
      transaction.set(lecturaRef, {
        mensajeId: ultimoMensajeId,
        usuarioId,
        fechaLectura: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    throw error;
  }
};

// Editar mensaje
export const editarMensaje = async (
  mensajeId: string,
  nuevoContenido: string,
  usuarioId: string
): Promise<void> => {
  try {
    const mensajeRef = doc(db, 'mensajes', mensajeId);
    const mensajeDoc = await getDoc(mensajeRef);

    if (!mensajeDoc.exists()) {
      throw new Error('El mensaje no existe');
    }

    const mensajeData = mensajeDoc.data();
    if (mensajeData.remitenteId !== usuarioId) {
      throw new Error('No tienes permisos para editar este mensaje');
    }

    await updateDoc(mensajeRef, {
      contenido: nuevoContenido,
      fechaEdicion: serverTimestamp(),
      editado: true
    });
  } catch (error) {
    console.error('Error al editar mensaje:', error);
    throw error;
  }
};

// Eliminar mensaje
export const eliminarMensaje = async (
  mensajeId: string,
  usuarioId: string
): Promise<void> => {
  try {
    const mensajeRef = doc(db, 'mensajes', mensajeId);
    const mensajeDoc = await getDoc(mensajeRef);

    if (!mensajeDoc.exists()) {
      throw new Error('El mensaje no existe');
    }

    const mensajeData = mensajeDoc.data();
    if (mensajeData.remitenteId !== usuarioId) {
      throw new Error('No tienes permisos para eliminar este mensaje');
    }

    await updateDoc(mensajeRef, {
      eliminado: true,
      contenido: '[Mensaje eliminado]'
    });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    throw error;
  }
};

// Añadir reacción a mensaje
export const añadirReaccion = async (
  mensajeId: string,
  emoji: string,
  usuarioId: string
): Promise<void> => {
  try {
    const mensajeRef = doc(db, 'mensajes', mensajeId);
    await updateDoc(mensajeRef, {
      [`reacciones.${emoji}`]: arrayUnion(usuarioId)
    });
  } catch (error) {
    console.error('Error al añadir reacción:', error);
    throw error;
  }
};

// Quitar reacción de mensaje
export const quitarReaccion = async (
  mensajeId: string,
  emoji: string,
  usuarioId: string
): Promise<void> => {
  try {
    const mensajeRef = doc(db, 'mensajes', mensajeId);
    await updateDoc(mensajeRef, {
      [`reacciones.${emoji}`]: arrayRemove(usuarioId)
    });
  } catch (error) {
    console.error('Error al quitar reacción:', error);
    throw error;
  }
};

// ============= PARTICIPANTES =============

// Añadir participante a conversación
export const añadirParticipante = async (
  conversacionId: string,
  usuarioId: string,
  añadidoPorId: string
): Promise<void> => {
  try {
    // Verificar que quien añade tiene permisos
    const conversacion = await obtenerConversacion(conversacionId);
    if (!conversacion) {
      throw new Error('La conversación no existe');
    }

    if (!conversacion.administradores.includes(añadidoPorId)) {
      throw new Error('No tienes permisos para añadir participantes');
    }

    // Añadir a la conversación
    await updateDoc(doc(db, 'conversaciones', conversacionId), {
      participantes: arrayUnion(usuarioId)
    });

    // Crear registro de participante
    await addDoc(collection(db, 'participantesConversacion'), {
      conversacionId,
      usuarioId,
      fechaUnion: serverTimestamp(),
      mensajesNoLeidos: 0,
      notificacionesActivas: true,
      silenciada: false,
      favorita: false,
      rol: 'miembro'
    });
  } catch (error) {
    console.error('Error al añadir participante:', error);
    throw error;
  }
};

// Abandonar conversación
export const abandonarConversacion = async (
  conversacionId: string,
  usuarioId: string
): Promise<void> => {
  try {
    // Remover de la conversación
    await updateDoc(doc(db, 'conversaciones', conversacionId), {
      participantes: arrayRemove(usuarioId),
      administradores: arrayRemove(usuarioId)
    });

    // Eliminar registro de participante
    const participanteQuery = query(
      collection(db, 'participantesConversacion'),
      where('conversacionId', '==', conversacionId),
      where('usuarioId', '==', usuarioId)
    );

    const participanteSnapshot = await getDocs(participanteQuery);
    const promesasEliminacion = participanteSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promesasEliminacion);
  } catch (error) {
    console.error('Error al abandonar conversación:', error);
    throw error;
  }
};

// ============= CONVERSACIONES PÚBLICAS =============

// Obtener conversaciones públicas disponibles para un rol
export const obtenerConversacionesPublicas = async (
  rolUsuario: RolUsuario,
  limite: number = 20
): Promise<Conversacion[]> => {
  try {
    const conversacionesQuery = query(
      collection(db, 'conversaciones'),
      where('publica', '==', true),
      where('rolesPermitidos', 'array-contains', rolUsuario),
      where('activa', '==', true),
      orderBy('fechaCreacion', 'desc'),
      limit(limite)
    );

    const snapshot = await getDocs(conversacionesQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : data.fechaCreacion,
        fechaUltimoMensaje: data.fechaUltimoMensaje instanceof Timestamp ? data.fechaUltimoMensaje.toDate() : data.fechaUltimoMensaje
      } as Conversacion;
    });
  } catch (error) {
    console.error('Error al obtener conversaciones públicas:', error);
    throw error;
  }
};

// Unirse a conversación pública
export const unirseAConversacion = async (
  conversacionId: string,
  usuarioId: string,
  usuarioNombre: string,
  usuarioRol: RolUsuario
): Promise<void> => {
  try {
    const conversacion = await obtenerConversacion(conversacionId);
    if (!conversacion) {
      throw new Error('La conversación no existe');
    }

    if (!conversacion.publica) {
      throw new Error('No puedes unirte a una conversación privada');
    }

    if (!conversacion.rolesPermitidos.includes(usuarioRol)) {
      throw new Error('Tu rol no tiene permisos para unirse a esta conversación');
    }

    if (conversacion.participantes.includes(usuarioId)) {
      throw new Error('Ya eres participante de esta conversación');
    }

    // Añadir a la conversación
    await updateDoc(doc(db, 'conversaciones', conversacionId), {
      participantes: arrayUnion(usuarioId)
    });

    // Crear registro de participante
    await addDoc(collection(db, 'participantesConversacion'), {
      conversacionId,
      usuarioId,
      fechaUnion: serverTimestamp(),
      mensajesNoLeidos: 0,
      notificacionesActivas: true,
      silenciada: false,
      favorita: false,
      rol: 'miembro'
    });

    // Enviar mensaje de bienvenida
    await enviarMensaje({
      conversacionId,
      tipo: 'texto',
      contenido: `${usuarioNombre} se ha unido a la conversación`
    }, 'sistema', 'Sistema', 'admin');
  } catch (error) {
    console.error('Error al unirse a conversación:', error);
    throw error;
  }
};

// ============= BÚSQUEDA =============

// Buscar mensajes
export const buscarMensajes = async (
  filtros: FiltroMensajes,
  limite: number = 50
): Promise<Mensaje[]> => {
  try {
    let mensajesQuery = query(
      collection(db, 'mensajes'),
      where('eliminado', '==', false),
      orderBy('fechaEnvio', 'desc'),
      limit(limite)
    );

    if (filtros.conversacionId) {
      mensajesQuery = query(
        collection(db, 'mensajes'),
        where('conversacionId', '==', filtros.conversacionId),
        where('eliminado', '==', false),
        orderBy('fechaEnvio', 'desc'),
        limit(limite)
      );
    }

    if (filtros.remitenteId) {
      mensajesQuery = query(
        collection(db, 'mensajes'),
        where('remitenteId', '==', filtros.remitenteId),
        where('eliminado', '==', false),
        orderBy('fechaEnvio', 'desc'),
        limit(limite)
      );
    }

    if (filtros.tipo) {
      mensajesQuery = query(
        collection(db, 'mensajes'),
        where('tipo', '==', filtros.tipo),
        where('eliminado', '==', false),
        orderBy('fechaEnvio', 'desc'),
        limit(limite)
      );
    }

    const snapshot = await getDocs(mensajesQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fechaEnvio: data.fechaEnvio instanceof Timestamp ? data.fechaEnvio.toDate() : data.fechaEnvio,
        fechaEdicion: data.fechaEdicion instanceof Timestamp ? data.fechaEdicion.toDate() : data.fechaEdicion
      } as Mensaje;
    });
  } catch (error) {
    console.error('Error al buscar mensajes:', error);
    throw error;
  }
};

// ============= ESTADÍSTICAS =============

// Obtener estadísticas de mensajería
export const obtenerEstadisticasMensajeria = async (): Promise<EstadisticasMensajeria> => {
  try {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total conversaciones
    const conversacionesSnapshot = await getDocs(collection(db, 'conversaciones'));
    const totalConversaciones = conversacionesSnapshot.size;

    // Conversaciones activas
    const conversacionesActivasQuery = query(
      collection(db, 'conversaciones'),
      where('activa', '==', true)
    );
    const conversacionesActivasSnapshot = await getDocs(conversacionesActivasQuery);
    const conversacionesActivas = conversacionesActivasSnapshot.size;

    // Mensajes de hoy
    const mensajesHoyQuery = query(
      collection(db, 'mensajes'),
      where('fechaEnvio', '>=', Timestamp.fromDate(hoy)),
      where('eliminado', '==', false)
    );
    const mensajesHoySnapshot = await getDocs(mensajesHoyQuery);
    const mensajesHoy = mensajesHoySnapshot.size;

    // Mensajes de la semana
    const mensajesSemanaQuery = query(
      collection(db, 'mensajes'),
      where('fechaEnvio', '>=', Timestamp.fromDate(semanaAtras)),
      where('eliminado', '==', false)
    );
    const mensajesSemanaSnapshot = await getDocs(mensajesSemanaQuery);
    const mensajesSemana = mensajesSemanaSnapshot.size;

    // Participantes únicos activos (que han enviado mensajes en la última semana)
    const participantesActivosQuery = query(
      collection(db, 'mensajes'),
      where('fechaEnvio', '>=', Timestamp.fromDate(semanaAtras)),
      where('eliminado', '==', false)
    );
    const participantesActivosSnapshot = await getDocs(participantesActivosQuery);
    const remitentesUnicos = new Set(participantesActivosSnapshot.docs.map(doc => doc.data().remitenteId));
    const participantesActivos = remitentesUnicos.size;

    // Conversaciones por tipo
    const conversacionesPorTipo: { [tipo: string]: number } = {};
    conversacionesSnapshot.docs.forEach(doc => {
      const tipo = doc.data().tipo;
      conversacionesPorTipo[tipo] = (conversacionesPorTipo[tipo] || 0) + 1;
    });

    return {
      totalConversaciones,
      conversacionesActivas,
      mensajesHoy,
      mensajesSemana,
      participantesActivos,
      conversacionesPorTipo
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

// Eliminar conversación completamente
export const eliminarConversacion = async (
  conversacionId: string,
  usuarioId: string
): Promise<void> => {
  try {
    console.log('🗑️ [SERVICE] Iniciando eliminación de conversación:', conversacionId);
    
    // Verificar que el usuario sea administrador de la conversación
    const conversacion = await obtenerConversacion(conversacionId);
    if (!conversacion) {
      throw new Error('La conversación no existe');
    }

    if (!conversacion.administradores.includes(usuarioId)) {
      throw new Error('Solo los administradores pueden eliminar la conversación');
    }

    console.log('✅ [SERVICE] Usuario verificado como administrador');

    // Eliminar todos los mensajes de la conversación
    console.log('🗑️ [SERVICE] Eliminando mensajes...');
    const mensajesQuery = query(
      collection(db, 'mensajes'),
      where('conversacionId', '==', conversacionId)
    );
    const mensajesSnapshot = await getDocs(mensajesQuery);
    
    const promesasEliminacionMensajes = mensajesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(promesasEliminacionMensajes);
    console.log(`✅ [SERVICE] ${mensajesSnapshot.docs.length} mensajes eliminados`);

    // Eliminar todos los registros de participantes
    console.log('🗑️ [SERVICE] Eliminando participantes...');
    const participantesQuery = query(
      collection(db, 'participantesConversacion'),
      where('conversacionId', '==', conversacionId)
    );
    const participantesSnapshot = await getDocs(participantesQuery);
    
    const promesasEliminacionParticipantes = participantesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(promesasEliminacionParticipantes);
    console.log(`✅ [SERVICE] ${participantesSnapshot.docs.length} participantes eliminados`);

    // Eliminar la conversación
    console.log('🗑️ [SERVICE] Eliminando conversación...');
    await deleteDoc(doc(db, 'conversaciones', conversacionId));
    
    console.log('✅ [SERVICE] Conversación eliminada completamente');
  } catch (error) {
    console.error('❌ [SERVICE] Error al eliminar conversación:', error);
    throw error;
  }
};

export {};
