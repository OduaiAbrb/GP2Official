import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/Button';
import { MessageCircle, Menu } from 'lucide-react';
import { ConversationalDock } from '@/components/ConversationalDock';
import { AppSidebar } from '@/components/AppSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  const projectMatch = useMemo(() => location.pathname.match(/\/projects\/([^/]+)/), [location.pathname]);
  const activeProjectId = projectMatch && projectMatch[1]?.length > 6 ? projectMatch[1] : null;
  
  useEffect(() => {
    if (!activeProjectId) {
      setAssistantOpen(false);
    }
  }, [activeProjectId]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AppSidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Main Content Area */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center px-6">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="flex-1" />
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user.full_name || user.email}</p>
                <p className="text-xs text-slate-500">
                  {user.organization || 'Personal workspace'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Persistent assistant bubble */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
        <Button
          className="shadow-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          onClick={() => activeProjectId && setAssistantOpen(true)}
          disabled={!activeProjectId}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Project Assistant
        </Button>
        {assistantOpen && activeProjectId && (
          <ConversationalDock
            projectId={activeProjectId}
            open={assistantOpen}
            onClose={() => setAssistantOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
