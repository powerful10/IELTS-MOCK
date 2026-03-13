import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const ALLOWED_TYPES = ['application/pdf'];
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check env var is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'Server is not configured for file uploads.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No PDF file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.pdf$/i)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Generate a clean filename
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')       // strip extension
      .replace(/[^a-z0-9]/gi, '_')    // replace special chars
      .toLowerCase()
      .slice(0, 60);
    const filename = `ielts-pdf/${safeName}_${Date.now()}.pdf`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json({ success: true, url: blob.url, filename: file.name });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('PDF upload error:', msg);
    return NextResponse.json(
      { success: false, message: 'Failed to upload PDF file. Please try again.' },
      { status: 500 }
    );
  }
}
