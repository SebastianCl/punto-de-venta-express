import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

type User = {
  email: string;
  role: string;
} | null;

type AuthContextType = {
  isAuthenticated: boolean;
  user: User;
  isLoadingAuth: boolean; // Añadir isLoadingAuth
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Variable global para exponer el forceLogout
let globalForceLogout: (() => void) | null = null;
export const getGlobalForceLogout = () => globalForceLogout;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); // Estado para la carga inicial
  const { toast } = useToast();

  useEffect(() => {
    // Comprobar si el usuario está autenticado en la carga inicial
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    
    if (storedAuth === 'true' && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setUser(parsedUser);
    }
    setIsLoadingAuth(false); // Terminar la carga después de comprobar localStorage
  }, []);
  
  const login = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData)); // Almacenar el objeto de usuario completo
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // Limpiar token también
  };

  // Forzar logout y redirigir al login
  const forceLogout = () => {
    toast({
      title: 'Sesión expirada',
      description: 'Debes iniciar sesión nuevamente.',
      variant: 'destructive',
      duration: 5000
    });
    logout();
    setTimeout(() => {
      window.location.href = '/login';
    }, 1200);
  };

  // Exponer forceLogout globalmente
  useEffect(() => {
    globalForceLogout = forceLogout;
    return () => { globalForceLogout = null; };
  }, [forceLogout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected route component
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth(); // Obtener isLoadingAuth
  const location = useLocation();
  
  if (isLoadingAuth) {
    return null; // O un componente de carga, por ejemplo: <div>Cargando...</div>
  }
  
  if (!isAuthenticated) {
    // Guardar la ubicación a la que el usuario intentaba acceder al redirigir al inicio de sesión
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};
