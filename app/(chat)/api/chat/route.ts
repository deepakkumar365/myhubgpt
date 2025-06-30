import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
  ToolExecutionOptions as BaseToolExecutionOptions,
  tool
} from 'ai';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createGuestUser,
  ensureAnonymousUser,
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import { getShipments } from '@/lib/ai/tools/get-shipments';
import { systemInstructions } from '@/lib/utils/systemInstructions';
import { getBookings, getYetToBeApprovedBooking } from '@/lib/ai/tools/get-Bookings';
import { getShipmentSequence } from '@/lib/ai/tools/get-shipment-sequence';
import { getBookingSequence } from '@/lib/ai/tools/get-booking-sequence';
import { getComments } from '@/lib/ai/tools/get-comments';
import { getDocuments } from '@/lib/ai/tools/get-documents';
import { getExceptions } from '@/lib/ai/tools/get-exceptions';
import { getInvoices } from '@/lib/ai/tools/get-invoices';
import { getJobrouts } from '@/lib/ai/tools/get-jobrouts';
import { getOrders } from '@/lib/ai/tools/get-order';
import { getTasks } from '@/lib/ai/tools/get-tasks';
import { getContainers } from '@/lib/ai/tools/get-containers';
import { getBrokerages } from '@/lib/ai/tools/get-brokerage';
import { PerformanceMonitor, selectOptimalTools } from '@/lib/performance';
import { PERFORMANCE_CONFIG } from '@/lib/config/performance';
import { getCorrectToolForMessage } from '@/lib/utils/toolValidator';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

