import React from 'react';
import { Icon, Tooltip, Box, IconProps } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface IconBadgeProps {
  label: string;
  icon: IconType;
  color: string;
  size?: IconProps['boxSize'];
}

const IconBadge: React.FC<IconBadgeProps> = ({ 
  label, 
  icon, 
  color, 
  size = 5 
}) => {
  return (
    <Tooltip label={label} hasArrow placement="top">
      <Box 
        display="inline-flex" 
        alignItems="center" 
        justifyContent="center"
        borderRadius="full"
        p={1}
        mr={1}
        bg={`${color}.100`}
        cursor="default"
      >
        <Icon as={icon as any} color={`${color}.500`} boxSize={size} />
      </Box>
    </Tooltip>
  );
};

export default IconBadge;