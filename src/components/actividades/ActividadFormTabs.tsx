import React from 'react';
import { Tabs, TabList, Tab, TabPanels, TabPanel, Flex } from '@chakra-ui/react';
import { FiFileText, FiUsers, FiPackage, FiLink, FiCheck } from 'react-icons/fi';

interface ActividadFormTabsProps {
  activeTabIndex: number;
  completedTabs: number[];
  onTabChange: (index: number) => void;
  children: React.ReactNode[];
}

export const ActividadFormTabs: React.FC<ActividadFormTabsProps> = ({
  activeTabIndex,
  completedTabs,
  onTabChange,
  children
}) => {
  const tabConfig = [
    { icon: FiFileText, label: 'Información' },
    { icon: FiUsers, label: 'Participantes' },
    { icon: FiPackage, label: 'Material' },
    { icon: FiLink, label: 'Enlaces' }
  ];

  return (
    <Tabs 
      isFitted 
      variant="enclosed" 
      index={activeTabIndex}
      onChange={onTabChange}
    >
      <TabList>
        {tabConfig.map((tab, index) => {
          const IconComponent = tab.icon;
          return (
            <Tab key={index}>
              <Flex align="center">
                <IconComponent style={{ marginRight: '5px' }} /> 
                {tab.label}
                {completedTabs.includes(index) && (
                  <FiCheck
                    style={{ marginLeft: '5px', color: 'green' }}
                  />
                )}
              </Flex>
            </Tab>
          );
        })}
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
