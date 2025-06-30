import { cookies } from 'next/headers';
import { ChatPageClient } from './chat-page-client';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';

export default async function Page() {
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');
  const initialChatModel = modelIdFromCookie?.value || DEFAULT_CHAT_MODEL;
  const id = generateUUID();

  return (
    <ChatPageClient 
      id={id}
      initialChatModel={initialChatModel}
    />
  );
}