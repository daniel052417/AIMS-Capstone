// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { type UserProfile, type UserRole } from '../lib/supabase';

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
  
    useEffect(() => {
      const checkAuth = async () => {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');
        
        if (token && storedUser) {
          try {
            // Use stored user data instead of fetching profile
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('User authenticated from stored data:', userData);
          } catch (error) {
            console.error('Failed to parse stored user data:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        } else if (token) {
          // If we have token but no stored user data, try to get profile
          try {
            const response = await authService.getProfile();
            if (response.success && response.data) {
              const userData: UserProfile = {
                ...response.data,
                role: response.data.role as UserRole,
              };
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('auth_token');
            }
          } catch (error: any) {
            // If profile endpoint doesn't exist, clear token
            console.log('Profile endpoint not available, clearing token');
            localStorage.removeItem('auth_token');
          }
        }
        setIsCheckingAuth(false);
      };
      checkAuth();
    }, []);
  
    const login = async (email: string, password: string) => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await authService.login({ email, password });
        
        if (response.success && response.data) {
          // Store the token
          localStorage.setItem('auth_token', response.data.access_token);
          
          // Set user data - handle missing role field
          const userData: UserProfile = {
            ...response.data.user,
            role: (response.data.user.role || 'user') as UserRole, // Default to 'user' if role is undefined
          };
          
          // Store user data in localStorage for persistence
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          console.log('Login successful, setting user data:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          
          return { success: true };
        } else {
          console.log('Login failed:', response.message);
          setError(response.message || 'Login failed');
          return { success: false, message: response.message };
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Login failed. Please try again.';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setIsLoading(false);
      }
    };
  
    const logout = async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear local state regardless of API call success
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setUser(null);
        setIsAuthenticated(false);
        setError('');
      }
    };
  
    const clearError = () => setError('');
  
    return { 
      user, 
      isAuthenticated, 
      isCheckingAuth, 
      isLoading,
      error,
      login, 
      logout, 
      setUser,
      clearError
    };
  };
  