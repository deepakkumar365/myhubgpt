'use client';

import { useEffect, useState } from 'react';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { useAuth } from '@/lib/context/AuthContext';
import { LoaderCircle } from 'lucide-react';

interface ChatPageClientProps {
  id: string;
  initialChatModel: string;
}

export function ChatPageClient({ id, initialChatModel }: ChatPageClientProps) {
  const { userInfo, isAuthenticated } = useAuth();
  const [session, setSession] = useState<{
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      type: 'guest' | 'regular';
    };
  } | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      if (isAuthenticated && userInfo?.MailId) {
        try {
          const input = {
            email: userInfo.MailId,
          }
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
            user: {
              id: userData.id,
              email: userData.email,
              name: userInfo.DisplayName,
              type: 'regular' as const
            }
          });
        } catch (error) {
          console.error('Failed to initialize session:', error);
        }
      }
    };

    initializeSession();
  }, [isAuthenticated, userInfo?.MailId, userInfo?.DisplayName]);

  // Show loading state while session is being initialized
  if (!session) {
    return <div className="flex justify-center items-center h-screen"><LoaderCircle size={100} className="animate-spin text-gray-300" /></div>;
  }

  if (session && isAuthenticated) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={initialChatModel}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }
}