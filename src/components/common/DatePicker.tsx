import React, { forwardRef } from 'react';
import { Input, useColorModeValue } from '@chakra-ui/react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import { es } from 'date-fns/locale';

// Componente CustomInput que recibe la referencia
const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, onChange, bgColor, isInvalid, ...props }, ref) => {
  const defaultBg = useColorModeValue("white", "gray.700");
  const defaultBorderColor = useColorModeValue("gray.200", "gray.600");
  const focusBorderColor = useColorModeValue("brand.400", "brand.300");
  const errorBorderColor = useColorModeValue("red.500", "red.300");
  
  const bg = bgColor || defaultBg;
  const borderColor = isInvalid ? errorBorderColor : defaultBorderColor;
  
  return (
    <Input
      value={value || ''}
      onClick={onClick}
      onChange={onChange}
      ref={ref}
      bg={bg}
      borderColor={borderColor}
      focusBorderColor={focusBorderColor}
      placeholder="Seleccionar fecha..."
      cursor="pointer"
      readOnly
      _hover={{
        borderColor: isInvalid ? errorBorderColor : focusBorderColor,
      }}
      _focus={{
        borderColor: focusBorderColor,
        boxShadow: `0 0 0 1px ${focusBorderColor}`,
      }}
      {...props}
    />
  );
});

// Asegurarse de que el valor sea una fecha válida
const ensureDate = (value: any): Date | null => {
  if (!value) return null;
  
  // Si ya es una instancia de Date, devolverla
  if (value instanceof Date) return value;
  
  // Si es un timestamp de Firebase con método toDate
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Intentar convertir desde otros formatos
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    console.error('Error convirtiendo fecha:', e);
    return null;
  }
};

interface DatePickerProps {
  selectedDate?: Date | null;
  onChange?: (date: Date | null) => void;
  name?: string;
  control?: any;
  bgColor?: string;
  isInvalid?: boolean;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  [key: string]: any;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>((props, ref) => {
  const { selectedDate, onChange, bgColor, isInvalid, placeholder, minDate, maxDate, ...rest } = props;
  
  // Convertir a objeto Date válido
  const safeDate = ensureDate(selectedDate);
  
  const handleChange = (date: Date | null) => {
    if (onChange) {
      onChange(date);
    }
  };
  
  // La referencia de las props restantes
  const { ref: _, ...restProps } = rest as any;

  return (
    <ReactDatePicker
      selected={safeDate}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      locale={es}
      isClearable={true}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholder || "Seleccionar fecha..."}
      {...restProps}
      customInput={
        <CustomInput 
          ref={ref}
          bgColor={bgColor}
          isInvalid={isInvalid}
        />
      }
    />
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;
