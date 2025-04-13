import React, { useState, useEffect } from 'react';
import {
  Box, Button, Stack, Text, Grid, GridItem, Flex,
  Heading, Card, CardBody, Checkbox
} from '@chakra-ui/react';
import { listarUsuarios } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';
import { Actividad } from '../../types/actividad';

interface ParticipantesEditorProps {
  actividad: Actividad;
  onSave: (participanteIds: string[]) => void;
  onCancel: () => void;
}

const ParticipantesEditor: React.FC<ParticipantesEditorProps> = ({ 
  actividad, 
  onSave, 
  onCancel 
}) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(actividad.participanteIds || []);
  const [loading, setLoading] = useState<boolean>(true);
  
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
  
  return (
    <Box>
      <Text mb={4}>Selecciona los participantes de esta actividad:</Text>
      
      {/* Lista de usuarios con checkboxes */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4} mb={6}>
        {usuarios.map(usuario => (
          <GridItem key={usuario.uid}>
            <Card variant="outline">
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
      
      <Stack direction="row" spacing={4} justify="flex-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button colorScheme="brand" onClick={handleSubmit}>
          Guardar Participantes ({selectedIds.length})
        </Button>
      </Stack>
    </Box>
  );
};

export default ParticipantesEditor;