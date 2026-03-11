import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Passage from '@/models/Passage';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const search = searchParams.get('search');

    let filter: any = {};
    if (testId && testId !== 'Filter by Test') filter.testId = testId;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const passages = await Passage.find(filter).populate('testId', 'title').sort({ order: 1 }).lean().exec();
    return NextResponse.json({ success: true, data: passages });
  } catch (error) {
    console.error('Error fetching passages:', error);
    return NextResponse.json({ success: false, message: 'Unable to load passages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { title, content, testId, order } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
    }

    const passage = new Passage({ title, content, testId: testId || null, order: order ?? 1 });
    await passage.save();

    return NextResponse.json({ success: true, data: passage }, { status: 201 });
  } catch (error) {
    console.error('Error creating passage:', error);
    return NextResponse.json({ success: false, message: 'Failed to create passage' }, { status: 500 });
  }
}
