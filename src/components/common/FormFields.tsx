import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Spinner
} from '@chakra-ui/react';

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  type?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rightElement?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  value,
  type = 'text',
  error = '',
  isRequired = false,
  isDisabled = false,
  isLoading = false,
  autoComplete,
  onChange,
  rightElement,
  ...rest
}) => {
  return (
    <FormControl id={id} isInvalid={!!error} isRequired={isRequired} {...rest}>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      <InputGroup>
        {isLoading && <InputLeftElement><Spinner size="sm" /></InputLeftElement>}
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          isDisabled={isDisabled || isLoading}
        />
        {!isLoading && rightElement && <InputRightElement>{rightElement}</InputRightElement>}
      </InputGroup>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};

export const EmailField: React.FC<Omit<FormFieldProps, 'type' | 'id' | 'name' | 'label'> & { 
  id?: string;
  name?: string;
  label?: string;
}> = ({ 
  id = 'email', 
  name = 'email', 
  label = 'Email',
  ...rest 
}) => (
  <FormField
    id={id}
    name={name}
    label={label}
    type="email"
    autoComplete="email"
    {...rest}
  />
);

export const PasswordField: React.FC<Omit<FormFieldProps, 'type' | 'id' | 'name' | 'label'> & { 
  id?: string;
  name?: string;
  label?: string;
  isNewPassword?: boolean;
}> = ({ 
  id = 'password', 
  name = 'password', 
  label = 'Contraseña',
  isNewPassword = false,
  ...rest 
}) => (
  <FormField
    id={id}
    name={name}
    label={label}
    type="password"
    autoComplete={isNewPassword ? 'new-password' : 'current-password'}
    {...rest}
  />
);
