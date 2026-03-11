import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav', 'audio/wave', 'audio/mp4', 'audio/aac'];
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No audio file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
      return NextResponse.json({ success: false, message: 'Invalid file type. Please upload an MP3, WAV, OGG, or AAC file.' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'audio');
    await mkdir(uploadDir, { recursive: true });

    // Generate a unique filename to avoid collisions
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')  // remove extension
      .replace(/[^a-z0-9]/gi, '_')  // replace non-alphanumeric
      .toLowerCase()
      .slice(0, 40);  // limit length
    const filename = `${safeName}_${timestamp}.${ext}`;

    // Write the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, filename), buffer);

    // Return the public URL
    const publicUrl = `/uploads/audio/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl, filename });
  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json({ success: false, message: 'Failed to upload audio file' }, { status: 500 });
  }
}
