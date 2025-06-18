import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { queryCache, CACHE_KEYS } from '../../utils/queryCache';

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
  const { userProfile } = useAuth();
  
  // Color mode values para tema claro/oscuro
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

  // Instancias de repositorios memoizadas
  const usuarioRepository = useMemo(() => new UsuarioRepository(), []);
  const prestamoRepository = useMemo(() => new PrestamoRepository(), []);
  const materialRepository = useMemo(() => new MaterialRepository(), []);  // Función para cargar estadísticas optimizada con cache
  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar estadísticas usando cache para evitar consultas duplicadas
      const [
        estadUsuarios,
        estadPrestamos,
        estadMateriales,
        estadActividades
      ] = await Promise.all([
        queryCache.query(
          CACHE_KEYS.ESTADISTICAS_USUARIOS,
          () => usuarioRepository.getEstadisticas(),
          60000 // Cache por 1 minuto
        ),
        queryCache.query(
          CACHE_KEYS.ESTADISTICAS_PRESTAMOS,
          () => prestamoRepository.getEstadisticas(),
          60000
        ),
        queryCache.query(
          CACHE_KEYS.ESTADISTICAS_MATERIALES,
          () => materialRepository.getEstadisticas(),
          60000
        ),
        queryCache.query(
          CACHE_KEYS.ESTADISTICAS_ACTIVIDADES,
          () => obtenerEstadisticasActividades(),
          60000
        )
      ]);

      setEstadisticas({
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

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Estadísticas cargadas con cache:', queryCache.getStats());
      }
    } catch (err) {
      console.error('❌ Error cargando estadísticas:', err);
      setError('Error al cargar las estadísticas del sistema');
    } finally {
      setLoading(false);
    }
  }, []); // ✅ CORRECCIÓN: Dependencias vacías para evitar bucles

  // Cargar estadísticas al montar el componente UNA SOLA VEZ
  useEffect(() => {
    cargarEstadisticas();
  }, []); // ✅ CORRECCIÓN: Dependencias vacías  // Función para procesar estadísticas dinámicamente (memoizada para evitar recálculos)
  const processStatValue = useCallback((card: DashboardCard): { value?: string | number; label?: string } => {
    // Si no tiene statValue o statLabel configurados, no mostrar estadísticas
    if (!card.statValue && card.statValue !== 0) return {};
    if (!card.statLabel) return {};

    // Casos especiales basados en el contenido del statLabel
    if (card.statLabel.includes('material disponible')) {
      const porcentaje = estadisticas.materiales.total > 0 
        ? Math.round((estadisticas.materiales.disponible / estadisticas.materiales.total) * 100) 
        : 0;
      return { value: `${porcentaje}%`, label: card.statLabel };
    }
    
    if (card.statLabel.includes('préstamos activos')) {
      return { value: estadisticas.prestamos.activos, label: card.statLabel };
    }
    
    if (card.statLabel.includes('usuarios en sistema')) {
      return { value: estadisticas.usuarios.total, label: card.statLabel };
    }
    
    if (card.statLabel.includes('notificaciones pendientes')) {
      return { value: 0, label: card.statLabel };
    }
    
    if (card.statLabel.includes('reportes generados')) {
      return { value: 0, label: card.statLabel };
    }

    // Valor por defecto
    return { value: card.statValue, label: card.statLabel };
  }, [estadisticas]);

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
