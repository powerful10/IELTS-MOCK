import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ReadingMock from '@/models/ReadingMock';

export async function GET() {
  try {
    await dbConnect();
    const mocks = await ReadingMock.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: mocks });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch reading mocks' }, { status: 500 });
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

    const mock = await ReadingMock.create({
      title: title.trim(),
      status: 'draft',
      passages: [
        { passageNumber: 1, title: '', content: '', questions: [] },
        { passageNumber: 2, title: '', content: '', questions: [] },
        { passageNumber: 3, title: '', content: '', questions: [] },
      ],
    });

    return NextResponse.json({ success: true, data: mock }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create reading mock' }, { status: 500 });
  }
}
