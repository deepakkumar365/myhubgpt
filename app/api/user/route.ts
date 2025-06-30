import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser, ensureAnonymousUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const users = await getUser(email);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { input, Action } = await request.json();
    if (Action === "CreateUser") {
      if (!input.email || !input.password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const result = await createUser(input.email, input.password);
      return NextResponse.json({ success: true, result });
    } else {
      const result = await ensureAnonymousUser(input.email);
      return NextResponse.json({ success: true, result });
    }

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}