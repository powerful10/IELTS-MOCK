import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Test from '@/models/Test';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const test = await Test.findById(id).populate('createdBy', 'name email').lean().exec();
    if (!test) return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: test });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { title, description, sectionType, status } = await request.json();

    const test = await Test.findByIdAndUpdate(
      id,
      { title, description, sectionType, status },
      { new: true }
    ).lean();
    if (!test) return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: test });
  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json({ success: false, message: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const test = await Test.findByIdAndDelete(id);
    if (!test) return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete test' }, { status: 500 });
  }
}
