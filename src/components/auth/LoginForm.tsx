import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import messages from '../../constants/messages';
import { validateEmail, validatePassword } from '../../utils/validationUtils';
import { navigateByUserRole } from '../../utils/navigation';
import { EmailField, PasswordField } from '../common/FormFields';
import { useFormValidation } from '../../hooks/useFormValidation';
import { LoadingState } from '../../types/ui';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Box,
  Button,
  Flex,
  Link
} from '@chakra-ui/react';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, resetPassword, userProfile } = useAuth();
  const theme = useTheme();
  
  const validationRules = {
    email: validateEmail,
    password: validatePassword
  };
  
  const { 
    values: formData, 
    errors: formErrors, 
    handleChange, 
    validateForm,
    loadingState,
    setLoadingState
  } = useFormValidation(
    {
      email: '',
      password: ''
    },
    validationRules,
    { validateOnChange: true }
  );

  useEffect(() => {
    if (userProfile && loadingState === 'submitting') {
      navigateByUserRole(navigate, userProfile, { 
        replace: true,
        forceRedirect: true 
      });
      setLoadingState('idle');
    }
  }, [userProfile, loadingState, navigate, setLoadingState]);

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error(messages.auth.login.emailRequired);
      return;
    }
    
    const emailError = validateEmail(formData.email);
    if (emailError) {
      toast.error(emailError);
      return;
    }
    
    try {
      setLoadingState('resetting_password');
      await resetPassword(formData.email);
      toast.success(messages.auth.login.emailSent);
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
    } finally {
      setLoadingState('idle');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loadingState !== 'idle') {
      return;
    }
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }
    
    try {
      setLoadingState('submitting');
      await login(formData.email, formData.password);
    } catch (error) {
      setLoadingState('idle');
    }
  };

  const isLoading = loadingState !== 'idle';

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <Box className="form-group" mb={4}>
        <EmailField
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
          isDisabled={isLoading}
          label={messages.auth.login.emailLabel}
        />
      </Box>
      
      <Box className="form-group" mb={6}>
        <PasswordField
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          isDisabled={isLoading}
          label={messages.auth.login.passwordLabel}
        />
      </Box>
      
      <Button
        type="submit"
        colorScheme="brand"
        width="full"
        py={6}
        isDisabled={isLoading}
        isLoading={loadingState === 'submitting'}
        loadingText={messages.auth.login.loadingButton}
        bg="brand.500"
        _hover={{ bg: 'brand.600' }}
        _active={{ bg: 'brand.700' }}
      >
        {messages.auth.login.submitButton}
      </Button>
      
      <Flex justifyContent="center" mt={4}>
        <Link 
          onClick={handleForgotPassword} 
          color="brand.500" 
          fontSize="sm"
        >
          {messages.auth.login.forgotPassword}
        </Link>
      </Flex>
    </form>
  );
};

export default LoginForm;