import { useState } from 'react';

interface UseActividadPageUIReturn {
  // Estados de navegación
  activeTabIndex: number;
  setActiveTabIndex: (index: number) => void;
  handleTabChange: (newTabIndex: number) => void;
  
  // Estados de edición
  editingInfo: boolean;
  editingParticipantes: boolean;
  editingMaterial: boolean;
  editingEnlaces: boolean;
  setEditingInfo: (editing: boolean) => void;
  setEditingParticipantes: (editing: boolean) => void;
  setEditingMaterial: (editing: boolean) => void;
  setEditingEnlaces: (editing: boolean) => void;
  
  // Estados de diálogos
  isConfirmOpen: boolean;
  setIsConfirmOpen: (open: boolean) => void;
  
  // Función para salir de todos los modos de edición
  exitAllEditingModes: () => void;
}

/**
 * Hook para gestionar todos los estados de la interfaz de usuario
 * de la página de actividad (pestañas, edición, diálogos)
 */
export function useActividadPageUI(): UseActividadPageUIReturn {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // Estados de edición por pestaña
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingParticipantes, setEditingParticipantes] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(false);
  const [editingEnlaces, setEditingEnlaces] = useState(false);
  
  // Estados de diálogos
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Manejador de cambio de pestaña
  const handleTabChange = (newTabIndex: number) => {
    setActiveTabIndex(newTabIndex);
  };

  // Función para salir de todos los modos de edición
  const exitAllEditingModes = () => {
    setEditingInfo(false);
    setEditingParticipantes(false);
    setEditingMaterial(false);
    setEditingEnlaces(false);
  };

  return {
    // Estados de navegación
    activeTabIndex,
    setActiveTabIndex,
    handleTabChange,
    
    // Estados de edición
    editingInfo,
    editingParticipantes,
    editingMaterial,
    editingEnlaces,
    setEditingInfo,
    setEditingParticipantes,
    setEditingMaterial,
    setEditingEnlaces,
    
    // Estados de diálogos
    isConfirmOpen,
    setIsConfirmOpen,
    
    // Utilidades
    exitAllEditingModes
  };
};
