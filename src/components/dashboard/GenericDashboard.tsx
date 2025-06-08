import React, { useState, useEffect } from 'react';
import { SimpleGrid, Heading, VStack, Spinner, Alert, AlertIcon, Divider, Box, Text, useColorModeValue } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { FiUsers, FiSettings } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import { AccessCard } from '../../utils/dashboardUtils';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';
import { obtenerEstadisticasActividades } from '../../services/actividadService';
import { UsuarioRepository } from '../../repositories/UsuarioRepository';
import { PrestamoRepository } from '../../repositories/PrestamoRepository';
import { MaterialRepository } from '../../repositories/MaterialRepository';

// Tipo para definir una tarjeta del dashboard
export interface DashboardCard {
  title: string;
  icon: IconType;
  route: string;
  description: string;
  colorScheme: string;
  statValue?: string | number;
  statLabel?: string;
  showOnlyForAdmin?: boolean; // Para cards exclusivos de admin
}

// Props del componente GenericDashboard
interface GenericDashboardProps {
  userRole: 'admin' | 'vocal';
  cards: DashboardCard[];
  socioCards?: DashboardCard[]; // Cards adicionales de funcionalidades de socio
}

const GenericDashboard: React.FC<GenericDashboardProps> = ({ userRole, cards, socioCards }) => {
  const { userProfile } = useAuth();  // Color mode values para tema claro/oscuro
  const dividerColor = useColorModeValue('gray.300', 'gray.600');
  
  // Estados para las estadísticas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState({
    usuarios: { total: 0, activos: 0, inactivos: 0 },
    prestamos: { total: 0, activos: 0, vencidos: 0 },
    materiales: { total: 0, disponible: 0 },
    actividades: { total: 0, planificadas: 0, enCurso: 0, finalizadas: 0 }
  });

  // Instancias de repositorios
  const usuarioRepository = new UsuarioRepository();
  const prestamoRepository = new PrestamoRepository();
  const materialRepository = new MaterialRepository();

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar estadísticas en paralelo
        const [
          estadUsuarios,
          estadPrestamos,
          estadMateriales,
          estadActividades
        ] = await Promise.all([
          usuarioRepository.getEstadisticas(),
          prestamoRepository.getEstadisticas(),
          materialRepository.getEstadisticas(),
          obtenerEstadisticasActividades()
        ]);        setEstadisticas({
          usuarios: {
            total: estadUsuarios.total,
            activos: estadUsuarios.activos,
            inactivos: estadUsuarios.inactivos
          },
          prestamos: {
            total: estadPrestamos.total,
            activos: estadPrestamos.activos,
            vencidos: estadPrestamos.vencidos
          },
          materiales: {
            total: estadMateriales.total,
            disponible: estadMateriales.porEstado?.disponible || 0
          },
          actividades: {
            total: estadActividades.planificadas + estadActividades.enCurso + estadActividades.finalizadas + (estadActividades.canceladas || 0),
            planificadas: estadActividades.planificadas,
            enCurso: estadActividades.enCurso,
            finalizadas: estadActividades.finalizadas
          }
        });

        console.log('Estadísticas cargadas:', {
          usuarios: estadUsuarios,
          prestamos: estadPrestamos,
          materiales: estadMateriales,
          actividades: estadActividades
        });
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
        setError('Error al cargar las estadísticas del sistema');
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);  // Función para procesar estadísticas dinámicamente
  const processStatValue = (card: DashboardCard): { value?: string | number; label?: string } => {
    // Si no tiene statValue o statLabel configurados, no mostrar estadísticas
    if (!card.statValue && card.statValue !== 0) return {};
    if (!card.statLabel) return {};

    console.log(`Procesando estadística para ${card.title}:`, {
      statLabel: card.statLabel,
      estadisticas
    });

    // Casos especiales basados en el contenido del statLabel
    if (card.statLabel.includes('material disponible')) {
      const porcentaje = estadisticas.materiales.total > 0 
        ? Math.round((estadisticas.materiales.disponible / estadisticas.materiales.total) * 100) 
        : 0;
      const result = { value: `${porcentaje}%`, label: card.statLabel };
      console.log(`Material disponible calculado:`, result);
      return result;
    }
    
    if (card.statLabel.includes('préstamos activos')) {
      const result = { value: estadisticas.prestamos.activos, label: card.statLabel };
      console.log(`Préstamos activos:`, result);
      return result;
    }
    
    if (card.statLabel.includes('usuarios en sistema')) {
      const result = { value: estadisticas.usuarios.total, label: card.statLabel };
      console.log(`Usuarios en sistema:`, result);
      return result;
    }
      if (card.statLabel.includes('notificaciones pendientes')) {
      // Por ahora usamos un valor placeholder - esto debería conectarse con un servicio de notificaciones real
      const result = { value: 0, label: card.statLabel };
      console.log(`Notificaciones pendientes:`, result);
      return result;
    }
      if (card.statLabel.includes('reportes generados')) {
      // Por ahora usamos un valor placeholder - esto debería conectarse con un servicio de reportes real
      const result = { value: 0, label: card.statLabel };
      console.log(`Reportes generados:`, result);
      return result;
    }

    // Valor por defecto
    const result = { value: card.statValue, label: card.statLabel };
    console.log(`Valor por defecto:`, result);
    return result;
  };

  // Filtrar cards según el rol
  const filteredCards = cards.filter(card => 
    !card.showOnlyForAdmin || (card.showOnlyForAdmin && userRole === 'admin')
  );

  // Obtener título y mensaje de bienvenida
  const dashboardTitle = userRole === 'admin' ? messages.dashboard.titulo.admin : messages.dashboard.titulo.vocal;
  const welcomeMessage = userRole === 'admin' 
    ? messages.dashboard.bienvenida.admin.replace('{nombre}', userProfile?.nombre || '')
    : messages.dashboard.bienvenida.vocal.replace('{nombre}', userProfile?.nombre || '');  return (
    <DashboardLayout title={dashboardTitle}>      <VStack spacing={4} p={2}>
        <Heading size="lg" textAlign="center">
          {welcomeMessage}
        </Heading>{/* Sección de Apps Comunes (Socio) */}
        {loading ? (
          <VStack spacing={4}>
            <Spinner size="lg" />
            <Heading size="md" color="gray.500">Cargando estadísticas...</Heading>
          </VStack>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>        ) : (
          <>            {socioCards && socioCards.length > 0 && (
              <>                <Box width="100%" py={1}>
                  <VStack spacing={4} align="stretch">
                    <SimpleGrid 
                      columns={{ base: 1, md: 2, lg: 3, xl: Math.min(socioCards.length, 4) }} 
                      spacing={4} 
                      width="100%"
                    >
                      {socioCards.map((card, index) => (
                        <AccessCard
                          key={`socio-${card.title}-${index}`}
                          title={card.title}
                          icon={card.icon}
                          to={card.route}
                          description={card.description}
                          colorScheme={card.colorScheme}
                        />
                      ))}
                    </SimpleGrid>
                  </VStack>
                </Box>                  {/* Línea divisoria sutil */}
                <Divider 
                  borderColor={dividerColor}
                  borderWidth="1px"
                  my={2}
                  opacity={0.4}
                />
              </>
            )}            {/* Sección de Apps Administración */}
            <Box width="100%" py={1}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid 
                  columns={{ base: 1, md: 2, lg: 3, xl: Math.min(filteredCards.length, 4) }} 
                  spacing={4} 
                  width="100%"
                >{filteredCards.map((card, index) => {
                    const { value, label } = processStatValue(card);
                    return (
                      <AccessCard
                        key={`${card.title}-${index}`}
                        title={card.title}
                        icon={card.icon}
                        to={card.route}
                        description={card.description}
                        colorScheme={card.colorScheme}
                        statValue={value}
                        statLabel={label}
                      />
                    );                  })}
                </SimpleGrid>
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </DashboardLayout>
  );
};

export default GenericDashboard;
