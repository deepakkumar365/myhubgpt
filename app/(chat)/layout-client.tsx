'use client'

import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/context/AuthContext';

export const experimental_ppr = true;

export default function LayoutClient({
  children,
  isCollapsed
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
}) {

  const { userInfo, isAuthenticated } = useAuth();
  const [session, setSession] = useState<{
    id: string;
    email?: string | null;
    name?: string | null;
    type: 'guest' | 'regular';
  } | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      if (userInfo?.MailId) {
        try {
          const input = {
            email: userInfo.MailId,
          };
          const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input, 'Action': 'GetUserData' }),
          });

          if (!response.ok) {
            throw new Error('Failed to create or retrieve user');
          }

          const res = await response.json();
          const userData = res.result

          // Use authenticated user info if available, otherwise fall back to anonymous
          setSession({
            id: userData.id,
            email: userData.email,
            name: userInfo.DisplayName,
            type: 'regular' as const
          });
        } catch (error) {
          console.error('Failed to initialize session:', error);
        }
      }
    };

    initializeSession();
  }, [isAuthenticated, userInfo?.MailId, userInfo?.DisplayName]);

  if (isAuthenticated && session) {
    return (
      <>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={session} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </>
    );
  }
}
