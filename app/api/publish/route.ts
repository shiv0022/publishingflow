import { NextRequest, NextResponse } from 'next/server';
import { executePublishPost } from '@/lib/publisher';

/**
 * Server-Side Real Publish Route
 * 
 * Invoked when user clicks "Publish Now" or manual retry from dashboard.
 * Delegates to the unified executePublishPost engine.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
    }

    const result = await executePublishPost(postId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Publishing failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      externalPostId: result.externalPostId,
      publishedAt: result.publishedAt,
      message: 'Successfully published!',
    });
  } catch (err: any) {
    console.error('[Publish API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Server publish error.' },
      { status: 500 }
    );
  }
}
