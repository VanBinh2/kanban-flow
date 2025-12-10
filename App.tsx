
import React, { useState, useEffect } from 'react';
import { BoardData, ThemeMode, User } from './types';
import { api } from './services/api';
import { BoardView } from './components/BoardView';
import { BoardList } from './components/BoardList';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Trello, Moon, Sun, LogOut, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Loader2, LayoutGrid, Settings, Users, Bell, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import './i18n';
import { useTranslation } from 'react-i18next';

// --- Components ---

const PremiumBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax gradient positions
  const bgX = useMotionTemplate`calc(50% + ${mouseX}px / 30)`;
  const bgY = useMotionTemplate`calc(50% + ${mouseY}px / 30)`;
  
  // Secondary orb position
  const orbX = useMotionTemplate`calc(20% + ${mouseX}px / 50)`;
  const orbY = useMotionTemplate`calc(80% + ${mouseY}px / 50)`;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Center the coordinate system
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-50 dark:bg-slate-950 -z-10">
        {/* Animated Orbs */}
        <motion.div 
            style={{ left: bgX, top: bgY }}
            className="absolute w-[800px] h-[800px] rounded-full bg-indigo-500/10 blur-[100px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-1000 ease-out" 
        />
        <motion.div 
            style={{ right: orbX, bottom: orbY }}
            className="absolute w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px] transition-transform duration-1000 ease-out" 
        />
        
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-60 pointer-events-none"></div>
    </div>
  );
};

// ... (PremiumInput remains same) ...
const PremiumInput = ({ 
  icon: Icon, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  togglePassword = false
}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = togglePassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-0 transition-opacity duration-300 ${isFocused ? 'opacity-20' : ''}`} />
      <div className="relative flex items-center bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl backdrop-blur-sm transition-all duration-200 group-hover:border-slate-300 dark:group-hover:border-white/20 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white/80 dark:focus-within:bg-white/10">
        <div className="pl-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon size={20} />
        </div>
        <input
          type={inputType}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent border-none text-slate-800 dark:text-white placeholder-slate-400/70 px-4 py-3.5 focus:outline-none focus:ring-0 text-sm font-medium"
        />
        {togglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let user;
            await new Promise(resolve => setTimeout(resolve, 800));
            if (isRegistering) {
                user = await api.register(username, email, password);
                addToast("Account created successfully!", "success");
            } else {
                user = await api.login(email, password);
                addToast("Welcome back!", "success");
            }
            onLogin(user);
        } catch (err: any) {
            addToast(err.message || t('auth.auth_failed'), "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => { setIsRegistering(!isRegistering); };

    return (
        <div className="flex min-h-screen w-full items-center justify-center relative bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500/30 overflow-hidden">
            <PremiumBackground />
            
            {/* Lang Switcher Top Right */}
            <div className="absolute top-6 right-6 z-20">
                <LanguageSwitcher />
            </div>

            <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[400px] mx-4 relative z-10"
            >
                <div className="bg-white/70 dark:bg-black/40 backdrop-blur-2xl rounded-[32px] border border-white/50 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-8 md:p-10 relative">
                    <div className="text-center mb-8 relative">
                         <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6 text-white">
                            <Trello size={28} strokeWidth={2.5} />
                         </div>
                         <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                             Kanban<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Flow</span>
                         </h1>
                         <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            {isRegistering ? t('auth.start_journey') : t('auth.welcome_back')}
                         </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 relative">
                         <AnimatePresence mode='popLayout'>
                            {isRegistering && (
                                <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                    <PremiumInput icon={UserIcon} placeholder={t('auth.full_name')} value={username} onChange={(e: any) => setUsername(e.target.value)} required />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <PremiumInput icon={Mail} type="email" placeholder={t('auth.email')} value={email} onChange={(e: any) => setEmail(e.target.value)} required />
                        <PremiumInput icon={Lock} togglePassword placeholder={t('auth.password')} value={password} onChange={(e: any) => setPassword(e.target.value)} required />
                        
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (isRegistering ? t('auth.create_account') : t('auth.sign_in'))}
                        </motion.button>
                    </form>
                    <div className="mt-6 text-center">
                        <button onClick={toggleMode} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                            {isRegistering ? t('auth.already_member') : t('auth.new_here')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- Floating Sidebar ---
const SidebarItem = ({ icon: Icon, label, isActive, collapsed, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
        ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
        ${collapsed ? 'justify-center' : ''}
    `}>
        <Icon size={20} strokeWidth={2} className={`${isActive ? 'fill-indigo-500/10' : ''}`} />
        {!collapsed && <span className="text-sm font-medium whitespace-nowrap opacity-100 transition-opacity duration-200">{label}</span>}
        
        {/* Tooltip for collapsed mode */}
        {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                {label}
            </div>
        )}
    </div>
);

