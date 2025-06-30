'use client'

import { DataStreamHandler } from '@/components/data-stream-handler';
import { Chat } from '@/components/chat';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import type { UIMessage } from 'ai';
import { LoaderCircle } from 'lucide-react';

interface PageClientProps {
    id: string;
    initialMessages: UIMessage[];
    initialChatModel: string;
    initialVisibilityType: 'public' | 'private';
}

export default function PageClient({
    id,
    initialMessages,
    initialChatModel,
    initialVisibilityType
}: PageClientProps) {

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


    // Don't render Chat until session is available
    if (!session) {
        return <div className="flex justify-center items-center h-screen"><LoaderCircle size={100} className="animate-spin text-gray-300" /></div>;
    }

    if (session && isAuthenticated) {
        return (
            <>
                <Chat
                    id={id}
                    initialMessages={initialMessages}
                    initialChatModel={initialChatModel}
                    initialVisibilityType={initialVisibilityType}
                    isReadonly={false}
                    session={session}
                    autoResume={true}
                />
                <DataStreamHandler id={id} />
            </>
        );
    }
}