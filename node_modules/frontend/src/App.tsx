import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PermissionProvider } from './context/PermissionContext';
import { MainLayout } from './components/MainLayout';
import ProtectedContent from './components/ProtectedContent';
import LoginContainer from './components/LoginContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { routes, unauthorizedRoute, type RouteConfig } from './config/routes';
import { useAuth } from './hooks/useAuth';
import { type UserProfile } from './lib/supabase';

export interface RouteComponentProps {
  user: UserProfile;
  onLogout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-gray-600">Loading page...</span>
    </div>
  </div>
);

const AuthWrapper: React.FC = () => {
  const { user: authUser, isAuthenticated, isCheckingAuth, logout: authLogout } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(authUser);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, [authLogout]);

  // Helper function to render a route component with Suspense
  const renderRouteComponent = (route: RouteConfig) => {
    if (!route.component) {
      return null;
    }

    const Component = route.component;
    return (
      <Suspense fallback={<PageLoader />}>
        <ProtectedContent 
          requiredPermissions={route.requiredPermissions}
          requiredRoles={route.requiredRoles}
        >
          <Component user={user!} onLogout={logout} setUser={setUser} />
        </ProtectedContent>
      </Suspense>
    );
  };

  // Helper function to render all routes (including nested children)
  const renderRoutes = (routeConfigs: RouteConfig[]) => {
    const routeElements: React.ReactElement[] = [];

    routeConfigs.forEach((route) => {
      // Render the main route
      if (route.component) {
        routeElements.push(
          <Route
            key={route.path}
            path={route.path}
            element={renderRouteComponent(route)}
          />
        );
      }

      // Render child routes
      if (route.children) {
        route.children.forEach((child) => {
          if (child.component) {
            routeElements.push(
              <Route
                key={child.path}
                path={child.path}
                element={renderRouteComponent(child)}
              />
            );
          }
        });
      }
    });

    return routeElements;
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginContainer />
            } 
          />
          
          <Route
            path={unauthorizedRoute.path}
            element={<unauthorizedRoute.component />}
          />

          {/* Protected routes - wrapped in layout */}
          {isAuthenticated && user ? (
            <Route
              path="/*"
              element={
                <PermissionProvider>
                  <MainLayout user={user} onLogout={logout}>
                    <Routes>
                      {/* Render all routes as a flat structure */}
                      {renderRoutes(routes)}
                      
                      {/* Default redirect to dashboard */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      
                      {/* Catch unmatched routes */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </MainLayout>
                </PermissionProvider>
              }
            />
          ) : (
            // Redirect unauthenticated users to login
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}

          {/* Root redirect */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={isAuthenticated ? "/dashboard" : "/login"} 
                replace 
              />
            } 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return <AuthWrapper />;
};

export default App;