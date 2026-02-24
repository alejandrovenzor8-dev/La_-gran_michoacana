import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Lock, User, ChevronRight } from 'lucide-react';

const logoImage = './logo.png';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore((state) => ({
    login: state.login,
    isLoading: state.isLoading,
    error: state.error,
  }));
  const clearError = useAuthStore((state) => state.clearError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(username, password);
    
    if (success) {
      // Navegar a la página POS
      navigate('/pos');
      
      // Notificar a Electron que el login fue exitoso (en background, no esperamos respuesta)
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
      if (isElectron) {
        try {
          (window as any).electronAPI.onLoginSuccess().catch((err: any) => {
          });
        } catch (err) {
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background con gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Contenedor de login */}
      <div className="relative flex items-center justify-center h-full px-4">
        <div className="w-full max-w-md">
          {/* Card principal */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 mb-6 animate-in fade-in zoom-in duration-700">
            {/* Logo y título */}
            <div className="text-center mb-10">
              <div className="inline-block mb-4">
                <img 
                  src={logoImage} 
                  alt="La Gran Michoacana" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                La Gran Michoacana
              </h1>
              <p className="text-blue-100 text-sm font-medium">Sistema POS Moderno</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Usuario */}
              <div className="relative">
                <div
                  className={`absolute left-0 top-0 h-full flex items-center pl-4 transition-colors duration-300 ${
                    focusedField === 'username' ? 'text-blue-300' : 'text-white/50'
                  }`}
                >
                  <User size={20} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Usuario"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Campo Contraseña */}
              <div className="relative">
                <div
                  className={`absolute left-0 top-0 h-full flex items-center pl-4 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-blue-300' : 'text-white/50'
                  }`}
                >
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Contraseña"
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="animate-in slide-in-from-top duration-300 bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Botón Login */}
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>

              {/* Botón Cerrar Aplicación */}
              {typeof window !== 'undefined' && (window as any).electronAPI && (
                <button
                  type="button"
                  onClick={() => {
                    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
                    if (isElectron) {
                      (window as any).electronAPI.closeApp();
                    }
                  }}
                  disabled={isLoading}
                  className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-red-300 to-red-400 hover:from-red-400 hover:to-red-500 disabled:from-gray-300 disabled:to-gray-400 text-red-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <span>Cerrar</span>
                </button>
              )}
            </form>
          </div>

          {/* Card de credenciales */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom duration-1000">
            <p className="text-xs font-semibold text-blue-100 mb-3 uppercase tracking-wide">
              🔑 Credenciales de prueba
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blue-50">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                <span className="font-mono font-medium">admin</span>
                <span className="text-white/40">/</span>
                <span className="font-mono font-medium">password123</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-50">
                <div className="w-1.5 h-1.5 rounded-full bg-green-300"></div>
                <span className="font-mono font-medium">cajera1</span>
                <span className="text-white/40">/</span>
                <span className="font-mono font-medium">password123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
