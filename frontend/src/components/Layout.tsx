import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LogOut,
  MessageCircle,
  FolderKanban,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  User,
  BarChart3,
} from 'lucide-react';
import { ConversationalDock } from '@/components/ConversationalDock';

interface LayoutProps {
  children: React.ReactNode;
}

const AcornLogoSVG: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="16" rx="16" ry="9" fill="#3d2412" />
    <ellipse cx="20" cy="16" rx="12" ry="6" fill="#221508" />
    <rect x="18" y="7" width="4" height="10" rx="2" fill="#221508" />
    <ellipse cx="20" cy="32" rx="14" ry="16" fill="#8B5E3C" />
    <ellipse cx="20" cy="28" rx="12" ry="14" fill="#c8895a" />
    <ellipse cx="15" cy="24" rx="4" ry="6" fill="rgba(255,255,255,0.1)" />
  </svg>
);

const navItems = [
  { id: 'projects',  icon: FolderKanban, label: 'Projects',  path: '/projects' },
  { id: 'analytics', icon: BarChart3,    label: 'Analytics', path: '/analytics' },
  { id: 'profile',   icon: User,         label: 'Profile',   path: '/profile' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout }         = useAuthStore();
  const navigate                 = useNavigate();
  const location                 = useLocation();
  const [assistantOpen, setAssistantOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) setSidebarCollapsed(savedState === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const projectMatch  = useMemo(() => location.pathname.match(/\/projects\/([^/]+)/), [location.pathname]);
  const activeProjectId = projectMatch && projectMatch[1]?.length > 6 ? projectMatch[1] : null;

  useEffect(() => {
    if (!activeProjectId) setAssistantOpen(false);
  }, [activeProjectId]);

  const isActive = (path: string) => {
    if (path === '/projects') {
      return location.pathname === path || location.pathname.startsWith('/projects/');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#130c07' }}>
      {/* Background texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,94,60,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{ background: '#1a1008', borderRight: '1px solid #3d2412' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid #3d2412' }}>
          <Link to="/projects" className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #D4A017, #8B5E3C)' }} />
              <div className="relative rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
                style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2c1b0e, #3d2412)' }}>
                <AcornLogoSVG size={32} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-gradient-forest">Acorn</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg transition-all"
            style={{ color: '#8a7055' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0e4c8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a7055')}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Action */}
        <div className="p-3">
          <button
            onClick={() => navigate('/projects/new')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, #D4A017, #a86d0e)',
              color: '#130c07',
              boxShadow: '0 4px 16px rgba(212,160,23,0.3)',
            }}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>New Project</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5c3820' }}>
                Navigation
              </span>
            </div>
          )}

          {navItems.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                style={{
                  background: active ? 'rgba(212,160,23,0.12)' : 'transparent',
                  color: active ? '#D4A017' : '#8a7055',
                  border: active ? '1px solid rgba(212,160,23,0.3)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#f0e4c8'; e.currentTarget.style.background = 'rgba(61,36,18,0.5)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#8a7055'; e.currentTarget.style.background = 'transparent'; }}}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {active && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#D4A017' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3" style={{ borderTop: '1px solid #3d2412' }}>
          {user && (
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${sidebarCollapsed ? 'justify-center' : ''}`}
              style={{ background: 'rgba(44,27,14,0.5)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,160,23,0.2), rgba(139,94,60,0.2))',
                  color: '#D4A017',
                  border: '1px solid rgba(212,160,23,0.3)',
                }}>
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#f0e4c8' }}>
                    {user.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#8a7055' }}>
                    {user.organization || 'Workspace'}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            style={{ color: '#8a7055' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8a7055'; e.currentTarget.style.background = 'transparent'; }}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-lg z-50 flex items-center justify-between px-4"
        style={{ background: 'rgba(26,16,8,0.95)', borderBottom: '1px solid #3d2412' }}>
        <Link to="/projects" className="flex items-center gap-2">
          <div className="rounded-lg flex items-center justify-center"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #2c1b0e, #3d2412)' }}>
            <AcornLogoSVG size={28} />
          </div>
          <span className="text-lg font-bold text-gradient-forest">Acorn</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg transition-all"
          style={{ color: '#8a7055' }}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-16 animate-reveal-down"
          style={{ background: 'rgba(19,12,7,0.97)', backdropFilter: 'blur(16px)' }}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon   = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
                  style={{
                    background: active ? 'rgba(212,160,23,0.12)' : 'transparent',
                    color: active ? '#D4A017' : '#c8b090',
                    border: active ? '1px solid rgba(212,160,23,0.3)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-lg font-medium">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4" style={{ borderTop: '1px solid #3d2412' }}>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
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
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #D4A017, #a86d0e)',
                boxShadow: '0 4px 20px rgba(212,160,23,0.4)',
              }}
            >
              <MessageCircle className="w-6 h-6" style={{ color: '#130c07' }} />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 animate-pulse"
                style={{ background: '#5a9e6a', borderColor: '#130c07' }} />
            </button>
          )}

          {assistantOpen && (
            <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] overflow-hidden shadow-2xl animate-reveal-up"
              style={{
                background: 'rgba(34,21,8,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212,160,23,0.15)',
                borderRadius: 16,
              }}>
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
