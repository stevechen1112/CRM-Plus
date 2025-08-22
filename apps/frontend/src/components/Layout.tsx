import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  CheckSquare, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Upload,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: '儀表板', href: '/dashboard', icon: Home, badge: null, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: '客戶管理', href: '/customers', icon: Users, badge: null, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: '訂單管理', href: '/orders', icon: ShoppingBag, badge: null, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: '任務中心', href: '/tasks', icon: CheckSquare, badge: null, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: '匯入匯出', href: '/import', icon: Upload, badge: null, roles: ['ADMIN', 'MANAGER'] },
    { name: '報表分析', href: '/reports', icon: BarChart3, badge: null, roles: ['ADMIN', 'MANAGER'] },
    { name: '稽核日誌', href: '/audit', icon: Shield, badge: null, roles: ['ADMIN', 'MANAGER'] },
    { name: '使用者管理', href: '/users', icon: Users, badge: null, roles: ['ADMIN'] },
    { name: '系統設定', href: '/settings', icon: Settings, badge: null, roles: ['ADMIN'] },
  ];

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role as any);
  });

  const isActive = (href: string) => location.pathname === href;

  // Close sidebar when route changes (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close sidebar
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [sidebarOpen]);

  // Lock body scroll when sidebar is open on mobile
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const SidebarContent = () => (
    <>
      {/* Logo/Brand */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">CRM 系統</span>
        </Link>
        
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${active
                  ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`
                mr-3 flex-shrink-0 h-5 w-5 transition-colors
                ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
              `} />
              
              <span className="flex-1">{item.name}</span>
              
              {item.badge && (
                <span className={`
                  ml-3 inline-block py-0.5 px-2 text-xs font-medium rounded-full
                  ${active 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium text-sm">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ''}
            </p>
            {user?.role && (
              <p className="text-xs text-primary-600 font-medium">
                {user.role === 'ADMIN' ? '管理員' : user.role === 'MANAGER' ? '經理' : '職員'}
              </p>
            )}
          </div>
          
          {/* Desktop notification - hidden on mobile */}
          <div className="hidden lg:block">
            <NotificationCenter />
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          登出
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200 shadow-sm">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <Link to="/dashboard" className="flex items-center">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">CRM</span>
            </Link>
            
            <NotificationCenter />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;