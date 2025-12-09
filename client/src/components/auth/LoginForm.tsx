import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/use-auth';
import { AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

        {errors.root && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{errors.root.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                errors.email ? "border-red-300 focus:border-red-300 focus:ring-red-200" : "border-gray-200"
              )}
              placeholder="nombre@ejemplo.com"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
            </div>
            <input
              {...register('password')}
              type="password"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                errors.password ? "border-red-300 focus:border-red-300 focus:ring-red-200" : "border-gray-200"
              )}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full flex items-center justify-center bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium",
              "hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            )}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToRegister}
            className="text-gray-900 hover:underline font-medium"
          >
            Regístrate
          </button>
        </div>
      </div>
    </div>
  );
}
