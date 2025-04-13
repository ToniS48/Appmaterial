import React, { forwardRef } from 'react';
import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { Controller, Control } from 'react-hook-form';
import { safeDate } from '../../utils/dateUtils';

interface DatePickerProps {
  name: string;
  label?: string;
  control: Control<any>;
  isInvalid?: boolean;
  errorMessage?: string;
  isRequired?: boolean;
  defaultValue?: Date | null;
}

// Usar forwardRef para compatibilidad con react-hook-form
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ name, label, control, isInvalid, errorMessage, isRequired = false, defaultValue = null }, ref) => {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field, fieldState }) => (
          <FormControl isInvalid={isInvalid || !!fieldState.error}>
            {label && <FormLabel>{label}{isRequired && <span style={{ color: 'red' }}> *</span>}</FormLabel>}
            <Input
              {...field}
              type="date"
              id={name}
              value={safeDate(field.value)?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                field.onChange(e.target.value ? safeDate(new Date(e.target.value)) : null);
              }}
              ref={ref}
            />
            {fieldState.error && (
              <FormErrorMessage>{fieldState.error.message}</FormErrorMessage>
            )}
            {isInvalid && errorMessage && (
              <FormErrorMessage>{errorMessage}</FormErrorMessage>
            )}
          </FormControl>
        )}
      />
    );
  }
);

// Añadir displayName para ayudar con la depuración
DatePicker.displayName = 'DatePicker';

export default DatePicker;