import { Sparkles, Camera, Bot, FolderOpen, User, ShieldCheck } from 'lucide-react';
import { View } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  const { isAdmin } = useAuth();
  
  const navItems: { id: View; icon: any; label: string }[] = [
    { id: 'chat', icon: Sparkles, label: 'Creation AI' },
    { id: 'studio', icon: Camera, label: 'Studio' },
    { id: 'agents', icon: Bot, label: 'Team Hub' },
    { id: 'projects', icon: FolderOpen, label: 'Projects' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-sleek-zinc/95 backdrop-blur-md border-t border-white/5 py-2.5 px-4 flex justify-between items-center z-40 overflow-x-auto hide-scrollbar">
      <div className="flex justify-around items-center w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-0.5 transition-colors flex-shrink-0 ${
                isActive ? 'text-sleek-violet' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <div className={`relative ${isActive ? 'drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]' : ''}`}>
                <Icon size={18} />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
