
import React from 'react';
import MaterialDropdownManager from './MaterialDropdownManager';

interface DropdownsSectionProps {
  userRole?: 'admin' | 'vocal';
}

const DropdownsSection: React.FC<DropdownsSectionProps> = () => {
  return <MaterialDropdownManager />;
};

export default DropdownsSection;

