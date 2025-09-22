import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import { useAuth } from '../hooks/useAuth';

const LoginContainer: React.FC = () => {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Handle redirect after successful authentication or if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, redirecting to dashboard...');
      navigate('/dashboard');
    }
  }, [isAuthenticated]); // ✅ Removed navigate from dependencies

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      return;
    }

    // Attempt login - useEffect will handle redirect on success
    const result = await login(username, password);
    
    // Clear form on successful login
    if (result.success) {
      setUsername('');
      setPassword('');
    }
  };

  return (
    <LoginPage
      username={username}
      password={password}
      showPassword={showPassword}
      isLoading={isLoading}
      error={error}
      onUsernameChange={handleUsernameChange}
      onPasswordChange={handlePasswordChange}
      onToggleShowPassword={handleToggleShowPassword}
      onLoginSubmit={handleLoginSubmit}
    />
  );
};

export default LoginContainer;