import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Listening from '@/models/Listening';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const listening = await Listening.findById(id).populate('testId', 'title').lean().exec();
    if (!listening) return NextResponse.json({ success: false, message: 'Listening section not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: listening });
  } catch (error) {
    console.error('Error fetching listening section:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch listening section' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { title, audioUrl, transcript, testId, order } = await request.json();

    const listening = await Listening.findByIdAndUpdate(
      id,
      { title, audioUrl, transcript, testId: testId || null, order },
      { new: true }
    ).lean();
    if (!listening) return NextResponse.json({ success: false, message: 'Listening section not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: listening });
  } catch (error) {
    console.error('Error updating listening section:', error);
    return NextResponse.json({ success: false, message: 'Failed to update listening section' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const listening = await Listening.findByIdAndDelete(id);
    if (!listening) return NextResponse.json({ success: false, message: 'Listening section not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Listening section deleted successfully' });
  } catch (error) {
    console.error('Error deleting listening section:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete listening section' }, { status: 500 });
  }
}
