import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/use-auth';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.username, data.password);
    } catch {
      setError('root', { message: 'Error al registrar. El email o usuario puede estar en uso.' });
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
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              {...register('username')}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                errors.username ? "border-red-300 focus:border-red-300 focus:ring-red-200" : "border-gray-200"
              )}
              placeholder="usuario"
            />
            {errors.username && <p className="text-red-500 text-xs">{errors.username.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              {...register('password')}
              type="password"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                errors.password ? "border-red-300 focus:border-red-300 focus:ring-red-200" : "border-gray-200"
              )}
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                errors.confirmPassword ? "border-red-300 focus:border-red-300 focus:ring-red-200" : "border-gray-200"
              )}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full flex items-center justify-center bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium",
              "hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            )}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-gray-900 hover:underline font-medium"
          >
            Inicia Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
