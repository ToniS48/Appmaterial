import React, { useEffect } from 'react';
import { Container } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { ActividadInfoForm } from '../../components/actividades/ActividadInfoForm';
import ParticipantesEditor from '../../components/actividades/ParticipantesEditor';
import MaterialEditor from '../../components/actividades/MaterialEditor';
import EnlacesEditor from '../../components/actividades/EnlacesEditor';
import { ActividadFormTabs } from '../../components/actividades/ActividadFormTabs';
import { ActividadFormNavigation } from '../../components/actividades/ActividadFormNavigation';
import { ActividadFormStatus } from '../../components/actividades/ActividadFormStatus';
import { FormProvider, useForm } from 'react-hook-form';
import { Actividad } from '../../types/actividad';
import { useActividadFormTabs } from '../../hooks/useActividadFormTabs';
import { useActividadFormActions } from '../../hooks/useActividadFormActions';
import { useActividadFormAutoSave } from '../../hooks/useActividadFormAutoSave';

export const ActividadFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const totalTabs = 4;

  // Hooks personalizados para separar la lógica
  const {
    formData,
    loading,
    error,
    successMessage,
    handleDataUpdate,
    handleFinalSubmit,
    handleCancel,
    handleResponsablesChange,
    handleNecesidadMaterialChange,
    initializeNewActivity
  } = useActividadFormActions({ actividadId: id });
  const {
    activeTabIndex,
    completedTabs,
    isSubmitting,
    participantesEditorRef,
    prevTab,
    handleTabSubmit,
    handleTabChange
  } = useActividadFormTabs({
    totalTabs,
    onDataUpdate: handleDataUpdate,
    onFinalSubmit: handleFinalSubmit
  });

  const methods = useForm<Actividad>({
    defaultValues: formData,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const { clearDraft, checkUnsavedChanges } = useActividadFormAutoSave({
    methods,
    isEditing: !!id
  });

  // Inicializar actividad nueva con usuario actual
  useEffect(() => {
    initializeNewActivity();
  }, [initializeNewActivity]);

  // Actualizar valores del formulario cuando cambie formData
  useEffect(() => {
    methods.reset(formData);
  }, [formData, methods]);

  const handleCancelClick = () => {
    handleCancel(checkUnsavedChanges());
  };

  const handleNavigationClick = () => {
    const data = methods.getValues();
    handleTabSubmit(data);
  };

  return (
    <ActividadFormStatus
      loading={loading}
      error={error}
      successMessage={successMessage}
      title={id ? "Editar Actividad" : "Crear Actividad"}
    >
      <Container maxW="container.xl" py={8}>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleNavigationClick)} noValidate>
            <ActividadFormTabs
              activeTabIndex={activeTabIndex}
              completedTabs={completedTabs}
              onTabChange={handleTabChange}
            >
              <ActividadInfoForm onCancel={handleCancelClick} />
              
              <ParticipantesEditor 
                ref={participantesEditorRef}
                data={{ ...formData, participanteIds: formData.participanteIds || [] } as Actividad}
                onSave={() => {}} // Manejado por el hook
                onResponsablesChange={handleResponsablesChange}
                mostrarBotones={false}
                onCancel={handleCancelClick}
              />
              
              <MaterialEditor 
                data={{ ...formData, materiales: formData.materiales || [] } as Actividad}
                onSave={() => {}} // Manejado por el hook
                onNecesidadMaterialChange={handleNecesidadMaterialChange}
                isInsideForm={true} 
                mostrarBotones={false}
              />
              
              <EnlacesEditor 
                data={formData as Actividad}
                onSave={() => {}} // Manejado por el hook
                mostrarBotones={false}
              />
            </ActividadFormTabs>            <ActividadFormNavigation
              activeTabIndex={activeTabIndex}
              totalTabs={totalTabs}
              isSubmitting={isSubmitting}
              onNext={handleNavigationClick}
              onPrevious={prevTab}
              onCancel={handleCancelClick}
            />
          </form>
        </FormProvider>
      </Container>
    </ActividadFormStatus>
  );
};
