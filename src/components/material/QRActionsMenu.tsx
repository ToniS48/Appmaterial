import React from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FiPrinter, FiCamera, FiSearch } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import QRScanner from '../common/QRScanner';
import useQRManager from '../../hooks/useQRManager';
import { Material } from '../../types/material';

interface QRActionsMenuProps {
  onMaterialFound?: (material: Material) => void;
  variant?: 'menu' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const QRActionsMenu: React.FC<QRActionsMenuProps> = ({
  onMaterialFound,
  variant = 'menu',
  size = 'md',
  showLabels = true
}) => {
  const { isScanning, openScanner, closeScanner, handleQRScan } = useQRManager();

  const handleScanResult = async (qrData: string) => {
    const material = await handleQRScan(qrData);
    if (material && onMaterialFound) {
      onMaterialFound(material);
    }
  };

  if (variant === 'buttons') {
    return (
      <>
        <HStack spacing={2}>
          <Button
            as={RouterLink}
            to="/material/print-qr"
            leftIcon={<Icon as={FiPrinter} />}
            colorScheme="brand"
            variant="outline"
            size={size}
          >
            {showLabels ? 'Imprimir QRs' : ''}
          </Button>
          
          <Button
            leftIcon={<Icon as={FiCamera} />}
            colorScheme="brand"
            variant="solid"
            size={size}
            onClick={openScanner}
          >
            {showLabels ? 'Escanear QR' : ''}
          </Button>
        </HStack>

        <QRScanner
          isOpen={isScanning}
          onClose={closeScanner}
          onScan={handleScanResult}
          title="Escanear Material"
          description="Apunta la cámara hacia el código QR del material para buscarlo rápidamente"
        />
      </>
    );
  }

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          leftIcon={<Icon as={FiSearch} />}
          colorScheme="brand"
          variant="outline"
          size={size}
        >
          {showLabels ? 'Códigos QR' : ''}
        </MenuButton>
        <MenuList>
          <MenuItem
            icon={<Icon as={FiCamera} />}
            onClick={openScanner}
          >
            Escanear código QR
          </MenuItem>
          <MenuItem
            as={RouterLink}
            to="/material/print-qr"
            icon={<Icon as={FiPrinter} />}
          >
            Imprimir códigos QR
          </MenuItem>
        </MenuList>
      </Menu>

      <QRScanner
        isOpen={isScanning}
        onClose={closeScanner}
        onScan={handleScanResult}
        title="Escanear Material"
        description="Apunta la cámara hacia el código QR del material para buscarlo rápidamente"
      />
    </>
  );
};

export default QRActionsMenu;
