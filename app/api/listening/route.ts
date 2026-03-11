import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Listening from '@/models/Listening';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const search = searchParams.get('search');

    let filter: any = {};
    if (testId && testId !== 'Filter by Test') filter.testId = testId;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const listeningSections = await Listening.find(filter).populate('testId', 'title').sort({ order: 1 }).lean().exec();
    return NextResponse.json({ success: true, data: listeningSections });
  } catch (error) {
    console.error('Error fetching listening sections:', error);
    return NextResponse.json({ success: false, message: 'Unable to load listening sections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { title, audioUrl, transcript, testId, order } = await request.json();

    if (!title || !audioUrl) {
      return NextResponse.json({ success: false, message: 'Title and audioUrl are required' }, { status: 400 });
    }

    const listening = new Listening({
      title,
      audioUrl,
      transcript: transcript || '',
      testId: testId || null,
      order: order ?? 1,
    });
    await listening.save();

    return NextResponse.json({ success: true, data: listening }, { status: 201 });
  } catch (error) {
    console.error('Error creating listening section:', error);
    return NextResponse.json({ success: false, message: 'Failed to create listening section' }, { status: 500 });
  }
}
