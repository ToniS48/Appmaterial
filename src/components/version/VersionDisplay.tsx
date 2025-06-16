import React from 'react';
import { Box, Text, Tooltip } from '@chakra-ui/react';
import { useVersionInfo } from '../../hooks/useVersionInfo';

interface VersionDisplayProps {
  position?: 'absolute' | 'relative' | 'fixed';
  bottom?: string;
  right?: string;
  fontSize?: string;
  color?: string;
  showTooltip?: boolean;
  format?: 'short' | 'version-only' | 'with-build';
}

const VersionDisplay: React.FC<VersionDisplayProps> = ({
  position = 'absolute',
  bottom = '10px',
  right = '10px',
  fontSize = 'xs',
  color = 'gray.500',
  showTooltip = true,
  format = 'version-only'
}) => {
  const versionInfo = useVersionInfo();
    const getDisplayText = () => {
    switch (format) {
      case 'short':
        return `v${versionInfo.displayVersion} (${versionInfo.shortHash})`;
      case 'with-build':
        return `v${versionInfo.displayVersion}.${versionInfo.buildNumber}`;
      case 'version-only':
      default:
        return `v${versionInfo.displayVersion}`;
    }
  };

  const versionText = getDisplayText();
  const fullVersionInfo = `Versión: ${versionInfo.displayVersion}\nVersión base: ${versionInfo.version}\nCommit: ${versionInfo.shortHash} (${versionInfo.branchName})\nBuild: ${versionInfo.buildNumber}\nFecha commit: ${versionInfo.commitDate}\nFecha build: ${new Date(versionInfo.buildDate).toLocaleDateString('es-ES')}`;

  const VersionComponent = (
    <Box
      position={position}
      bottom={bottom}
      right={right}
      zIndex={1000}
      userSelect="none"
      pointerEvents="none"
    >
      <Text
        fontSize={fontSize}
        color={color}
        fontFamily="mono"
        opacity={0.7}
        _hover={{ opacity: 1 }}
        transition="opacity 0.2s"
      >
        {versionText}
      </Text>
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip
        label={fullVersionInfo}
        placement="top-end"
        hasArrow
        bg="gray.700"
        color="white"
        fontSize="xs"
        whiteSpace="pre-line"
        pointerEvents="auto"
      >
        <Box
          position={position}
          bottom={bottom}
          right={right}
          zIndex={1000}
          cursor="help"
        >
          <Text
            fontSize={fontSize}
            color={color}
            fontFamily="mono"
            opacity={0.7}
            _hover={{ opacity: 1 }}
            transition="opacity 0.2s"
          >
            {versionText}
          </Text>
        </Box>
      </Tooltip>
    );
  }

  return VersionComponent;
};

export default VersionDisplay;
