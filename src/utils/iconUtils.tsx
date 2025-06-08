import React from 'react';
import { Box } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  color?: string;
  size?: string | number;
  fontSize?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ 
  icon: IconComponent, 
  color = "gray.500", 
  size = "24px",
  fontSize
}) => {
  return (
    <Box 
      color={color} 
      fontSize={fontSize || size} 
      display="flex" 
      alignItems="center"
      justifyContent="center"
    >
      {React.createElement(IconComponent as React.ComponentType<any>)}
    </Box>
  );
};

// Helper function for consistent icon sizing
export const getIconSize = (size: 'sm' | 'md' | 'lg' | number): string => {
  if (typeof size === 'number') {
    return `${size * 4}px`; // Convert Chakra units to px
  }
  
  switch (size) {
    case 'sm': return '16px';
    case 'md': return '20px';
    case 'lg': return '24px';
    default: return '20px';
  }
};
