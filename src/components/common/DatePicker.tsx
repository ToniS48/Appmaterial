import React from 'react';
import { Input, useColorModeValue } from '@chakra-ui/react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Componente CustomInput que recibe la referencia
const CustomInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick, onChange, bgColor, ...props }, ref) => {
  // Siempre llamamos a los hooks, sin condiciones
  const defaultBg = useColorModeValue("white", "gray.700");
  const defaultBorderColor = useColorModeValue("gray.200", "gray.600");
  
  // Luego podemos usar esos valores o los proporcionados como props
  const bg = bgColor || defaultBg;
  const borderColor = defaultBorderColor;
  
  return (
    <Input
      value={value}
      onClick={onClick}
      onChange={onChange}
      ref={ref}
      bg={bg}
      borderColor={borderColor}
      {...props}
    />
  );
});

CustomInput.displayName = 'CustomInput';

// Extendemos las props para incluir cualquier prop que ReactDatePicker pueda recibir
interface DatePickerProps {
  name?: string;
  value?: Date | null; 
  onChange: (date: Date | null, event?: React.SyntheticEvent<any> | undefined) => void;
  control?: any;
  bgColor?: string;
  [x: string]: any;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(({ 
  value, 
  onChange, 
  bgColor,
  ...rest
}, ref) => {
  // La función wrapped garantiza compatibilidad con react-hook-form
  const handleChange = (date: Date | null, event?: React.SyntheticEvent<any>) => {
    onChange(date, event);
  };
  
  // Eliminar explícitamente la referencia de las props restantes
  const { ref: _, ...restProps } = rest as any;

  return (
    <ReactDatePicker
      selected={value}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      {...restProps}
      customInput={
        <CustomInput 
          ref={ref}
          bgColor={bgColor}
        />
      }
    />
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;