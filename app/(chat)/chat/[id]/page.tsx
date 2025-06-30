import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';


import { getChatById, getMessagesByChatId, ensureAnonymousUser } from '@/lib/db/queries';

import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';
import PageClient from './page-client';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  // Allow access to all chats regardless of visibility since there's no auth

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <PageClient
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialVisibilityType={chat.visibility}
      />
    );
  }

  return (
    <>
      <PageClient
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
      />
    </>
  );
}
