import { useState } from 'react';
import { AuthProvider } from './lib/auth-context';
import { useAuth } from './hooks/use-auth';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Navbar } from './components/layout/Navbar';
import { PlanList } from './components/plans/PlanList';
import { PlanDetail } from './components/plans/PlanDetail';
import { Toaster } from './components/ui/sonner';
import { Loader2 } from 'lucide-react';

type View = 'list' | 'detail' | 'generate';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setSelectedPlanId(null);
    setCurrentView('list');
  };

  const handleNavigate = (view: 'list' | 'generate') => {
    setCurrentView(view);
    setSelectedPlanId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="size-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-gray-900 mb-2">Study Planner</h1>
            <p className="text-gray-600">
              Crea y gestiona tus planes de estudio con inteligencia artificial
            </p>
          </div>

          {authMode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={handleNavigate} currentView={currentView} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'list' && (
          <div>
            <div className="mb-8">
              <h1 className="text-gray-900 mb-2">Mis Planes de Estudio</h1>
              <p className="text-gray-600">
                Gestiona y organiza todos tus planes de aprendizaje
              </p>
            </div>
            <PlanList onSelectPlan={handleSelectPlan} />
          </div>
        )}

        {currentView === 'detail' && selectedPlanId && (
          <PlanDetail planId={selectedPlanId} onBack={handleBackToList} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