interface ToolExecutionOptions extends BaseToolExecutionOptions {
    context?: {
      [key: string]: any;
    };
  }

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        // Return null immediately to avoid further attempts with Redis
        return null;
      } else {
        console.error('Stream context error:', error);
        // Return null to avoid further processing with a broken context
        return null;
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, selectedChatModel, selectedVisibilityType } =
      requestBody;

    // Extract AuthToken from request headers
    const authToken = request.headers.get('Authorization') || '';
    const emailId = request.headers.get('emailId') || '';
    // Ensure anonymous user exists and use it for all sessions
    const anonymousUser = await ensureAnonymousUser(emailId);
    
    if (!anonymousUser) {
      return new ChatSDKError('bad_request:auth', 'Failed to create or find anonymous user').toResponse();
    }
    
    const session = {
      user: {
        id: anonymousUser.id,
        email: anonymousUser.email,
        name: 'Anonymous User',
        type: 'guest' as const
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    const userType = 'guest' as const;

    // Skip rate limiting for anonymous users
    // const messageCount = await getMessageCountByUserId({
    //   id: session.user.id,
    //   differenceInHours: 24,
    // });

    // if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
    //   return new ChatSDKError('rate_limit:chat').toResponse();
    // }

    // Use Promise.all to run database operations in parallel
    const [chat, previousMessages] = await Promise.all([
      getChatById({ id }),
      getMessagesByChatId({ id })
    ]);

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      // Allow access to all chats since there's no authentication
      // if (chat.userId !== session.user.id) {
      //   return new ChatSDKError('forbidden:chat').toResponse();
      // }
    }

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Run save operations in parallel for better performance
    const streamId = generateUUID();
    await Promise.all([
      saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: 'user',
            parts: message.parts,
            attachments: message.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      }),
      createStreamId({ streamId, chatId: id })
    ]);
    const stream = createDataStream({
      execute: (dataStream) => {
        PerformanceMonitor.start('streamText');
        
        // Optimize tool selection based on message content
        const messageContent = message.parts?.[0]?.text || '';
        
        // Use the validator to get the absolutely correct tools
        let optimalTools = getCorrectToolForMessage(messageContent);

        
        // Double-check with legacy smart selection for comparison
        if (PERFORMANCE_CONFIG.ENABLE_SMART_TOOL_SELECTION) {
          const legacyTools = selectOptimalTools(messageContent);

          
          // If there's a discrepancy, log it but use validator result
          if (JSON.stringify(optimalTools) !== JSON.stringify(legacyTools)) {

          }
        }
        
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemInstructions,
          messages,
          maxSteps: PERFORMANCE_CONFIG.MAX_STEPS,
          temperature: PERFORMANCE_CONFIG.TEMPERATURE,
          maxTokens: PERFORMANCE_CONFIG.MAX_TOKENS,
          experimental_transform: smoothStream({ 
            chunking: PERFORMANCE_CONFIG.CHUNKING_MODE,
            delayInMs: PERFORMANCE_CONFIG.STREAM_DELAY_MS
          }),
          experimental_generateMessageId: generateUUID,
          tools: (() => {
            // CRITICAL FIX: Only load the tools that are actually selected
            const toolMap: Record<string, any> = {};
            const toolFactories = {
              getShipments: () => getShipments({ session, dataStream, authToken }),
              getShipmentSequence: () => getShipmentSequence({ session, dataStream, authToken }),
              getBookings: () => getBookings({ session, dataStream, authToken }),
              getBookingSequence: () => getBookingSequence({ session, dataStream, authToken }),
              getYetToBeApprovedBooking: () => getYetToBeApprovedBooking({ session, dataStream, authToken }),
              getBrokerages: () => getBrokerages({ session, dataStream, authToken }),
              getComments: () => getComments({ session, dataStream, authToken }),
              getDocuments: () => getDocuments({ session, dataStream, authToken }),
              getExceptions: () => getExceptions({ session, dataStream, authToken }),
              getInvoices: () => getInvoices({ session, dataStream, authToken }),
              getJobrouts: () => getJobrouts({ session, dataStream, authToken }),
              getOrders: () => getOrders({ session, dataStream, authToken }),
              getTasks: () => getTasks({ session, dataStream, authToken }),
              getContainers: () => getContainers({ session, dataStream, authToken }),             
            };
            
            // ONLY instantiate the tools that are selected by optimalTools

            
            // CRITICAL VALIDATION: Prevent tool confusion
            const msgLower = messageContent.toLowerCase();
            const hasContainer = msgLower.includes('container');
            const hasShipment = msgLower.includes('shipment');
            

            
            // CONTAINER VALIDATION
            if (hasContainer && optimalTools.includes('getShipments')) {

              optimalTools = ['getContainers']; // Replace all tools with just getContainers
            }
            
            // SHIPMENT VALIDATION - Most aggressive check
            if (hasShipment && !hasContainer) {

              // Remove all potentially conflicting tools
              optimalTools = optimalTools.filter(tool => 
                !['getContainers', 'getYetToBeApprovedBooking', 'getBookings', 'getOrders'].includes(tool)
              );
              
              // RESPECT getShipmentSequence from validator for comprehensive queries
              if (optimalTools.includes('getShipmentSequence')) {
                // Keep getShipmentSequence if the validator determined it's needed
                optimalTools = optimalTools.filter(tool => 
                  ['getShipmentSequence', 'getShipments'].includes(tool)
                );
              } else {
                // Ensure getShipments is the ONLY tool for regular shipment queries
                if (!optimalTools.includes('getShipments')) {
                  optimalTools = ['getShipments'];
                } else {
                  optimalTools = ['getShipments']; // Force only getShipments
                }
              }
            }
            
            // BOOKING VALIDATION - specific to "yet to be approved" queries
            const hasBookingApproval = msgLower.includes('yet to be approved') || 
                                     msgLower.includes('booking approval')
            
            if (hasBookingApproval && !hasShipment && !hasContainer) {
              optimalTools = ['getYetToBeApprovedBooking'];
            }        

            
            optimalTools.forEach(toolName => {
              if (toolFactories[toolName as keyof typeof toolFactories]) {
                toolMap[toolName] = toolFactories[toolName as keyof typeof toolFactories]();

              } else {

              }
            });            

            return toolMap;
          })(),
          onFinish: async ({ response }) => {
            PerformanceMonitor.end('streamText');
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const emailId = request.headers.get('emailId') || '';
  // Use the same anonymous user approach as POST method
  const anonymousUser = await ensureAnonymousUser(emailId);
  
  if (!anonymousUser) {
    return new ChatSDKError('bad_request:auth', 'Failed to create or find anonymous user').toResponse();
  }
  
  // const session = {
  //   user: {
  //     id: anonymousUser.id,
  //     email: anonymousUser.email,
  //     name: 'Anonymous User',
  //     type: 'guest' as const
  //   },
  //   expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  // };

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  // Allow access to all chats since using anonymous users
  // if (chat.visibility === 'private' && chat.userId !== session.user.id) {
  //   return new ChatSDKError('forbidden:chat').toResponse();
  // }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => { },
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  // const emailId = request.headers.get('emailId') || '';

  // Use the same anonymous user approach as POST method
  // const anonymousUser = await ensureAnonymousUser(emailId);
  // const session = {
  //   user: {
  //     id: anonymousUser.id,
  //     email: anonymousUser.email,
  //     name: 'Anonymous User',
  //     type: 'guest' as const
  //   },
  //   expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  // };

  const chat = await getChatById({ id });

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  // Since we're using anonymous users, allow deletion of any chat
  // if (chat.userId !== session.user.id) {
  //   return new ChatSDKError('forbidden:chat').toResponse();
  // }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
