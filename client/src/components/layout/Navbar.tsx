import { useAuth } from '../../hooks/use-auth';
import { BookOpen, User, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavbarProps {
  onNavigate: (view: 'list' | 'create') => void;
  currentView: 'list' | 'create' | 'detail';
}

interface NavButtonProps {
  view: 'list' | 'create';
  label: string;
  mobile?: boolean;
  currentView: 'list' | 'create' | 'detail';
  onNavigate: (view: 'list' | 'create') => void;
}

function NavButton({ view, label, mobile = false, currentView, onNavigate }: NavButtonProps) {
  const isActive = currentView === view || (view === 'list' && currentView === 'detail');
  
  return (
    <button
      onClick={() => onNavigate(view)}
      className={cn(
        "transition-colors rounded-md",
        mobile ? "flex-1 text-sm py-2" : "px-4 py-2",
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      )}
    >
      {label}
    </button>
  );
}

export function Navbar({ onNavigate, currentView }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <BookOpen className="size-8 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">Study Tool</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <NavButton 
                view="list" 
                label="Mi Zona" 
                currentView={currentView} 
                onNavigate={onNavigate} 
              />
              <NavButton 
                view="create" 
                label="Crear Plan" 
                currentView={currentView} 
                onNavigate={onNavigate} 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
                  <User className="size-4" />
                  <span>{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-gray-200 px-4 py-2 flex gap-2">
        <NavButton 
          view="list" 
          label="Mi Zona" 
          mobile 
          currentView={currentView} 
          onNavigate={onNavigate} 
        />
        <NavButton 
          view="create" 
          label="Crear Plan" 
          mobile 
          currentView={currentView} 
          onNavigate={onNavigate} 
        />
      </div>
    </nav>
  );
}
