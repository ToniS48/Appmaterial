import React, { useState } from 'react';
import { Image, ImageProps } from '@chakra-ui/react';

interface FallbackImageProps extends ImageProps {
  fallbackSrc?: string;
  altText: string;
}

const FallbackImage: React.FC<FallbackImageProps> = ({ 
  src, 
  fallbackSrc = '/assets/images/placeholder.png',
  altText,
  ...rest 
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');
  const [hasError, setHasError] = useState<boolean>(false);
  
  const handleError = () => {
    if (!hasError) {
      console.log(`Error al cargar imagen: ${src}, usando fallback`);
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };
  
  return (
    <Image
      src={imgSrc}
      alt={altText}
      onError={handleError}
      {...rest}
    />
  );
};

export default FallbackImage;