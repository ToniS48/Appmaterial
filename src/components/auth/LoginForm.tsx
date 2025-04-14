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
import { LOGIN_BLOCK_DURATION } from '../../constants/authConfig';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Box,
  Button,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Link
} from '@chakra-ui/react';
import { QuestionIcon } from '@chakra-ui/icons';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, resetPassword, userProfile, loginBlocked, loginBlockTimeRemaining } = useAuth();
  const theme = useTheme();
  
  const formatBlockTime = (): string => {
    const minutes = Math.floor(loginBlockTimeRemaining / 60000);
    const seconds = Math.floor((loginBlockTimeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
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
      {loginBlocked && (
        <Alert 
          status="error" 
          mb={4} 
          borderRadius="var(--border-radius-md)" 
          borderColor="var(--color-gray-200)"
          borderWidth="1px"
        >
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Cuenta temporalmente bloqueada</AlertTitle>
            <AlertDescription>
              Demasiados intentos fallidos. Podrás intentarlo nuevamente en:
            </AlertDescription>
            <Box mt={2}>
              <Progress value={(loginBlockTimeRemaining / LOGIN_BLOCK_DURATION) * 100} 
                size="sm" colorScheme="red" mt={1} mb={1} />
              <Box textAlign="center" fontWeight="bold">{formatBlockTime()}</Box>
            </Box>
          </Box>
        </Alert>
      )}
      
      <Box className="form-group" mb={4}>
        <EmailField
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
          isDisabled={isLoading || loginBlocked}
          label={messages.auth.login.emailLabel}
        />
      </Box>
      
      <Box className="form-group" mb={6}>
        <PasswordField
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          isDisabled={isLoading || loginBlocked}
          label={messages.auth.login.passwordLabel}
        />
      </Box>
      
      <Button
        type="submit"
        colorScheme="brand"
        width="full"
        py={6}
        isDisabled={isLoading || loginBlocked}
        isLoading={loadingState === 'submitting'}
        loadingText={messages.auth.login.loadingButton}
        bg="brand.500"
        _hover={{ bg: 'brand.600' }}
        _active={{ bg: 'brand.700' }}
      >
        {loginBlocked ? `Bloqueado (${formatBlockTime()})` : messages.auth.login.submitButton}
      </Button>
      
      <Flex justifyContent="center" mt={4}>
        <Link 
          onClick={handleForgotPassword} 
          color="brand.500" 
          display="flex"
          alignItems="center"
          pointerEvents={isLoading ? 'none' : 'auto'}
          _hover={{ color: 'brand.600', textDecoration: 'underline' }}
        >
          <QuestionIcon mr={2} />
          {messages.auth.login.forgotPassword}
        </Link>
      </Flex>
    </form>
  );
};

export default LoginForm;