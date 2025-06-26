import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import AuthPageLayout from '../components/layouts/AuthPageLayout';
import messages from '../constants/messages';

const RegisterPage: React.FC = () => {
  return (
    <AuthPageLayout
      title="Registro de nuevo usuario"
      bottomLinkText="¿Ya tienes cuenta?"
      bottomLinkHref="/login"
      bottomLinkLabel="Inicia sesión aquí"
      termsText={messages.auth.register.terms}
    >
      <RegisterForm />
    </AuthPageLayout>
  );
};

export default RegisterPage;
