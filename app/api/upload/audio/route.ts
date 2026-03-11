import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav', 'audio/wave', 'audio/mp4', 'audio/aac'];
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check env var is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'Server is not configured for file uploads. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No audio file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload an MP3, WAV, OGG, or AAC file.' },
        { status: 400 }
      );
    }

    // Generate a clean filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')       // strip extension
      .replace(/[^a-z0-9]/gi, '_')    // replace special chars
      .toLowerCase()
      .slice(0, 60);
    const filename = `ielts-audio/${safeName}_${Date.now()}.${ext}`;

    // Upload directly to Vercel Blob — works on Vercel serverless
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type || 'audio/mpeg',
    });

    return NextResponse.json({ success: true, url: blob.url, filename: file.name });
  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload audio file. Please try again.' },
      { status: 500 }
    );
  }
}
