import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/use-auth';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch {
      setError('root', { message: 'Credenciales inválidas. Intenta nuevamente.' });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>
        
        {errors.root && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{errors.root.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.email ? "border-red-300" : "border-gray-300"
                )}
                placeholder="tu@email.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                {...register('password')}
                type="password"
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.password ? "border-red-300" : "border-gray-300"
                )}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full flex items-center justify-center bg-blue-600 text-white py-2.5 rounded-md",
              "hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            )}
          >
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:underline font-medium"
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
