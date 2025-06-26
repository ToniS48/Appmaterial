import { 
  crearActividad, 
  actualizarActividad, 
  obtenerActividad,
  listarActividades,
  guardarActividad
} from '../../src/services/actividadService';
import { Actividad } from '../../src/types/actividad';
import { db } from '../../src/config/firebase';
import { collection, addDoc, doc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getUniqueParticipanteIds } from '../../src/utils/actividadUtils';
import { obtenerPrestamosPorActividad } from '../../src/services/prestamoService';

// Importar los mocks de Firebase
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

// Importar mocks de servicios
const mockObtenerPrestamosPorActividad = obtenerPrestamosPorActividad as jest.MockedFunction<typeof obtenerPrestamosPorActividad>;

// Mock de Firebase config
jest.mock('../../config/firebase', () => ({
  db: {}
}));

// Mock de Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  deleteDoc: jest.fn(),
  arrayUnion: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1625097600, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))
  }
}));

jest.mock('../../utils/actividadUtils', () => ({
  getUniqueParticipanteIds: jest.fn((ids, creadorId) => [...(ids || []), creadorId]),
  determinarEstadoActividad: jest.fn(() => 'planificada')
}));

// Mock de otros servicios necesarios
jest.mock('../../services/actividadCache', () => ({
  actividadCache: {
    getActividad: jest.fn(),
    setActividad: jest.fn(),
    getActividadesList: jest.fn(),
    setActividadesList: jest.fn(),
    clear: jest.fn()
  }
}));

jest.mock('../../utils/errorHandling', () => ({
  handleFirebaseError: jest.fn()
}));

jest.mock('../../services/prestamoService', () => ({
  crearPrestamo: jest.fn(),
  actualizarPrestamo: jest.fn(),
  obtenerPrestamosPorActividad: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../services/notificacionService', () => ({
  enviarNotificacionMasiva: jest.fn()
}));

jest.mock('../../services/usuarioService', () => ({
  listarUsuarios: jest.fn(),
  obtenerUsuarioPorId: jest.fn()
}));

jest.mock('../../services/MaterialService', () => ({
  obtenerMaterial: jest.fn()
}));

jest.mock('../../utils/transactionUtils', () => ({
  executeTransaction: jest.fn()
}));

jest.mock('../../validation/validationMiddleware', () => ({
  validateWithZod: jest.fn()
}));

jest.mock('../../utils/loggerUtils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Actividad Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks por defecto
    mockCollection.mockReturnValue('actividades' as any);
    mockDoc.mockReturnValue({ id: 'test-doc' } as any);
    
    // Configurar mock de prestamos para devolver array vacío
    mockObtenerPrestamosPorActividad.mockResolvedValue([]);
  });
  
  describe('crearActividad', () => {
    it('debe crear una actividad con los datos proporcionados', async () => {
      // Arrange
      const mockActividad: Omit<Actividad, 'id' | 'fechaCreacion' | 'fechaActualizacion'> = {
        nombre: 'Actividad Test',
        lugar: 'Lugar Test',
        descripcion: 'Descripción Test',
        fechaInicio: Timestamp.fromDate(new Date()),
        fechaFin: Timestamp.fromDate(new Date()),
        tipo: ['espeleologia'],
        subtipo: ['visita'],
        creadorId: 'user123',
        responsableActividadId: 'user123',
        responsableMaterialId: 'user123', // Añadido
        participanteIds: ['user123', 'user456'],
        estado: 'planificada',
        necesidadMaterial: true,
        materiales: [{ materialId: 'mat1', nombre: 'Cuerda', cantidad: 1 }],
        // Propiedades que faltaban:
        comentarios: [],
        enlacesWikiloc: [],
        enlacesTopografias: [],
        enlacesDrive: [],
        enlacesWeb: [],
        enlaces: [],
        imagenesTopografia: [],        archivosAdjuntos: [],
        dificultad: 'media'
      };
      
      const mockDocRef = { 
        id: 'actividad123',
        path: 'actividades/actividad123',
        type: 'document',
        firestore: {},
        converter: null,
        parent: {},
        withConverter: jest.fn()
      } as any;
      mockAddDoc.mockResolvedValue(mockDocRef);
      
      // Act
      const result = await crearActividad(mockActividad);
      
      // Assert
      expect(getUniqueParticipanteIds).toHaveBeenCalledWith(
        mockActividad.participanteIds,
        mockActividad.creadorId,
        mockActividad.responsableActividadId,
        mockActividad.responsableMaterialId
      );
      expect(mockAddDoc).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'actividad123');
      expect(result).toHaveProperty('nombre', 'Actividad Test');
      expect(result).toHaveProperty('creadorId', 'user123');
    });
    
    it('debe manejar errores durante la creación de actividad', async () => {
      // Arrange
      const mockActividad: Omit<Actividad, 'id' | 'fechaCreacion' | 'fechaActualizacion'> = {
        nombre: 'Actividad Test',
        lugar: 'Lugar Test',
        descripcion: '',
        fechaInicio: Timestamp.fromDate(new Date()),
        fechaFin: Timestamp.fromDate(new Date()),
        tipo: ['espeleologia'],
        subtipo: ['visita'],
        creadorId: 'user123',
        responsableActividadId: 'user123',
        responsableMaterialId: 'user123',
        participanteIds: [],
        estado: 'planificada',
        necesidadMaterial: false,
        materiales: [],
        // Propiedades que faltaban:
        comentarios: [],
        enlacesWikiloc: [],
        enlacesTopografias: [],
        enlacesDrive: [],
        enlacesWeb: [],
        enlaces: [],
        imagenesTopografia: [],
        archivosAdjuntos: [],
        dificultad: 'baja'
      };
        const errorMessage = 'Error de prueba';
      mockAddDoc.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(crearActividad(mockActividad)).rejects.toThrow(errorMessage);
    });
  });
  
  // Más tests para otros métodos...
});