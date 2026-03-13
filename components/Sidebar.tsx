'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Headphones, Home, Settings, Users, Sparkles } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Reading', href: '/dashboard/reading', icon: BookOpen },
    { label: 'Listening', href: '/dashboard/listening', icon: Headphones },
    { label: 'PDF AI Builder', href: '/dashboard/pdf-builder', icon: Sparkles },
    { label: 'Users', href: '/dashboard/users', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="bg-slate-900 text-white w-64 min-h-screen flex flex-col transition-all duration-300">
      <div className="p-6 flex items-center justify-center border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          IELTS Admin
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                active 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center space-x-3 px-4 py-2 w-full text-slate-300 hover:text-white transition-colors">
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
