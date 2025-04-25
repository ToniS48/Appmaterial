import React, { forwardRef, useEffect, useState } from 'react';
import { Input, useColorModeValue } from '@chakra-ui/react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

// Componente CustomInput que recibe la referencia
const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, onChange, bgColor, ...props }, ref) => {
  // Usar hooks para obtener colores según el tema
  const defaultBg = useColorModeValue("white", "gray.700");
  const defaultBorderColor = useColorModeValue("gray.200", "gray.600");
  
  // Usar valores proporcionados o los valores por defecto
  const bg = bgColor || defaultBg;
  const borderColor = defaultBorderColor;
  
  return (
    <Input
      value={value || ''}
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

// Extender las props para incluir cualquier prop que ReactDatePicker pueda recibir
interface DatePickerProps {
  name?: string;
  value?: Date | null; 
  onChange?: (date: Date | null, event?: React.SyntheticEvent<any> | undefined) => void;
  control?: any;
  bgColor?: string;
  [x: string]: any;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  value,
  onChange,
  bgColor,
  ...rest
}, ref) => {
  // Estado local para manejar la fecha seleccionada
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  
  // Actualizar el estado local cuando la prop value cambia
  useEffect(() => {
    // Solo actualizar si hay cambio real
    if (value !== selectedDate) {
      setSelectedDate(value || null);
    }
  }, [value, selectedDate]);
  
  // Manejar cambios en la fecha
  const handleChange = (date: Date | null, event?: React.SyntheticEvent<any>) => {
    // Actualizar estado local
    setSelectedDate(date);
    
    // Llamar a onChange si existe
    if (onChange) {
      onChange(date, event);
    }
  };
  
  // Depuración
  useEffect(() => {
    console.debug('[DatePicker] Renderizando con fecha:', selectedDate);
  }, [selectedDate]);
  
  // Eliminar explícitamente la referencia de las props restantes
  const { ref: _, ...restProps } = rest as any;

  return (
    <ReactDatePicker
      selected={selectedDate}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      locale={es}
      isClearable={false}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
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