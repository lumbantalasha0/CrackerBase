import { createContext, useContext, useState, useEffect } from 'react';

interface PinContextType {
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authenticated = sessionStorage.getItem('pin_authenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        sessionStorage.setItem('pin_authenticated', 'true');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('PIN verification failed:', error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('pin_authenticated');
    setIsAuthenticated(false);
  };

  return (
    <PinContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error('usePin must be used within PinProvider');
  }
  return context;
}
