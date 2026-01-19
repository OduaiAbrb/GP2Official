import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { 
  LogOut, 
  MessageCircle, 
  FolderKanban,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Sparkles,
  User,
  HelpCircle,
  BarChart3,
  Kanban,
  FileText,
  Users,
  CreditCard
} from 'lucide-react';
import { ConversationalDock } from '@/components/ConversationalDock';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { id: 'projects', icon: FolderKanban, label: 'Projects', path: '/projects' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const projectMatch = useMemo(() => location.pathname.match(/\/projects\/([^/]+)/), [location.pathname]);
  const activeProjectId = projectMatch && projectMatch[1]?.length > 6 ? projectMatch[1] : null;
  
  useEffect(() => {
    if (!activeProjectId) {
      setAssistantOpen(false);
    }
  }, [activeProjectId]);

  const isActive = (path: string) => {
    if (path === '/projects') {
      return location.pathname === path || location.pathname.startsWith('/projects/');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-10" />
      </div>

      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#0d1525] border-r border-[#1e3a5f]/50 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1e3a5f]/50">
          <Link 
            to="/projects" 
            className="flex items-center gap-3 group"
          >
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37] to-[#9a7b24] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#b8962e] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-[#0a0f1a]" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-gradient-gold">Acorn</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f]/50 transition-all"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Action */}
        <div className="p-3">
          <button
            onClick={() => navigate('/projects/new')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8962e] hover:from-[#e6c358] hover:to-[#d4af37] text-[#0a0f1a] font-semibold shadow-lg shadow-[#d4af37]/20 transition-all ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>New Project</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-3 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </span>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  active
                    ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30'
                    : 'text-gray-400 hover:text-white hover:bg-[#1e3a5f]/30 border border-transparent'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#d4af37]' : ''}`} />
                {!sidebarCollapsed && (
                  <span className={`font-medium ${active ? 'text-[#d4af37]' : ''}`}>
                    {item.label}
                  </span>
                )}
                {active && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-[#1e3a5f]/50 p-3">
          {user && (
            <div className={`flex items-center gap-3 p-3 rounded-xl bg-[#111b2e]/50 mb-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#9a7b24]/20 flex items-center justify-center text-sm font-semibold text-[#d4af37] flex-shrink-0 border border-[#d4af37]/30">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.organization || 'Enterprise'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0d1525]/95 backdrop-blur-lg border-b border-[#1e3a5f]/50 z-50 flex items-center justify-between px-4">
        <Link to="/projects" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[#d4af37] to-[#b8962e] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#0a0f1a]" />
          </div>
          <span className="text-lg font-bold text-gradient-gold">Acorn</span>
        </Link>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e3a5f]/50 transition-all"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#0a0f1a]/95 backdrop-blur-lg pt-16 animate-reveal-down">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${
                    active
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30'
                      : 'text-gray-300 hover:bg-[#1e3a5f]/30'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-lg font-medium">{item.label}</span>
                </button>
              );
            })}
            
            <div className="pt-4 border-t border-[#1e3a5f]/50 mt-4">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-lg font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-16 lg:pt-0`}
      >
        <div className="p-6 lg:p-8 relative z-10">
          {children}
        </div>
      </main>

      {/* AI Assistant */}
      {activeProjectId && (
        <>
          {!assistantOpen && (
            <button
              onClick={() => setAssistantOpen(true)}
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8962e] flex items-center justify-center shadow-lg shadow-[#d4af37]/30 hover:scale-110 hover:shadow-[#d4af37]/50 transition-all group"
            >
              <MessageCircle className="w-6 h-6 text-[#0a0f1a]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0f1a] animate-pulse" />
            </button>
          )}

          {assistantOpen && (
            <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] card-glass rounded-2xl overflow-hidden shadow-2xl animate-reveal-up">
              <ConversationalDock
                projectId={activeProjectId}
                open={assistantOpen}
                onClose={() => setAssistantOpen(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Layout;
