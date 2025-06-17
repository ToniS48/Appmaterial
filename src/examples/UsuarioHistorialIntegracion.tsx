/**
 * Ejemplo completo de integración del sistema de seguimiento de usuarios
 * Demuestra el uso del hook y service para gestionar eventos de usuarios
 */
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  VStack, 
  HStack, 
  Text, 
  Alert, 
  AlertIcon,
  Divider,
  Code,
  useToast
} from '@chakra-ui/react';
import { 
  TipoEventoUsuario, 
  EstadoAprobacion, 
  EstadoActividad 
} from '../types/usuarioHistorial';
import { Usuario } from '../types/usuario';
import { useUsuarioHistorial } from '../hooks/useUsuarioHistorial';
import { usuarioHistorialService } from '../services/domain/UsuarioHistorialService';

const UsuarioHistorialIntegracion: React.FC = () => {
  const toast = useToast();
  const { 
    registrarEvento, 
    registrarRegistro, 
    registrarAprobacion, 
    registrarSuspension,
    registrarCambioRol,
    actualizarEstadoUsuario,
    cargando,
    error 
  } = useUsuarioHistorial();

  const [resultados, setResultados] = useState<string[]>([]);

  // Usuario de ejemplo
  const usuarioEjemplo: Usuario = {
    uid: 'user-ejemplo-123',
    email: 'juan.perez@example.com',
    nombre: 'Juan',
    apellidos: 'Pérez García',
    rol: 'socio',
    estadoAprobacion: EstadoAprobacion.PENDIENTE,
    estadoActividad: EstadoActividad.INACTIVO,
    pendienteVerificacion: true,
    fechaRegistro: new Date(),
    fechaCreacion: new Date() as any
  };

  const administrador = {
    id: 'admin-123',
    nombre: 'María Admin'
  };

  const añadirResultado = (mensaje: string) => {
    setResultados(prev => [...prev, `${new Date().toLocaleTimeString()}: ${mensaje}`]);
  };

  // Ejemplo 1: Ciclo completo de registro y aprobación
  const ejemploCicloCompleto = async () => {
    try {
      añadirResultado('Iniciando ciclo completo de usuario...');

      // 1. Registrar nuevo usuario
      const registroId = await registrarRegistro(usuarioEjemplo);
      añadirResultado(`✅ Usuario registrado (ID: ${registroId})`);

      // 2. Simular espera...
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Aprobar usuario
      const aprobacionId = await registrarAprobacion(
        usuarioEjemplo, 
        administrador.id, 
        administrador.nombre
      );
      añadirResultado(`✅ Usuario aprobado (ID: ${aprobacionId})`);

      // 4. Simular participación en actividad
      await registrarEvento({
        usuarioId: usuarioEjemplo.uid,
        nombreUsuario: `${usuarioEjemplo.nombre} ${usuarioEjemplo.apellidos}`,
        emailUsuario: usuarioEjemplo.email,
        tipoEvento: TipoEventoUsuario.ULTIMA_CONEXION,
        descripcion: 'Participación en actividad de escalada',
        actividadId: 'actividad-escalada-123',
        actividadNombre: 'Escalada en Risco Caído',
        observaciones: 'Primera participación en actividad'
      });
      añadirResultado(`✅ Participación en actividad registrada`);

      toast({
        title: 'Ciclo completado',
        description: 'Se registró el ciclo completo del usuario exitosamente',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

    } catch (error) {
      añadirResultado(`❌ Error: ${error}`);
    }
  };

  // Ejemplo 2: Gestión de suspensión
  const ejemploSuspension = async () => {
    try {
      añadirResultado('Iniciando proceso de suspensión...');

      const suspensionId = await registrarSuspension(
        usuarioEjemplo,
        'Incumplimiento de normas de seguridad',
        administrador.id,
        administrador.nombre
      );
      añadirResultado(`⚠️ Usuario suspendido (ID: ${suspensionId})`);

      // Actualizar estado del usuario
      const estadoActualizado = await actualizarEstadoUsuario(
        usuarioEjemplo.uid, 
        { ...usuarioEjemplo, estadoActividad: EstadoActividad.SUSPENDIDO }
      );
      
      if (estadoActualizado) {
        añadirResultado(`🔄 Estado actualizado: ${estadoActualizado.cambios.join(', ')}`);
      }

    } catch (error) {
      añadirResultado(`❌ Error en suspensión: ${error}`);
    }
  };

  // Ejemplo 3: Cambio de rol
  const ejemploCambioRol = async () => {
    try {
      añadirResultado('Iniciando cambio de rol...');

      const cambioId = await registrarCambioRol(
        usuarioEjemplo,
        'socio',
        'vocal',
        administrador.id,
        administrador.nombre
      );
      añadirResultado(`🔄 Rol cambiado de socio a vocal (ID: ${cambioId})`);

    } catch (error) {
      añadirResultado(`❌ Error en cambio de rol: ${error}`);
    }
  };

  // Ejemplo 4: Consulta de estadísticas
  const ejemploEstadisticas = async () => {
    try {
      añadirResultado('Consultando estadísticas anuales...');

      const estadisticas = await usuarioHistorialService.obtenerEstadisticasAnuales(2025);
      añadirResultado(`📊 Estadísticas 2025:`);
      añadirResultado(`   - Usuarios registrados: ${estadisticas.usuariosRegistrados}`);
      añadirResultado(`   - Usuarios aprobados: ${estadisticas.usuariosAprobados}`);
      añadirResultado(`   - Tasa de aprobación: ${estadisticas.tasaAprobacion.toFixed(1)}%`);
      añadirResultado(`   - Usuarios activos: ${estadisticas.usuariosActivos}`);
      añadirResultado(`   - Tasa de actividad: ${estadisticas.tasaActividad.toFixed(1)}%`);

    } catch (error) {
      añadirResultado(`❌ Error al consultar estadísticas: ${error}`);
    }
  };

  // Ejemplo 5: Generar reporte
  const ejemploReporte = async () => {
    try {
      añadirResultado('Generando reporte anual...');

      const reporte = await usuarioHistorialService.generarReporteAnual(2025);
      añadirResultado(`📑 Reporte generado (${reporte.length} caracteres)`);
      añadirResultado(`   Primeras líneas: "${reporte.substring(0, 100)}..."`);

    } catch (error) {
      añadirResultado(`❌ Error al generar reporte: ${error}`);
    }
  };

  const limpiarResultados = () => {
    setResultados([]);
  };

  return (
    <Box p={6} maxWidth="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600" mb={4}>
            🧪 Sistema de Seguimiento de Usuarios - Ejemplos de Integración
          </Text>
          
          <Alert status="info" mb={4}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Ejemplos interactivos</Text>
              <Text fontSize="sm">
                Estos botones demuestran cómo integrar el sistema de seguimiento de usuarios 
                en diferentes flujos de la aplicación.
              </Text>
            </Box>
          </Alert>
        </Box>

        {/* Información del usuario de ejemplo */}
        <Box bg="gray.50" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={2}>👤 Usuario de ejemplo:</Text>
          <Text fontSize="sm">
            <Code>{usuarioEjemplo.nombre} {usuarioEjemplo.apellidos}</Code> - 
            <Code>{usuarioEjemplo.email}</Code> - 
            <Code>Rol: {usuarioEjemplo.rol}</Code>
          </Text>
        </Box>

        {/* Botones de ejemplo */}
        <VStack spacing={3} align="stretch">
          <Text fontWeight="bold">🚀 Ejemplos de uso:</Text>
          
          <HStack wrap="wrap" spacing={3}>
            <Button 
              colorScheme="blue" 
              onClick={ejemploCicloCompleto}
              isLoading={cargando}
              size="sm"
            >
              1. Ciclo Completo
            </Button>
            
            <Button 
              colorScheme="orange" 
              onClick={ejemploSuspension}
              isLoading={cargando}
              size="sm"
            >
              2. Suspensión
            </Button>
            
            <Button 
              colorScheme="purple" 
              onClick={ejemploCambioRol}
              isLoading={cargando}
              size="sm"
            >
              3. Cambio de Rol
            </Button>
            
            <Button 
              colorScheme="teal" 
              onClick={ejemploEstadisticas}
              isLoading={cargando}
              size="sm"
            >
              4. Estadísticas
            </Button>
            
            <Button 
              colorScheme="green" 
              onClick={ejemploReporte}
              isLoading={cargando}
              size="sm"
            >
              5. Reporte
            </Button>
          </HStack>
        </VStack>

        <Divider />

        {/* Resultados */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="bold">📋 Resultados de ejecución:</Text>
            <Button size="sm" variant="outline" onClick={limpiarResultados}>
              Limpiar
            </Button>
          </HStack>
          
          <Box 
            bg="black" 
            color="green.300" 
            p={4} 
            borderRadius="md" 
            fontFamily="monospace" 
            fontSize="sm"
            maxHeight="300px"
            overflowY="auto"
          >
            {resultados.length > 0 ? (
              resultados.map((resultado, index) => (
                <Text key={index}>{resultado}</Text>
              ))
            ) : (
              <Text color="gray.500">Ejecuta un ejemplo para ver los resultados...</Text>
            )}
          </Box>
        </Box>

        {/* Error display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        )}

        {/* Código de ejemplo */}
        <Box>
          <Text fontWeight="bold" mb={3}>💻 Ejemplo de código - Hook de integración:</Text>
          <Box bg="gray.100" p={4} borderRadius="md" fontSize="sm" fontFamily="monospace">
            <Text>{`
// 1. Importar el hook
import { useUsuarioHistorial } from '../hooks/useUsuarioHistorial';

// 2. Usar en componente
const { registrarAprobacion, cargando } = useUsuarioHistorial();

// 3. Registrar evento de aprobación
await registrarAprobacion(
  usuario, 
  adminId, 
  adminNombre
);
`}</Text>
          </Box>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={3}>🔧 Ejemplo de código - Service directo:</Text>
          <Box bg="gray.100" p={4} borderRadius="md" fontSize="sm" fontFamily="monospace">
            <Text>{`
// 1. Importar el service
import { usuarioHistorialService } from '../services/domain/UsuarioHistorialService';

// 2. Obtener estadísticas
const stats = await usuarioHistorialService.obtenerEstadisticasAnuales(2025);

// 3. Generar reporte
const reporte = await usuarioHistorialService.generarReporteAnual(2025);
`}</Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default UsuarioHistorialIntegracion;
