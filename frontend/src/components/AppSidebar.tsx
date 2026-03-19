import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderKanban,
  UserCircle,
  Settings,
  LogOut,
  Plus,
  Home,
  Sparkles,
  ListTree,
  FileCode2,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = controlledToggle ?? (() => setInternalCollapsed(!internalCollapsed));

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) {
      setInternalCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Navigation items
  const navItems = [
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      path: '/projects',
      matchPaths: ['/projects'],
      exactMatch: true,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCircle,
      path: '/profile',
      matchPaths: ['/profile'],
    },
  ];

  // Secondary links (e.g., for specific project context)
  // This example assumes a projectId might be available from the URL or context
  const projectId = location.pathname.split('/')[2]; // Simple way to extract projectId from /projects/:id/...

  const secondaryLinks = projectId ? [
    {
      name: 'AI Debate',
      path: `/projects/${projectId}/debate`,
      icon: <BrainCircuit className="w-5 h-5" />
    }
  ] : [];

  // Check if a nav item is active
  const isActive = (item: any) => {
    const currentPath = location.pathname;
    
    if ('exactMatch' in item && item.exactMatch) {
      if ('matchPaths' in item && item.matchPaths) {
        return currentPath === item.path || item.matchPaths.includes(currentPath);
      }
      return currentPath === item.path;
    }
    
    if ('matchPaths' in item && item.matchPaths) {
      return currentPath.startsWith(item.path) || 
             item.matchPaths.some((p: string) => currentPath.startsWith(p));
    }
    
    return currentPath.startsWith(item.path);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/50">
        <Link to="/projects" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Acorn
            </span>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
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
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all text-white font-medium shadow-lg shadow-orange-500/20 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>New Project</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Navigation
            </span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-amber-400' : ''}`} />
              {!collapsed && (
                <span className={`font-medium ${active ? 'text-amber-400' : ''}`}>
                  {item.label}
                </span>
              )}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-700/50 p-3">
        {user && (
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.organization || 'Personal'}
                </p>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 mt-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
