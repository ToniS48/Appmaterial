// EmailNormalizer.tsx
// Componente y función para normalizar emails (trim y minúsculas)
import React from 'react';

interface EmailNormalizerProps {
  value: string;
  children?: (normalized: string) => React.ReactNode;
}

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

const EmailNormalizer: React.FC<EmailNormalizerProps> = ({ value, children }) => {
  const normalized = normalizeEmail(value);
  if (children) return <>{children(normalized)}</>;
  return <>{normalized}</>;
};

export default EmailNormalizer;
