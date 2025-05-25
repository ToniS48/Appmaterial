/**
 * Archivo centralizado de mensajes para toda la aplicación
 * Permite mantener consistencia y facilitar la internacionalización futura
 */

export const messages = {
  // Mensajes de autenticación
  auth: {
    login: {
      title: 'Iniciar sesión',
      emailLabel: 'Correo electrónico',
      passwordLabel: 'Contraseña',
      submitButton: 'Acceder',
      loadingButton: 'Accediendo...',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta? Regístrate',
      emailSent: 'Email enviado correctamente',
      emailRequired: 'Debes introducir un email para recuperar tu contraseña',
      invalidEmail: 'El formato de email no es válido',
      passwordTooShort: 'La contraseña debe tener al menos 6 caracteres'
    },
    register: {
      title: 'Crear nueva cuenta',
      nameLabel: 'Nombre',
      surnameLabel: 'Apellidos',
      emailLabel: 'Email',
      passwordLabel: 'Contraseña',
      confirmPasswordLabel: 'Confirmar Contraseña',
      submitButton: 'Registrar',
      loadingButton: 'Registrando...',
      hasAccount: '¿Ya tienes una cuenta? Inicia sesión',
      success: 'Registro completado con éxito',
      terms: 'Al registrarte, aceptas nuestros términos y condiciones de uso y política de privacidad.'
    },
    session: {
      loadProfileError: 'Error al cargar tu perfil',
      logoutError: 'Error al cerrar sesión',
      inactivityLogout: 'Sesión cerrada por inactividad',
      sessionWarning: 'Su sesión está por expirar',
      sessionWarningDescription: 'Por inactividad, su sesión se cerrará automáticamente en 5 minutos. ¿Desea continuar conectado?',
      continueSession: 'Continuar conectado',
      closeSession: 'Cerrar sesión',
      accountDisabled: 'Tu cuenta está desactivada. Contacta con un administrador.',
      loginError: 'Error al iniciar sesión',
      registerError: 'Error al registrar usuario',
      passwordResetEmailSent: 'Se ha enviado un email con instrucciones para restablecer tu contraseña',
      passwordResetError: 'Error al enviar el email de restablecimiento de contraseña'
    },
    security: {
      loginBlocked: 'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.',
      attemptsRemaining: 'Intento fallido. Te quedan {attempts} intentos.',
      blockedTime: 'Podrás intentarlo nuevamente en {minutes} minutos.',
      temporaryBlock: 'Por seguridad, se ha bloqueado temporalmente el acceso.'
    },
    resetPassword: {
      emailSent: 'Se ha enviado un email con instrucciones para restablecer tu contraseña',
      error: 'Error al enviar el email de restablecimiento de contraseña'
    }
  },
  
  // Mensajes de validación
  validation: {
    required: 'Este campo es obligatorio',
    nameRequired: 'El nombre es obligatorio',
    surnameRequired: 'Los apellidos son obligatorios',
    emailRequired: 'El email es obligatorio',
    emailInvalid: 'Formato de email inválido',
    emailInUse: 'Este email ya está en uso',
    emailCheckError: 'Error al verificar disponibilidad del email',
    disposableEmail: 'Este tipo de email no está permitido',
    passwordRequired: 'La contraseña es obligatoria',
    passwordLength: 'La contraseña debe tener al menos 6 caracteres',
    passwordMismatch: 'Las contraseñas no coinciden'
  },
  
  // Mensajes de error
  errors: {
    login: 'Error al iniciar sesión',
    register: 'Error al registrar usuario',
    resetPassword: 'Error al enviar el correo de recuperación',
    updateUser: 'Error al actualizar usuario',
    lastAccess: 'Error al actualizar último acceso',
    general: 'Ha ocurrido un error',
    permission: 'No tienes permisos para acceder a esta página',
    notFound: 'Página no encontrada',
    errorGuardarPrestamo: 'Error al guardar el préstamo'
  },
  
  // Mensajes de estado de material
  materialStatus: {
    available: 'Disponible',
    borrowed: 'Prestado',
    maintenance: 'En mantenimiento',
    disabled: 'Dado de baja',
    lost: 'Perdido'
  },
  
  // Títulos de secciones
  sections: {
    admin: "S.E. ESPEMO - Secció d'Espeleologia - Administrador",
    vocal: "S.E. ESPEMO - Secció d'Espeleologia - Vocal",
    socio: "S.E. ESPEMO - Secció d'Espeleologia - Socio"
  },

  // Mensajes de confirmación
  confirmations: {
    delete: '¿Estás seguro de que deseas eliminar este elemento?',
    logout: '¿Estás seguro de que deseas cerrar sesión?',
    unsavedChanges: 'Hay cambios sin guardar. ¿Deseas continuar?'
  },
  
  // Acciones comunes
  actions: {
    add: 'Añadir',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    back: 'Volver',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpiar',
    view: 'Ver detalle',
    download: 'Descargar',
    upload: 'Subir',
    retry: 'Reintentar'
  },

  // Mensajes de notificación
  notifications: {
    saveSuccess: 'Guardado con éxito',
    updateSuccess: 'Actualizado con éxito',
    deleteSuccess: 'Eliminado con éxito',
    operationSuccess: 'Operación completada con éxito'
  },

  // Mensajes de Firebase
  firebase: {
    configMissing: 'Firebase config is missing or incomplete. Make sure you have set up the environment variables correctly.',
    errors: {
      // Errores de autenticación
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Comprueba tu red',
      'auth/operation-not-allowed': 'Esta operación no está permitida',
      'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este email usando otro método de inicio de sesión',
      'auth/invalid-credential': 'Credencial inválida. Por favor, inténtalo de nuevo',
      'auth/invalid-verification-code': 'Código de verificación inválido',
      'auth/requires-recent-login': 'Esta operación es sensible y requiere autenticación reciente',
      'auth/expired-action-code': 'Este enlace ha expirado o ya se ha utilizado',
      'auth/invalid-action-code': 'El enlace de verificación no es válido',
      'auth/popup-blocked': 'El navegador ha bloqueado la ventana emergente',
      'auth/popup-closed-by-user': 'La ventana de autenticación fue cerrada antes de completar el proceso',
      
      // Errores de Firestore
      'permission-denied': 'No tienes permiso para realizar esta operación',
      'unavailable': 'El servicio no está disponible. Comprueba tu conexión',
      'not-found': 'El documento solicitado no existe',
      'already-exists': 'Ya existe un documento con ese identificador',
      'resource-exhausted': 'Se ha excedido la cuota o límite de recursos',
      'failed-precondition': 'La operación fue rechazada porque no cumple con los requisitos',
      'aborted': 'La operación fue abortada',
      'out-of-range': 'La operación intentó pasar de los límites válidos',
      'unimplemented': 'La operación no está implementada o no está habilitada',
      'internal': 'Error interno. Por favor, inténtalo más tarde',
      'data-loss': 'Se han perdido o dañado datos irrecuperables',
      'unauthenticated': 'Las credenciales de autenticación no son válidas'
    }
  },

  // Mensajes de carga
  loading: {
    general: 'Cargando...',
    data: 'Cargando datos...',
    processing: 'Procesando...'
  },
  
  // Mensajes de la app
  app: {
    title: 'ESPEMO',
    description: 'Aplicación web de ESPEMO para gestión de socios y material',
    noscript: 'Necesitas habilitar JavaScript para ejecutar esta aplicación.'
  },

  // Sección de usuarios
  usuarios: {
    creado: 'Usuario creado correctamente',
    actualizado: 'Usuario actualizado correctamente',
    eliminado: 'Usuario eliminado correctamente',
    errorCrear: 'Error al crear el usuario',
    errorActualizar: 'Error al actualizar el usuario',
    errorEliminar: 'Error al eliminar el usuario',
    confirmacionEliminar: '¿Está seguro de que desea eliminar este usuario?',
  },

  // Notificaciones
  notificaciones: {
    titulo: 'Notificaciones',
    todasLasNotificaciones: 'Todas las notificaciones',
    verTodas: 'Ver todas',
    noHayNotificaciones: 'No tienes notificaciones',
    marcarComoLeidas: 'Marcar todas como leídas',
    marcarLeidaError: 'No se pudo marcar la notificación como leída',
    marcarTodasLeidasExito: 'Todas las notificaciones han sido marcadas como leídas',
    marcarTodasLeidasError: 'No se pudieron marcar todas las notificaciones como leídas',
    eliminada: 'Notificación eliminada',
    eliminarError: 'Error al eliminar notificación',
    obtenerError: 'Error al obtener notificaciones',
    crearError: 'Error al crear notificación',
    enviarMasivaError: 'Error al enviar notificaciones masivas',
    nueva: 'Nueva',
    notificacionNoEncontrada: 'No se encontraron notificaciones con los filtros seleccionados',
    mostrarLeidas: 'Mostrar leídas',
    ocultarLeidas: 'Ocultar leídas',
    formatoFecha: {
      hoy: 'Hoy, {hora}',
      ayer: 'Ayer, {hora}'
    },
    tipos: {
      material: 'Material',
      actividad: 'Actividad',
      prestamo: 'Préstamo',
      devolucion: 'Devolución',
      incidencia: 'Incidencia',
      recordatorio: 'Recordatorio',
      sistema: 'Sistema'
    }
  },
  
  // Material y préstamos
  material: {
    qrDescargado: 'QR descargado',
    qrDescargadoDesc: 'Se ha descargado el código QR como archivo SVG.',
    qrError: 'Error al descargar',
    qrErrorDesc: 'No se pudo descargar el código QR.',
    guardar: 'Guardar Material',
    actualizar: 'Actualizar Material',
    qrGenerado: 'Código QR generado',
    devoluciones: {
      titulo: 'Devolución de Material',
      registrar: 'Registrar devolución de material',
      fechaDevolución: 'Fecha de devolución',
      tieneIncidencia: '¿Tiene incidencia?',
      opcionNoIncidencia: 'No, el material está en perfecto estado',
      opcionSiIncidencia: 'Sí, hay alguna incidencia',
      detallesIncidencia: 'Detalles de la incidencia',
      tipoIncidencia: 'Tipo de incidencia',
      tiposIncidencia: {
        daño: 'Daño (el material está dañado pero es reparable)',
        perdida: 'Pérdida (el material se ha perdido)',
        mantenimiento: 'Mantenimiento (el material requiere revisión)',
        otro: 'Otro'
      },
      gravedadIncidencia: 'Gravedad',
      nivelesGravedad: {
        baja: 'Baja',
        media: 'Media',
        alta: 'Alta',
        critica: 'Crítica'
      },
      descripcionIncidencia: 'Descripción de la incidencia',
      observaciones: 'Observaciones generales (opcional)',
      sinPendientes: 'No tienes materiales pendientes de devolución',
      seleccionaMaterial: 'Selecciona el material que deseas devolver para registrar su devolución y reportar posibles incidencias:',
      devolucionRegistrada: 'Devolución registrada',
      materialDevuelto: 'El material ha sido devuelto correctamente',
    },
    selector: {
      errorCantidad: 'La cantidad debe ser mayor que cero',
      errorDisponibilidad: 'Solo hay {cantidad} unidades realmente disponibles',
      disponibilidadActualizada: 'Disponibilidad actualizada',
      disponiblesAhora: 'Solo hay {cantidad} unidades disponibles ahora',
      seleccioneMaterial: 'Selecciona un material primero',
      materialNoEncontrado: 'El material seleccionado no fue encontrado',
      errorAnadir: 'No se pudo añadir el material',
      materialAnadido: 'Material añadido',
      materialAnadidoDesc: '{nombre} añadido a la lista',
      cargando: 'Cargando materiales disponibles...',
      errorCargarMateriales: 'No se pudieron cargar los materiales disponibles',
      buscarPlaceholder: 'Buscar material...',
      filtroTodos: 'Todos',
      filtroCuerdas: 'Cuerdas',
      filtroAnclajes: 'Anclajes',
      filtroVarios: 'Varios',
      tabTodos: 'Todos',
      tabCuerdas: 'Cuerdas',
      tabAnclajes: 'Anclajes',
      tabVarios: 'Varios',
      sinMateriales: 'No se encontraron materiales disponibles',
      sinCuerdas: 'No se encontraron cuerdas disponibles',
      sinAnclajes: 'No se encontraron anclajes disponibles',
      sinVarios: 'No se encontró material variado disponible',
      seleccionados: 'Materiales seleccionados',
      sinSeleccionados: 'No hay materiales seleccionados',
      columnaMaterial: 'Material',      columnaCantidad: 'Cantidad',
      botonAnadir: 'Añadir',
      disponible: 'disponible'
    },
    inventario: {
      titulo: 'Inventario de Material',
      descripcion: 'Consulta todo el material disponible en el club',
      vistaInventario: 'Vista de inventario',
      vistaCompleta: 'Vista completa',
      materialEncontrado: 'material encontrado',
      materialesEncontrados: 'materiales encontrados',
      especificaciones: 'Especificaciones',
      sinMateriales: 'No se encontraron materiales',
      ajustarFiltros: 'Prueba a ajustar los filtros de búsqueda',
      cargandoInventario: 'Cargando inventario...',
      errorCargarInventario: 'Error al cargar el inventario'
    }
  },
  
  // Préstamos
  prestamos: {
    registrarDevolucion: 'Registrar Devolución',
    confirmarDevolucion: '¿Estás seguro de registrar la devolución de este material? Esta acción actualizará el inventario.',
    confirmar: 'Confirmar Devolución',
    cantidadInsuficiente: 'Solo hay {cantidad} unidades disponibles',
    errorCantidad: 'Error de cantidad',
    devolucionRegistrada: 'Devolución registrada',
    devolucionRegistradaDesc: 'Se ha registrado la devolución del material {nombre}',
    errorDevolucion: 'Error',
    errorDevolucionDesc: 'No se pudo registrar la devolución',
    cancelar: 'Cancelar',
    tituloPagina: 'Gestión de Préstamos',
    nuevoPrestamo: 'Nuevo Préstamo',
    filtroPorEstado: 'Filtrar por estado',
    buscar: 'Buscar',
    estadosTodos: 'Todos',
    cargando: 'Cargando préstamos...',
    editar: 'Editar Préstamo',
    nuevo: 'Nuevo Préstamo',
    registrado: 'Préstamo registrado',
    registradoExito: 'El préstamo se ha registrado correctamente',
    actualizado: 'Préstamo actualizado',
    actualizadoExito: 'El préstamo se ha actualizado correctamente',
    actualizar: 'Actualizar préstamo',
    registrar: 'Registrar préstamo',
    sinResultados: 'No se encontraron préstamos',
    errorCargar: 'Error al cargar los préstamos',
    gestionarMaterial: 'Gestionar material',
    gestionarMaterialPara: 'Gestionar material para {nombre}',
    actividad: 'Actividad'
  },
  
  // Formularios comunes
  formularios: {
    modoVocal: 'Modo vocal activado',
    modoVocalDesc: 'No se pueden realizar cambios en el modo vocal.',
    nuevoUsuario: 'Nuevo Usuario',
    editarUsuario: 'Editar Usuario',
    // Nuevos para el formulario de préstamos
    prestamo: {
      titulo: 'Registrar Préstamo',
      editar: 'Editar Préstamo',
      usuario: 'Usuario',
      material: 'Material',
      fechaPrestamo: 'Fecha de préstamo',
      fechaDevolucionEstimada: 'Fecha de devolución estimada',
      fechaDevolucionPrevista: 'Fecha de devolución prevista',
      cantidad: 'Cantidad',
      cantidadPrestada: 'Cantidad prestada',
      actividadRelacionada: 'Actividad relacionada',
      sinActividad: 'Sin actividad relacionada',
      guardar: 'Guardar Préstamo',
      cancelar: 'Cancelar',
      success: 'Préstamo registrado correctamente',
      error: 'Error al registrar el préstamo',
      cargando: 'Cargando datos...',
      cargandoActividades: 'Cargando actividades...',
      seleccionarUsuario: 'Seleccionar usuario',
      seleccioneUsuario: 'Seleccione un usuario',
      seleccionarMaterial: 'Seleccionar material',
      seleccioneMaterial: 'Seleccione un material',
      noHayMateriales: 'No hay materiales disponibles',
      noHayActividades: 'No hay actividades disponibles',
      disponibles: 'Disponibles',
      estado: 'Estado',
      observaciones: 'Observaciones'
    }
  },

  // Dashboard
  dashboard: {
    // Textos comunes para todos los dashboards
    titulo: {
      admin: "S.E. ESPEMO - Administrador",
      vocal: "S.E. ESPEMO - Vocal",
      socio: "S.E. ESPEMO - Socio",
      invitado: "S.E. ESPEMO - Invitado",
    },
    bienvenida: {
      admin: 'Bienvenido/a, {nombre}. Aquí tienes un resumen del sistema.',
      vocal: 'Bienvenido/a, {nombre}. Gestiona las actividades del club y el material.',
      socio: 'Bienvenido/a, {nombre}. Aquí puedes ver tus actividades y el material disponible.',
      invitado: 'Bienvenido/a, {nombre}.',
    },
    secciones: {
      Actividades: 'Actividades',
      misActividadesResponsable: 'Actividades a mi cargo',
      actividadesParticipante: 'Actividades en las que participo',
      tusActividades: 'Tus actividades',
      proximasActividades: 'Próximas actividades del club',
      proximasActividadesSimple: 'Próximas actividades',
      actividadesPendientes: 'Actividades pendientes',
      estadisticas: 'Estadísticas',
    },
    botones: {
      nuevaActividad: 'Nueva Actividad',
      verDetalles: 'Ver detalles',
      editar: 'Editar',
      eliminar: 'Eliminar',
      verCalendario: 'Ver calendario completo',
    },
    modal: {
      nuevaActividad: 'Nueva Actividad',
      editarActividad: 'Editar Actividad',
      detalleActividad: 'Detalle de Actividad',
    },
    alerta: {
      eliminarActividad: 'Eliminar Actividad',
      confirmarEliminar: '¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.',
      cancelar: 'Cancelar',
      confirmar: 'Eliminar',
    },
    toast: {
      actividadEliminada: {
        titulo: 'Actividad eliminada',
        descripcion: 'La actividad ha sido eliminada correctamente',
      },
      error: {
        titulo: 'Error',
        descripcion: 'No se pudo eliminar la actividad. Inténtalo de nuevo.'
      }
    },
    estados: {
      planificada: 'Planificada',
      en_curso: 'En curso',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada',
    },
    cargando: 'Cargando actividades...',
    sinActividades: 'No tienes actividades planificadas actualmente.',
    sinActividadesProximas: 'No hay actividades próximas',
    sinActividadesResponsable: 'No tienes actividades a tu cargo',
    sinActividadesParticipante: 'No estás participando en otras actividades',
    sinActividadesDisponibles: 'No hay actividades disponibles',
    crearPrimeraActividad: 'Crear primera actividad',
    sinActividadesRegistradas: 'No tienes actividades registradas',
  },

  // Configuración
  configuracion: {
    backupIniciado: 'Backup iniciado',
    backupIniciandose: 'El proceso de backup se está iniciando...',
    backupCompletado: 'Backup completado con éxito',
    backupError: 'Error al realizar el backup',
    restauracionIniciada: 'Restauración iniciada',
    restauracionCompletada: 'Restauración completada con éxito',
    restauracionError: 'Error al restaurar los datos'
  },

  // Calendario
  calendario: {
    diasSemana: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    navegacion: {
      anterior: 'Anterior',
      siguiente: 'Siguiente'
    },
    filtros: {
      todosLosEstados: 'Todos los estados',
      todosLosTipos: 'Todos los tipos'
    },
    modal: {
      detalleActividad: 'Detalle de Actividad'
    },
    botones: {
      añadirTodas: 'Añadir todas a Google Calendar',
      añadirTodasTitle: 'Añadir todas las actividades visibles a Google Calendar'
    },
    toast: {
      error: {
        titulo: 'Error',
        descripcion: 'No se pudieron cargar las actividades'
      },
      sinActividades: {
        titulo: 'Sin actividades',
        descripcion: 'No hay actividades visibles para añadir al calendario'
      },
      exportacion: {
        titulo: 'Exportación iniciada',
        descripcion: 'Se están añadiendo {count} actividades a Google Calendar'
      }
    },
    confirmacion: {
      añadirGoogleCalendar: '¿Añadir {count} actividades a Google Calendar? Se abrirán {count} pestañas.'
    }
  },

  // Mensajes para ActividadDetalle.tsx
  actividades: {
    detalle: {
      fecha: 'Fecha',
      fechaInicio: 'Inicio',
      fechaFin: 'Fin',
      lugar: 'Lugar',
      descripcion: 'Descripción',
      responsable: 'Responsable',
      participantes: 'Participantes',
      participantesCount: '{count} participantes',
      sinParticipantes: 'Sin participantes',
      materiales: 'Materiales',
      sinMateriales: 'Sin materiales',
      enlaces: 'Enlaces',
      sinEnlaces: 'Sin enlaces',
      añadirGoogleCalendar: 'Añadir a Google Calendar',
      añadirGoogleCalendarTitle: 'Añadir esta actividad a Google Calendar',
      comentarios: 'Comentarios',
      sinComentarios: 'Sin comentarios',
      añadirComentario: 'Añadir comentario',
      comentarioPlaceholder: 'Escribe tu comentario aquí...',
    },
    form: {
      crear: 'Crear Actividad',
      editar: 'Editar Actividad',
      nombre: 'Nombre de la actividad',
      nombrePlaceholder: 'Introduce el nombre de la actividad',
      nombreError: 'El nombre es obligatorio',
      fechaInicioLabel: 'Fecha de inicio',
      fechaInicioError: 'La fecha de inicio es obligatoria',
      fechaFinLabel: 'Fecha de fin',
      fechaFinError: 'La fecha de fin es obligatoria',
      nombreLabel: 'Nombre de la actividad',
      lugarLabel: 'Lugar',
      lugarPlaceholder: 'Introduce el lugar de la actividad',
      lugarError: 'El lugar es obligatorio',
      descripcionLabel: 'Descripción',
      descripcionPlaceholder: 'Describe la actividad',
      tipoLabel: 'Tipo de actividad',
      tipoError: 'Debes seleccionar al menos un tipo de actividad',
      subtipoLabel: 'Subtipo de actividad',
      subtipoError: 'Debes seleccionar al menos un subtipo de actividad',
      estadoLabel: 'Estado',
      dificultadLabel: 'Dificultad',
      responsablesLabel: 'Responsables y participantes',
      responsableActividadLabel: 'Responsable de la actividad',
      responsableLabel: 'Responsable',
      responsableMaterialLabel: 'Responsable de material',
      seleccionaResponsable: 'Selecciona un responsable',
      participantesLabel: 'Participantes',
      enlacesLabel: 'Enlaces',
      topoLabel: 'Topografías',
      wikilocLabel: 'Tracks de Wikiloc',
      driveLabel: 'Archivos de Google Drive',
      webLabel: 'Páginas Web',
      cancelarLabel: 'Cancelar',
      actualizarLabel: 'Actualizar',
      crearLabel: 'Crear',
      necesidadMaterialLabel: 'Necesita material',
      materialesLabel: 'Materiales necesarios',
      guardarButton: 'Guardar',
    },
    estado: {
      planificada: 'Planificada',
      en_curso: 'En curso',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada'
    },
    tipo: {
      espeleologia: 'Espeleología',
      barranquismo: 'Barranquismo',
      exterior: 'Exterior'
    },
    toast: {
      actividadCreada: 'Actividad creada',
      actividadCreadaDesc: 'La actividad ha sido creada con éxito',
      actividadActualizada: 'Actividad actualizada',
      actividadActualizadaDesc: 'La actividad ha sido actualizada con éxito',
      errorGuardar: 'Error',
      errorGuardarDesc: 'Ha ocurrido un error al guardar la actividad. Por favor, inténtalo de nuevo.',
    },
    materiales: {
      procesandoPrestamos: 'Procesando préstamos para actividad {nombre} (ID: {id})',
      materialesEnActividad: 'Materiales en actividad: {cantidad}',
      prestamosExistentes: 'Préstamos existentes: {cantidad}',
      actualizandoPrestamo: 'Actualizando préstamo para {nombre} ({cantidad} unidades)',
      creandoPrestamo: 'Creando nuevo préstamo para {nombre} ({cantidad} unidades)',
      materialesNoAsignados: 'El material "{nombre}" ya no está asignado a la actividad "{actividad}". Por favor, regístralo como devuelto.',
      notificandoMaterial: 'Notificando sobre material que ya no está en la actividad: {nombre}'
    },
    service: {
      errors: {
        crear: 'Error al crear actividad',
        actualizar: 'Error al actualizar actividad',
        obtener: 'Error al obtener actividad',
        listar: 'Error al listar actividades',
        eliminar: 'Error al eliminar actividad',
        comentario: 'Error al añadir comentario',
        cancelar: 'Error al cancelar actividad',
        obtenerUsuario: 'Error al obtener actividades del usuario',
        obtenerProximas: 'Error al obtener actividades próximas',
        obtenerClasificadas: 'Error al obtener actividades clasificadas',
        finalizar: 'Error al finalizar actividad',
        crearPrestamos: 'Error al crear préstamos para la actividad',
        enviarNotificaciones: 'Error al enviar notificaciones de nueva actividad'
      },
      exceptions: {
        noExiste: 'La actividad no existe',
        noEncontrada: 'Actividad no encontrada'
      },
      notifications: {
        devolucionMaterial: 'La actividad "{nombre}" ha finalizado. Por favor, recuerda devolver todo el material utilizado.',
        nuevaActividad: 'Nueva actividad registrada: {nombre} ({tipos})',
        materialNoAsignado: 'El material "{nombre}" ya no está asignado a la actividad "{actividad}". Por favor, regístralo como devuelto.'
      }
    }
  }
};

// Usar funciones que acepten parámetros en lugar de acceder directamente a AuthProvider

export const getUserWelcomeMessage = (username: string) => `Bienvenido, ${username}`;

// Exportación por defecto para facilitar la importación
export default messages;