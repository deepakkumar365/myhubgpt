import { getChatById, getVotesByChatId, voteMessage } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { isValidUUID } from '@/lib/utils/validation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');



  if (!chatId) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter chatId is required.',
    ).toResponse();
  }

  // Validate UUID format
  if (!isValidUUID(chatId)) {
    return new ChatSDKError(
      'bad_request:api',
      'Invalid chatId format. Must be a valid UUID.',
    ).toResponse();
  }

  try {
    const chat = await getChatById({ id: chatId });

    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    // Allow voting on all chats since there's no authentication
    const votes = await getVotesByChatId({ id: chatId });

    return Response.json(votes, { status: 200 });
  } catch (error) {
    console.error('Error in vote GET route:', error);
    throw error; // Re-throw to see the full error
  }
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameters chatId, messageId, and type are required.',
    ).toResponse();
  }

  // Validate UUID formats
  if (!isValidUUID(chatId)) {
    return new ChatSDKError(
      'bad_request:api',
      'Invalid chatId format. Must be a valid UUID.',
    ).toResponse();
  }

  if (!isValidUUID(messageId)) {
    return new ChatSDKError(
      'bad_request:api',
      'Invalid messageId format. Must be a valid UUID.',
    ).toResponse();
  }

  try {
    const chat = await getChatById({ id: chatId });

    if (!chat) {
      return new ChatSDKError('not_found:vote').toResponse();
    }

    // Allow voting on all chats since there's no authentication
    await voteMessage({
      chatId,
      messageId,
      type: type,
    });

    return new Response('Message voted', { status: 200 });
  } catch (error) {
    console.error('Error in vote PATCH route:', error);
    throw error;
  }
}
