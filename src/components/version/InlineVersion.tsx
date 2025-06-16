import React from 'react';
import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { FiCode } from 'react-icons/fi';
import { useVersionString } from '../../hooks/useVersionInfo';

interface InlineVersionProps {
  format?: 'short' | 'full' | 'build';
  showIcon?: boolean;
  color?: string;
  fontSize?: string;
}

/**
 * Componente compacto para mostrar la versión en línea
 * Útil para headers, footers o información de debug
 */
const InlineVersion: React.FC<InlineVersionProps> = ({
  format = 'short',
  showIcon = true,
  color = 'gray.500',
  fontSize = 'sm'
}) => {
  const versionString = useVersionString(format);

  return (
    <HStack spacing={1} color={color} fontSize={fontSize}>
      {showIcon && <Icon as={FiCode} boxSize={3} />}
      <Text fontFamily="mono">{versionString}</Text>
    </HStack>
  );
};

export default InlineVersion;
