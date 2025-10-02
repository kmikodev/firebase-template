import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginButtons } from '@/components/auth/LoginButtons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function Login() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (firebaseUser) {
      navigate('/dashboard');
    }
  }, [firebaseUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Bienvenido a Peluquerías</CardTitle>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            Gestiona tu turno de forma inteligente
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <LoginButtons />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
