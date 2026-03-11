import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ListeningMock from '@/models/ListeningMock';

export async function GET() {
  try {
    await dbConnect();
    const mocks = await ListeningMock.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: mocks });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch listening mocks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { title } = body;
    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    const mock = await ListeningMock.create({
      title: title.trim(),
      status: 'draft',
      parts: [
        { partNumber: 1, audioUrl: '', transcript: '', questions: [] },
        { partNumber: 2, audioUrl: '', transcript: '', questions: [] },
        { partNumber: 3, audioUrl: '', transcript: '', questions: [] },
        { partNumber: 4, audioUrl: '', transcript: '', questions: [] },
      ],
    });

    return NextResponse.json({ success: true, data: mock }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create listening mock' }, { status: 500 });
  }
}
