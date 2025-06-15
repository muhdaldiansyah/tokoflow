// app/dashboard/autograde/[examId]/components/Mobile/MobileMenu.js
'use client';

import React from 'react';
import { X, Edit, HelpCircle } from 'lucide-react';

export default function MobileMenu({ isOpen, onClose, setActiveWorkspace }) {
  const menuItems = [
    { id: 'editExam', icon: Edit, label: 'Edit Exam' },
    { id: 'help', icon: HelpCircle, label: 'Bantuan' },
  ];
  
  const handleItemClick = (id) => {
    setActiveWorkspace(id);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className={`
        fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform"
              >
                <Icon className="h-6 w-6" />
                <span className="text-base">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
