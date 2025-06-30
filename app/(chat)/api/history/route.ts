import type { NextRequest } from 'next/server';
import { getChatsByUserId, ensureAnonymousUser } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  try {
    // Extract emailId from query parameters, use default if not provided
    const emailId = searchParams.get('emailId') ?? 'default';
    // Ensure anonymous user exists and use it for history
    const anonymousUser = await ensureAnonymousUser(emailId);
    
    if (!anonymousUser) {
      return new ChatSDKError(
        'bad_request:auth',
        'Failed to create or find anonymous user'
      ).toResponse();
    }

    const chats = await getChatsByUserId({
      id: anonymousUser.id,
      limit,
      startingAfter,
      endingBefore,
    });
    return Response.json(chats);
  } catch (error) {
    console.error('Error in history API:', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}
