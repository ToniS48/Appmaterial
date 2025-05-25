import React from 'react';
import {
  Tabs, TabList, Tab, TabPanels, TabPanel
} from '@chakra-ui/react';
import { FiFileText, FiUsers, FiPackage, FiLink } from 'react-icons/fi';

interface ActividadPageTabsProps {
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  participantesCount: number;
  materialesCount: number;
  enlacesCount: number;
  children: React.ReactNode[];
}

/**
 * Componente UI puro para las pestañas de la página de actividad
 */
export const ActividadPageTabs: React.FC<ActividadPageTabsProps> = ({
  activeTabIndex,
  onTabChange,
  participantesCount,
  materialesCount,
  enlacesCount,
  children
}) => {
  return (
    <Tabs 
      index={activeTabIndex} 
      onChange={onTabChange} 
      colorScheme="brand" 
      variant="enclosed"
    >
      <TabList>
        <Tab>
          <FiFileText style={{ marginRight: '5px' }} /> 
          Info
        </Tab>
        <Tab>
          <FiUsers style={{ marginRight: '5px' }} /> 
          Participantes ({participantesCount})
        </Tab>
        <Tab>
          <FiPackage style={{ marginRight: '5px' }} /> 
          Material ({materialesCount})
        </Tab>
        <Tab>
          <FiLink style={{ marginRight: '5px' }} /> 
          Enlaces ({enlacesCount})
        </Tab>
      </TabList>
      
      <TabPanels>
        {children.map((child, index) => (
          <TabPanel key={index}>
            {child}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};
