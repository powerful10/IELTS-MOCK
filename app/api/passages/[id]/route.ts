import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Passage from '@/models/Passage';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const passage = await Passage.findById(id).populate('testId', 'title').lean().exec();
    if (!passage) return NextResponse.json({ success: false, message: 'Passage not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: passage });
  } catch (error) {
    console.error('Error fetching passage:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch passage' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { title, content, testId, order } = await request.json();

    const passage = await Passage.findByIdAndUpdate(
      id,
      { title, content, testId: testId || null, order },
      { new: true }
    ).lean();
    if (!passage) return NextResponse.json({ success: false, message: 'Passage not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: passage });
  } catch (error) {
    console.error('Error updating passage:', error);
    return NextResponse.json({ success: false, message: 'Failed to update passage' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const passage = await Passage.findByIdAndDelete(id);
    if (!passage) return NextResponse.json({ success: false, message: 'Passage not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Passage deleted successfully' });
  } catch (error) {
    console.error('Error deleting passage:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete passage' }, { status: 500 });
  }
}
