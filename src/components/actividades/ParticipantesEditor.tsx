import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box, Button, Stack, Text, Grid, GridItem, Flex,
  Heading, Card, CardBody, Checkbox, Input, InputGroup, InputLeftElement, Divider,
  useDisclosure, useColorModeValue
} from '@chakra-ui/react';
import { listarUsuarios } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';
import { Actividad } from '../../types/actividad';
import { ParticipantesEditorProps } from '../../types/editor';

const ParticipantesEditor = forwardRef<
  { submitForm: () => void },
  ParticipantesEditorProps
>(({ data, onSave, onCancel, mostrarBotones = true }, ref) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(data.participanteIds || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");
  
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        const usuariosData = await listarUsuarios();
        setUsuarios(usuariosData.filter(u => u.activo));
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsuarios();
  }, []);
  
  const toggleUsuario = (usuarioId: string) => {
    if (selectedIds.includes(usuarioId)) {
      setSelectedIds(selectedIds.filter(id => id !== usuarioId));
    } else {
      setSelectedIds([...selectedIds, usuarioId]);
    }
  };
  
  const handleSubmit = () => {
    onSave(selectedIds);
  };

  // Exponer el método submitForm usando useImperativeHandle
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      console.log("ParticipantesEditor - submitForm llamado, selectedIds:", selectedIds);
      // Asegurar que siempre haya al menos el usuario actual como participante
      const idsToSave = selectedIds.length > 0 ? 
        selectedIds : 
        (data.creadorId ? [data.creadorId] : []);
      
      onSave(idsToSave);
    }
  }));
  
  return (
    <Box>
      <Text mb={4}>Selecciona los participantes de esta actividad:</Text>
      
      {/* Input de búsqueda */}
      <Input 
        placeholder="Buscar por nombre o email..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        bg={inputBg}
        borderColor={borderColor}
        mb={4}
      />
      
      {/* Lista de usuarios con checkboxes */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4} mb={6}>
        {usuarios.map(usuario => (
          <GridItem key={usuario.uid}>
            <Card variant="outline" bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Checkbox 
                  isChecked={selectedIds.includes(usuario.uid)} 
                  onChange={() => toggleUsuario(usuario.uid)}
                >
                  <Text fontWeight="medium">
                    {usuario.nombre} {usuario.apellidos}
                  </Text>
                </Checkbox>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>
      
      {/* Renderizado condicional de los botones */}
      {mostrarBotones && (
        <Stack direction="row" spacing={4} justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button colorScheme="brand" onClick={handleSubmit}>
            Guardar Participantes ({selectedIds.length})
          </Button>
        </Stack>
      )}
    </Box>
  );
});

// Agregar displayName para debugging
ParticipantesEditor.displayName = 'ParticipantesEditor';

export default ParticipantesEditor;