const FloatingSidebar = ({ currentUser, onLogout, collapsed, setCollapsed, theme, toggleTheme, onViewChange, currentView }: any) => {
    const { t } = useTranslation();
    return (
        <motion.div 
            layout
            className={`
                relative flex flex-col h-[calc(100vh-32px)] my-4 ml-4 rounded-2xl border border-white/60 dark:border-white/5 
                bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]
                transition-all duration-300 z-50
                ${collapsed ? 'w-[72px]' : 'w-[240px]'}
            `}
        >
            {/* Header / Logo */}
            <div className={`flex items-center h-16 ${collapsed ? 'justify-center' : 'px-5 justify-between'}`}>
                 <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                        <Trello size={16} strokeWidth={3} />
                    </div>
                    {!collapsed && <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">Kanban</span>}
                 </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto custom-scrollbar">
                <div className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 ${collapsed ? 'text-center' : ''}`}>
                    {collapsed ? '—' : t('sidebar.menu')}
                </div>
                <SidebarItem 
                    icon={LayoutGrid} 
                    label={t('sidebar.boards')} 
                    isActive={currentView === 'dashboard' || currentView === 'board'} 
                    collapsed={collapsed} 
                    onClick={() => onViewChange('dashboard')}
                />
                <SidebarItem icon={Users} label={t('sidebar.members')} collapsed={collapsed} />
                <SidebarItem icon={Bell} label={t('sidebar.updates')} collapsed={collapsed} />
                <SidebarItem icon={Settings} label={t('sidebar.settings')} collapsed={collapsed} />
            </div>

            {/* Bottom Actions */}
            <div className="p-3 mt-auto space-y-3">
                 {/* User Profile */}
                 <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 ${collapsed ? 'justify-center' : ''}`}>
                     <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                         {currentUser?.avatar || "US"}
                     </div>
                     {!collapsed && (
                         <div className="overflow-hidden">
                             <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{currentUser?.username}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-semibold">{currentUser?.role}</div>
                         </div>
                     )}
                 </div>

                 <div className="h-px bg-slate-200 dark:bg-white/10 w-full" />
                 
                 {/* Controls */}
                 <div className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between'}`}>
                     <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        {theme === ThemeMode.LIGHT ? <Moon size={18} /> : <Sun size={18} />}
                     </button>
                     <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <LogOut size={18} />
                     </button>
                 </div>
            </div>

            {/* Collapse Toggle */}
            <button 
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:text-indigo-500 transition-colors z-50"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </motion.div>
    );
};


// --- Main App Component ---

const Spinner = () => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
    </div>
);

type ViewState = 'dashboard' | 'board';

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Routing State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
        const token = localStorage.getItem('token'); 
        if (!token) { setLoading(false); return; }
        try {
             setIsAuthenticated(true);
             // In a real app we'd validate token with /me endpoint
        } catch (e) { localStorage.removeItem('token'); } 
        finally { setLoading(false); }
    };
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme(ThemeMode.DARK);
        document.documentElement.classList.add('dark');
    }
    checkAuth();
  }, []);

  const toggleTheme = () => {
      if (theme === ThemeMode.LIGHT) {
          setTheme(ThemeMode.DARK);
          document.documentElement.classList.add('dark');
      } else {
          setTheme(ThemeMode.LIGHT);
          document.documentElement.classList.remove('dark');
      }
  };

  const handleBoardSelect = async (boardId: string) => {
      setBoardLoading(true);
      try {
          const data = await api.getBoardData(boardId);
          setBoardData(data);
          setActiveBoardId(boardId);
          setCurrentView('board');
      } catch (e) {
          console.error("Failed to load board", e);
          addToast("Could not load board. It may have been deleted.", "error");
      } finally {
          setBoardLoading(false);
      }
  };

  const handleNavigateDashboard = () => {
      setActiveBoardId(null);
      setBoardData(null);
      setCurrentView('dashboard');
      api.disconnectSocket();
  };
  
  const handleLogout = () => {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setBoardData(null);
      setCurrentUser(null);
      setCurrentView('dashboard');
      addToast("Logged out successfully", "success");
  }

  const handleLoginSuccess = (user: User) => { 
      setCurrentUser(user); 
      setIsAuthenticated(true);
      setLoading(false);
  }

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <LoginScreen onLogin={handleLoginSuccess} />;

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 relative">
        <PremiumBackground />

        {/* Sidebar */}
        <FloatingSidebar 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            collapsed={sidebarCollapsed} 
            setCollapsed={setSidebarCollapsed}
            theme={theme}
            toggleTheme={toggleTheme}
            onViewChange={handleNavigateDashboard}
            currentView={currentView}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative h-full overflow-hidden transition-all duration-300">
            {/* Header (Simplified since Nav is in Sidebar) */}
            <header className="h-16 flex items-center justify-between px-8 shrink-0 z-20">
                {/* Board Info (Breadcrumbs styled) */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleNavigateDashboard}
                        className="text-slate-400 dark:text-slate-500 font-medium hover:text-indigo-500 transition-colors"
                    >
                        {t('board.workspace')}
                    </button>
                    {currentView === 'board' && boardData && (
                        <>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">{boardData.title}</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide">{t('board.active')}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Top Right Actions */}
                <div className="flex items-center gap-4">
                     {/* Search Bar */}
                     {currentView === 'board' && (
                         <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input 
                                placeholder={t('board.search_placeholder')}
                                className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 rounded-full py-1.5 pl-9 pr-4 text-sm w-48 transition-all focus:w-64 outline-none"
                            />
                         </div>
                     )}
                     <LanguageSwitcher />
                </div>
            </header>

            {/* Content Canvas */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {currentView === 'dashboard' ? (
                    <BoardList onSelectBoard={handleBoardSelect} />
                ) : (
                    boardLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                        </div>
                    ) : (
                        boardData && <BoardView initialData={boardData} />
                    )
                )}
            </div>
        </main>
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
