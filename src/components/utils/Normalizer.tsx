// Normalizer.tsx
// Componente reutilizable para normalizar strings (ej: capitalizar, minúsculas, etc)
import React from 'react';

export type NormalizerType = 'capitalize' | 'lowercase' | 'uppercase' | 'capitalizeEach';

interface NormalizerProps {
  value: string;
  type?: NormalizerType;
  children?: (normalized: string) => React.ReactNode;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function capitalizeEach(str: string) {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

export const normalizeString = (value: string, type: NormalizerType = 'capitalize') => {
  switch (type) {
    case 'lowercase':
      return value.toLowerCase();
    case 'uppercase':
      return value.toUpperCase();
    case 'capitalizeEach':
      return capitalizeEach(value);
    case 'capitalize':
    default:
      return capitalize(value);
  }
};

const Normalizer: React.FC<NormalizerProps> = ({ value, type = 'capitalize', children }) => {
  const normalized = normalizeString(value, type);
  if (children) return <>{children(normalized)}</>;
  return <>{normalized}</>;
};

export default Normalizer;
