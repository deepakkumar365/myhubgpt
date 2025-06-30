"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export function UserProfile() {
  const { userInfo, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full px-3 py-1 transition-colors"
      >
        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300">
          {userInfo?.DisplayName?.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{userInfo?.DisplayName}</span>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg z-20 py-1 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}