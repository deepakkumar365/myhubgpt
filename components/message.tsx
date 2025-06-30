'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { cn, copyToClipboard, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AgentThinking } from './agent-thinking';
import { Check, Copy, Sparkle } from 'lucide-react';
import { Documents } from './actions/document';
import { YetToBeApprovedBooking } from './actions/booking-approval-reject';
import { boolean } from 'drizzle-orm/gel-core';
import { toast } from 'sonner';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [copySuccess, setCopySuccess] = useState(false);

  let isToolCalled: boolean = false

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="mt-[6px]">
              <Sparkle size={15} className="text-red-600 hover:animate-spin" />
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-[45vh]': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start relative">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      {message.role === 'user' && !isReadonly && (
                        <button
                          className={`absolute bottom-[-1.5rem] right-0 p-1 rounded-md opacity-0 group-hover/message:opacity-100 transition-opacity ${message.role === "user" ? "" : "bg-white hover:bg-gray-100"
                            }`}
                          aria-label="Copy message"
                          title="Copy message"
                          onClick={async () => {
                            const textFromParts = message.parts
                              ?.filter((part) => part.type === 'text')
                              .map((part) => part.text)
                              .join('\n')
                              .trim();

                            if (!textFromParts) {
                              toast.error("There's no text to copy!");
                              return;
                            }

                            try {
                              const success = await copyToClipboard(textFromParts);
                              if (success) {
                                setCopySuccess(true);
                                toast.success('Copied to clipboard!');
                                // Reset success state after 2 seconds
                                setTimeout(() => setCopySuccess(false), 2000);
                              } else {
                                toast.error('Failed to copy to clipboard!');
                              }
                            } catch (error) {
                              toast.error('Failed to copy to clipboard!');
                            }
                          }}
                        >
                          {copySuccess ? (
                            <Check className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      )}

                      {!isToolCalled && (
                        <div
                          data-testid="message-content"
                          className={cn('flex flex-col gap-4 text-sm/7', {
                            'bg-primary text-primary-foreground px-4 py-1 rounded-3xl':
                              message.role === 'user',
                          })}
                        >
                          <Markdown>{sanitizeText(part.text)}</Markdown>
                        </div>
                      )}
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;
                  // Use switch case to handle different tool types
                  switch (toolName) {
                    case 'getDocuments':
                      return <Documents key={key} documents={args} />;
                    case 'getYetToBeApprovedBooking':
                      return <YetToBeApprovedBooking key={key} dataBooking={args} />;
                    default:
                      return null;
                  }
                }

                if (state === 'result') {
                  const { result } = toolInvocation;
                  // Use switch case to handle different tool types
                  switch (toolName) {
                    case 'getDocuments':
                      isToolCalled = true;
                      return <Documents key={key} documents={result} />;
                    case 'getYetToBeApprovedBooking':
                      isToolCalled = true;
                      return <YetToBeApprovedBooking key={key} dataBooking={result} />;
                    default:
                      return null;
                  }
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-[45vh]"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <AgentThinking />
      </div>
    </motion.div>
  );
};
