import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import AuthPageLayout from '../components/layouts/AuthPageLayout';

const LoginPage: React.FC = () => {
  return (
    <AuthPageLayout
      title="Iniciar sesión"
      bottomLinkText="¿No tienes cuenta?"
      bottomLinkHref="/register"
      bottomLinkLabel="Regístrate aquí"
    >
      <LoginForm />
    </AuthPageLayout>  );
};

export default LoginPage;