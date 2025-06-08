import React, { useState, useEffect } from 'react';
import {
  Box, 
  Heading, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  StatArrow,
  Card,
  CardBody,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Text,
  HStack,
  Progress
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaBox, 
  FaCalendarAlt, 
  FaExchangeAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';
import { IconWrapper } from '../../utils/iconUtils';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { UsuarioRepository } from '../../repositories/UsuarioRepository';
import { PrestamoRepository } from '../../repositories/PrestamoRepository';
import { MaterialRepository } from '../../repositories/MaterialRepository';
import { obtenerEstadisticasActividades } from '../../services/actividadService';

interface EstadisticasData {
  usuarios: {
    total: number;
    activos: number;
    inactivos?: number;
    socios?: number;
    nuevosEsteMes?: number;
  };
  prestamos: {
    total: number;
    activos: number;
    vencidos: number;
    completados: number;
    promedioDevolucion?: number;
    pendientesRevision?: number;
  };
  materiales: {
    total: number;
    disponible: number;
    prestado: number;
    mantenimiento: number;
    perdido?: number;
  };
  actividades: {
    total: number;
    planificadas: number;
    enCurso: number;
    finalizadas: number;
    canceladas?: number;
  };
}

interface GenericEstadisticasProps {
  userRole: 'admin' | 'vocal';
  pageTitle: string;
}

const GenericEstadisticas: React.FC<GenericEstadisticasProps> = ({ userRole, pageTitle }) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasData>({
    usuarios: { total: 0, activos: 0 },
    prestamos: { total: 0, activos: 0, vencidos: 0, completados: 0 },
    materiales: { total: 0, disponible: 0, prestado: 0, mantenimiento: 0 },
    actividades: { total: 0, planificadas: 0, enCurso: 0, finalizadas: 0 }
  });

  // Instancias de repositorios
  const usuarioRepo = new UsuarioRepository();
  const prestamoRepo = new PrestamoRepository();
  const materialRepo = new MaterialRepository();

  const obtenerEstadisticas = async () => {
    try {
      setLoading(true);      // Estadísticas de usuarios
      const usuarios = await usuarioRepo.find();
      const usuariosActivos = usuarios.filter(u => u.activo).length;
      const usuariosSocios = usuarios.filter(u => u.rol === 'socio').length;      // Estadísticas de préstamos
      const prestamos = await prestamoRepo.find();
      const prestamosActivos = prestamos.filter(p => p.estado === 'en_uso').length;      const prestamosVencidos = prestamos.filter(p => {
        if (p.estado !== 'en_uso') return false;
        const hoy = new Date();
        const fechaDevolucion = p.fechaDevolucionPrevista instanceof Date ? 
          p.fechaDevolucionPrevista : p.fechaDevolucionPrevista.toDate();
        return fechaDevolucion < hoy;
      }).length;
      const prestamosCompletados = prestamos.filter(p => p.estado === 'devuelto').length;
        // Estadísticas de materiales
      const materiales = await materialRepo.find();
      const materialesDisponibles = materiales.filter(m => m.estado === 'disponible').length;
      const materialesPrestados = materiales.filter(m => m.estado === 'prestado').length;
      const materialesMantenimiento = materiales.filter(m => m.estado === 'mantenimiento').length;
      
      // Estadísticas de actividades
      const actividadesStats = await obtenerEstadisticasActividades();

      let usuariosStats;
      if (userRole === 'admin') {
        const usuariosInactivos = usuarios.filter(u => !u.activo).length;
        const fechaInicioMes = new Date();
        fechaInicioMes.setDate(1);        const nuevosEsteMes = usuarios.filter(u => {
          if (!u.fechaCreacion) return false;
          const fechaCreacion = u.fechaCreacion instanceof Date ? 
            u.fechaCreacion : u.fechaCreacion.toDate();
          return fechaCreacion >= fechaInicioMes;
        }).length;

        usuariosStats = {
          total: usuarios.length,
          activos: usuariosActivos,
          inactivos: usuariosInactivos,
          nuevosEsteMes
        };
      } else {
        usuariosStats = {
          total: usuarios.length,
          activos: usuariosActivos,
          socios: usuariosSocios
        };
      }

      let prestamosStats;
      if (userRole === 'admin') {
        // Calcular promedio de devolución para admin
        const prestamosDevueltos = prestamos.filter(p => p.estado === 'devuelto' && p.fechaDevolucion);
        const promedioDevolucion = prestamosDevueltos.length > 0 ? 
          prestamosDevueltos.reduce((acc, p) => {            const fechaInicio = p.fechaPrestamo instanceof Timestamp ? p.fechaPrestamo.toDate() : new Date(p.fechaPrestamo);
            const fechaDevolucion = p.fechaDevolucion instanceof Timestamp ? p.fechaDevolucion.toDate() : new Date(p.fechaDevolucion!);
            const dias = Math.ceil((fechaDevolucion.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
            return acc + dias;
          }, 0) / prestamosDevueltos.length : 0;

        prestamosStats = {
          total: prestamos.length,
          activos: prestamosActivos,
          vencidos: prestamosVencidos,
          completados: prestamosCompletados,
          promedioDevolucion: Math.round(promedioDevolucion)
        };
      } else {
        const pendientesRevision = prestamos.filter(p => p.estado === 'pendiente').length;
        prestamosStats = {
          total: prestamos.length,
          activos: prestamosActivos,
          vencidos: prestamosVencidos,
          completados: prestamosCompletados,
          pendientesRevision
        };
      }

      let materialesStats;
      if (userRole === 'admin') {
        const materialesPerdidos = materiales.filter(m => m.estado === 'perdido').length;
        materialesStats = {
          total: materiales.length,
          disponible: materialesDisponibles,
          prestado: materialesPrestados,
          mantenimiento: materialesMantenimiento,
          perdido: materialesPerdidos
        };
      } else {
        materialesStats = {
          total: materiales.length,
          disponible: materialesDisponibles,
          prestado: materialesPrestados,
          mantenimiento: materialesMantenimiento
        };
      }

      setEstadisticas({
        usuarios: usuariosStats,
        prestamos: prestamosStats,
        materiales: materialesStats,
        actividades: actividadesStats
      });

    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerEstadisticas();
  }, [userRole]);
  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <Spinner size="xl" color="brand.500" />
        </Box>
      </DashboardLayout>
    );
  }
  if (error) {
    return (
      <DashboardLayout>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">{pageTitle}</Heading>
        
        {/* Estadísticas Principales */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {/* Usuarios */}          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <IconWrapper icon={FaUsers} color="blue.500" size="24px" />
                  <VStack align="start" spacing={0}>
                    <StatLabel>Usuarios Registrados</StatLabel>
                    <StatNumber>{estadisticas.usuarios.total}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Activos: {estadisticas.usuarios.activos}
                    </StatHelpText>
                  </VStack>
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          {/* Materiales */}
          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <IconWrapper icon={FaBox} color="orange.500" size="24px" />
                  <VStack align="start" spacing={0}>
                    <StatLabel>Total Materiales</StatLabel>
                    <StatNumber>{estadisticas.materiales.total}</StatNumber>
                    <StatHelpText>
                      Disponibles: {estadisticas.materiales.disponible}
                    </StatHelpText>
                  </VStack>
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          {/* Préstamos */}
          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <IconWrapper icon={FaExchangeAlt} color="green.500" size="24px" />
                  <VStack align="start" spacing={0}>
                    <StatLabel>Total Préstamos</StatLabel>
                    <StatNumber>{estadisticas.prestamos.total}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Activos: {estadisticas.prestamos.activos}
                    </StatHelpText>
                  </VStack>
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          {/* Actividades */}
          <Card>
            <CardBody>
              <Stat>
                <HStack>
                  <IconWrapper icon={FaCalendarAlt} color="purple.500" size="24px" />
                  <VStack align="start" spacing={0}>
                    <StatLabel>Total Actividades</StatLabel>
                    <StatNumber>{estadisticas.actividades.total}</StatNumber>
                    <StatHelpText>
                      Planificadas: {estadisticas.actividades.planificadas}
                    </StatHelpText>
                  </VStack>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Detalles por Categoría */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Detalle de Materiales */}
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack spacing={2}>
                  <IconWrapper icon={FaBox} color="orange.500" size="20px" />
                  <Heading size="md">Estado de Materiales</Heading>
                </HStack>
                <VStack spacing={3} width="100%">
                  <HStack justify="space-between" width="100%">
                    <HStack>
                      <IconWrapper icon={FaCheckCircle} color="green.500" size="16px" />
                      <Text>Disponibles</Text>
                    </HStack>
                    <Text fontWeight="bold">{estadisticas.materiales.disponible}</Text>
                  </HStack>
                  
                  <HStack justify="space-between" width="100%">
                    <HStack>
                      <IconWrapper icon={FaClock} color="blue.500" size="16px" />
                      <Text>En préstamo</Text>
                    </HStack>
                    <Text fontWeight="bold">{estadisticas.materiales.prestado}</Text>
                  </HStack>
                  
                  <HStack justify="space-between" width="100%">
                    <HStack>
                      <IconWrapper icon={FaExclamationTriangle} color="yellow.500" size="16px" />
                      <Text>En mantenimiento</Text>
                    </HStack>
                    <Text fontWeight="bold">{estadisticas.materiales.mantenimiento}</Text>
                  </HStack>

                  {userRole === 'admin' && estadisticas.materiales.perdido !== undefined && (
                    <HStack justify="space-between" width="100%">
                      <HStack>
                        <IconWrapper icon={FaExclamationTriangle} color="red.500" size="16px" />
                        <Text>Perdidos</Text>
                      </HStack>
                      <Text fontWeight="bold">{estadisticas.materiales.perdido}</Text>
                    </HStack>
                  )}
                  
                  <Divider />
                  <Progress 
                    value={(estadisticas.materiales.disponible / estadisticas.materiales.total) * 100} 
                    colorScheme="green" 
                    size="sm" 
                    width="100%"
                  />
                  <Text fontSize="sm" color="gray.600">
                    {Math.round((estadisticas.materiales.disponible / estadisticas.materiales.total) * 100)}% disponible
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Gestión de Préstamos */}
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack spacing={2}>
                  <IconWrapper icon={FaExchangeAlt} color="green.500" size="20px" />
                  <Heading size="md">Gestión de Préstamos</Heading>
                </HStack>
                <VStack spacing={3} width="100%">
                  <HStack justify="space-between" width="100%">
                    <Text>Préstamos completados</Text>
                    <Text fontWeight="bold" color="green.500">{estadisticas.prestamos.completados}</Text>
                  </HStack>
                  
                  <HStack justify="space-between" width="100%">
                    <Text>Préstamos activos</Text>
                    <Text fontWeight="bold" color="blue.500">{estadisticas.prestamos.activos}</Text>
                  </HStack>
                  
                  <HStack justify="space-between" width="100%">
                    <Text>Préstamos vencidos</Text>
                    <Text fontWeight="bold" color="red.500">{estadisticas.prestamos.vencidos}</Text>
                  </HStack>

                  {userRole === 'admin' && estadisticas.prestamos.promedioDevolucion !== undefined && (
                    <HStack justify="space-between" width="100%">
                      <Text>Promedio devolución</Text>
                      <Text fontWeight="bold">{estadisticas.prestamos.promedioDevolucion} días</Text>
                    </HStack>
                  )}

                  {userRole === 'vocal' && estadisticas.prestamos.pendientesRevision !== undefined && (
                    <HStack justify="space-between" width="100%">
                      <Text>Pendientes revisión</Text>
                      <Text fontWeight="bold" color="orange.500">{estadisticas.prestamos.pendientesRevision}</Text>
                    </HStack>
                  )}
                  
                  <Divider />
                  <Progress 
                    value={estadisticas.prestamos.total > 0 ? (estadisticas.prestamos.completados / estadisticas.prestamos.total) * 100 : 0}
                    colorScheme="green" 
                    size="sm" 
                    width="100%"
                  />
                  <Text fontSize="sm" color="gray.600">
                    {estadisticas.prestamos.total > 0 ? Math.round((estadisticas.prestamos.completados / estadisticas.prestamos.total) * 100) : 0}% completados
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Estadísticas de Actividades */}
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack spacing={2}>
                  <IconWrapper icon={FaCalendarAlt} color="purple.500" size="20px" />
                  <Heading size="md">Estado de Actividades</Heading>
                </HStack>
                <VStack spacing={3} width="100%">
                  <HStack justify="space-between" width="100%">
                    <Text>Planificadas</Text>
                    <Text fontWeight="bold" color="blue.500">{estadisticas.actividades.planificadas}</Text>
                  </HStack>
                  
                  <HStack justify="space-between" width="100%">
                    <Text>En curso</Text>
                    <Text fontWeight="bold" color="orange.500">{estadisticas.actividades.enCurso}</Text>
                  </HStack>
                  
                  <HStack justify="space-between" width="100%">
                    <Text>Finalizadas</Text>
                    <Text fontWeight="bold" color="green.500">{estadisticas.actividades.finalizadas}</Text>
                  </HStack>

                  {userRole === 'admin' && estadisticas.actividades.canceladas !== undefined && (
                    <HStack justify="space-between" width="100%">
                      <Text>Canceladas</Text>
                      <Text fontWeight="bold" color="red.500">{estadisticas.actividades.canceladas}</Text>
                    </HStack>
                  )}
                  
                  <Divider />
                  <Progress 
                    value={estadisticas.actividades.total > 0 ? (estadisticas.actividades.finalizadas / estadisticas.actividades.total) * 100 : 0}
                    colorScheme="green" 
                    size="sm" 
                    width="100%"
                  />
                  <Text fontSize="sm" color="gray.600">
                    {estadisticas.actividades.total > 0 ? Math.round((estadisticas.actividades.finalizadas / estadisticas.actividades.total) * 100) : 0}% completadas
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Usuarios adicionales para admin o información específica para vocal */}
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack spacing={2}>
                  <IconWrapper icon={FaUsers} color="blue.500" size="20px" />
                  <Heading size="md">
                    {userRole === 'admin' ? 'Detalles de Usuarios' : 'Información de Usuarios'}
                  </Heading>
                </HStack>
                
                {userRole === 'admin' ? (
                  <VStack spacing={3} width="100%">
                    <HStack justify="space-between" width="100%">
                      <Text>Total usuarios</Text>
                      <Text fontWeight="bold">{estadisticas.usuarios.total}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" width="100%">
                      <Text>Usuarios activos</Text>
                      <Text fontWeight="bold" color="green.500">{estadisticas.usuarios.activos}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" width="100%">
                      <Text>Usuarios inactivos</Text>
                      <Text fontWeight="bold" color="red.500">{estadisticas.usuarios.inactivos}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" width="100%">
                      <Text>Nuevos este mes</Text>
                      <Text fontWeight="bold" color="blue.500">{estadisticas.usuarios.nuevosEsteMes}</Text>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack spacing={3} width="100%">
                    <HStack justify="space-between" width="100%">
                      <Text>Total usuarios</Text>
                      <Text fontWeight="bold">{estadisticas.usuarios.total}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" width="100%">
                      <Text>Usuarios activos</Text>
                      <Text fontWeight="bold" color="green.500">{estadisticas.usuarios.activos}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" width="100%">
                      <Text>Socios</Text>
                      <Text fontWeight="bold" color="blue.500">{estadisticas.usuarios.socios}</Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Alertas y Notificaciones */}
        {(estadisticas.prestamos.vencidos > 0 || estadisticas.materiales.mantenimiento > 0) && (
          <Card>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Heading size="md" color="red.600">Alertas del Sistema</Heading>
                
                {estadisticas.prestamos.vencidos > 0 && (
                  <HStack>
                    <IconWrapper icon={FaClock} color="red.500" size="16px" />
                    <Text>
                      Hay {estadisticas.prestamos.vencidos} préstamo(s) vencido(s) que requieren seguimiento
                    </Text>
                  </HStack>
                )}
                
                {estadisticas.materiales.mantenimiento > 0 && (
                  <HStack>
                    <IconWrapper icon={FaExclamationTriangle} color="yellow.500" size="16px" />
                    <Text>
                      Hay {estadisticas.materiales.mantenimiento} item(s) de material en mantenimiento
                    </Text>
                  </HStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </DashboardLayout>
  );
};

export default GenericEstadisticas;
