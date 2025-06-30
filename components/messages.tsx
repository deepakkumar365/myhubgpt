import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  session: Session | null;
}

type Session = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    type: 'guest' | 'regular';
  };
};

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  session
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  const shouldShowThinkingMessage = () => {
    // Don't show thinking if status is not submitted/streaming or if there are no messages
    if ((status !== 'submitted' && status !== 'streaming') || messages.length === 0) return false;
    
    // Don't show thinking if the last message is not from user
    if (messages[messages.length - 1].role !== 'user') return false;
    
    // Check if there's any assistant message after the last user message
    const lastUserIndex = messages.findLastIndex(msg => msg.role === 'user');
    const messagesAfterLastUser = messages.slice(lastUserIndex + 1);
    
    const hasAssistantResponseAfterLastUser = messagesAfterLastUser
      .some(msg => msg.role === 'assistant');
    
    // Stop showing thinking message if assistant response has started
    if (hasAssistantResponseAfterLastUser) return false;
    
    // Stop showing thinking if there's a tool invocation or result
    const hasToolInvocationOrResult = messagesAfterLastUser.some(msg => {
      // Debug: log message structure when debugging
      // console.log('Checking message:', msg);
      
      return (msg as any).state === 'result' ||
             (msg as any).toolInvocations?.length > 0 ||
             (Array.isArray(msg.content) && msg.content.some((content: any) => content.type === 'tool-invocation'));
    });
    
    if (hasToolInvocationOrResult) return false;
    
    return true;
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto pt-4 relative"
    >
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
        />
      ))}

      {shouldShowThinkingMessage() && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
