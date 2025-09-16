import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { type UserProfile, type UserRole } from './lib/supabase';
import { authService } from './services/authService';
import { productsService } from './services/productsService';
import { apiClient } from './services/api';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/super-admin';
import POSInterface from './pages/pos/cashier/POSInterface';
import { DebugInfo } from './components/DebugInfo';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);
  const checkAuthStatus = async () => {
    try {
      // Check if we have a token
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Try to get user profile
        const response = await authService.getProfile();
        if (response.success && response.data) {
          // Convert AuthUserProfile to UserProfile
          const userData: UserProfile = {
            id: response.data.id,
            email: response.data.email,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            role: response.data.role as UserRole,
            is_active: response.data.is_active,
            phone: response.data.phone,
            avatar_url: response.data.avatar_url,
            last_login: response.data.last_login,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at
          };
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
    } finally {
      setIsCheckingAuth(false);
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.login({
        email: username,
        password: password,
      });

      if (response.success && response.data) {
        // Store token
        localStorage.setItem('auth_token', response.data.token);
        
        // Set user data - convert to UserProfile format
        const userData: UserProfile = {
          id: response.data.user.id,
          email: response.data.user.email,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          role: response.data.user.role as UserRole,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(userData);
        setError('');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUsername('');
      setPassword('');
      setError('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Test API call function
  const testApiCall = async () => {
    try {
      console.log('Testing API connection...');
      
      // Test health check
      const healthResponse = await apiClient.get('/health');
      console.log('Health check:', healthResponse);
      
      // Test products API
      const productsResponse = await productsService.getProducts({ limit: 5 });
      console.log('Products:', productsResponse);
      
    } catch (error) {
      console.error('API test failed:', error);
    }
  };


  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  if (user) {
    // Add test button for development
    if (process.env.NODE_ENV === 'development') {
      return (
        <div>
          <button 
            onClick={testApiCall}
            className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test API
          </button>
          {user.role === 'cashier' ? (
            <POSInterface user={user} onLogout={handleLogout} />
          ) : (
            <AdminDashboard user={user} onLogout={handleLogout} />
          )}
        </div>
      );
    }
    
    return user.role === 'cashier' ? (
      <POSInterface user={user} onLogout={handleLogout} />
    ) : (
      <AdminDashboard user={user} onLogout={handleLogout} />
    );
  }

  // Login form
  return (
    <div>
      <LoginPage
        username={username}
        password={password}
        showPassword={showPassword}
        isLoading={isLoading}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onToggleShowPassword={() => setShowPassword(!showPassword)}
        onLoginSubmit={handleLogin}
      />
      <DebugInfo />
    </div>
  );
}

export default App;