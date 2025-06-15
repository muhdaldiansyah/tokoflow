// app/dashboard/autograde/[examId]/components/Mobile/MobileBottomNav.js
'use client';

import React from 'react';
import { Users, Key } from 'lucide-react';

export default function MobileBottomNav({ activeWorkspace, setActiveWorkspace }) {
  const navItems = [
    { id: 'student', icon: Users, label: 'Siswa' },
    { id: 'answer', icon: Key, label: 'Kunci Jawaban' }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeWorkspace === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveWorkspace(item.id)}
              className={`
                flex flex-col items-center justify-center flex-1 py-3
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'text-gray-900' 
                  : 'text-gray-400'}
                active:scale-95
              `}
              aria-label={item.label}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
              }`}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
