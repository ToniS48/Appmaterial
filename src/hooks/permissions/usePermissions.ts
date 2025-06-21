import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PermissionContext, ConfigurationPermissions, PermissionLevel } from '../../types/permissions';
import { DEFAULT_PERMISSIONS } from '../../config/permissions';

export const usePermissions = (userRole: 'admin' | 'vocal' | 'usuario'): PermissionContext => {
  const [customPermissions, setCustomPermissions] = useState<ConfigurationPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Cargar permisos personalizados desde Firebase (solo para vocales)
  useEffect(() => {
    const loadCustomPermissions = async () => {
      // Solo cargar permisos personalizados para vocales
      if (userRole !== 'vocal') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const docRef = doc(db, "configuracion", "permisos");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.vocal) {
            setCustomPermissions(data.vocal);
          }
        }
      } catch (error) {
        console.error("Error al cargar permisos personalizados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomPermissions();
  }, [userRole]);// Obtener permisos efectivos (personalizados o por defecto)
  const permissions = useMemo((): ConfigurationPermissions => {
    if (userRole === 'vocal' && customPermissions) {
      return customPermissions;
    }
    const defaultPermissions = DEFAULT_PERMISSIONS[userRole];
    if (!defaultPermissions) {
      // Fallback en caso de que no exista el rol
      return DEFAULT_PERMISSIONS.vocal;
    }
    return defaultPermissions;
  }, [userRole, customPermissions]);
  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (section: string, subsection?: string, level: PermissionLevel = 'read'): boolean => {
    // Los administradores tienen acceso completo a todo
    if (userRole === 'admin') {
      return true;
    }

    if (!permissions) return false;
    
    const sectionPermissions = permissions[section as keyof ConfigurationPermissions];
    
    if (!sectionPermissions) return false;
    
    let actualPermission: PermissionLevel;
    
    if (typeof sectionPermissions === 'string') {
      actualPermission = sectionPermissions;
    } else if (subsection && typeof sectionPermissions === 'object') {
      actualPermission = sectionPermissions[subsection as keyof typeof sectionPermissions] as PermissionLevel;
    } else {
      return false;
    }

    // Jerarquía de permisos: none < read < edit < full
    const permissionHierarchy: PermissionLevel[] = ['none', 'read', 'edit', 'full'];
    const actualLevel = permissionHierarchy.indexOf(actualPermission);
    const requiredLevel = permissionHierarchy.indexOf(level);
    
    return actualLevel >= requiredLevel;
  };
  // Función para verificar si puede editar
  const canEdit = (section: string, subsection?: string): boolean => {
    // Los administradores pueden editar todo
    if (userRole === 'admin') {
      return true;
    }
    return hasPermission(section, subsection, 'edit');
  };

  // Función para verificar si puede leer
  const canRead = (section: string, subsection?: string): boolean => {
    // Los administradores pueden leer todo
    if (userRole === 'admin') {
      return true;
    }
    return hasPermission(section, subsection, 'read');
  };

  return {
    userRole,
    permissions,
    hasPermission,
    canEdit,
    canRead,
  };
};
