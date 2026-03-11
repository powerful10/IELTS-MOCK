import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Test from '@/models/Test';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query: any = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (status && status !== 'All Status') query.status = status.toLowerCase();

    const tests = await Test.find(query).sort({ createdAt: -1 }).lean().exec();
    return NextResponse.json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ success: false, message: 'Unable to load tests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { title, description, sectionType, status, createdBy } = await request.json();

    if (!title || !createdBy) {
      return NextResponse.json({ success: false, message: 'Title and createdBy are required' }, { status: 400 });
    }

    const test = new Test({ title, description, sectionType, status, createdBy });
    await test.save();

    return NextResponse.json({ success: true, data: test }, { status: 201 });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json({ success: false, message: 'Failed to create test' }, { status: 500 });
  }
}
