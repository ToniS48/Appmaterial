import React from 'react';
import { Tr, Td, IconButton } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { MaterialField } from './types';

interface MaterialRowProps {
  material: MaterialField;
  index: number;
  handleSelect: () => void;
}

/**
 * Componente para representar una fila de material en una tabla
 * Memoizado para evitar re-renders innecesarios
 */
const MaterialRow = React.memo<MaterialRowProps>(({ material, index, handleSelect }) => {
  return (
    <Tr>
      <Td>{material.nombre}</Td>
      <Td isNumeric>{material.cantidad}</Td>
      <Td>
        <IconButton
          aria-label="Eliminar material"
          icon={<DeleteIcon />}
          size="xs"
          colorScheme="red"
          variant="ghost"
          onClick={handleSelect}
        />
      </Td>
    </Tr>
  );
});

// Agregar displayName para debugging
MaterialRow.displayName = 'MaterialRow';

export default MaterialRow;
