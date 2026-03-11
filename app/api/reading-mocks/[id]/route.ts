import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ReadingMock from '@/models/ReadingMock';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const mock = await ReadingMock.findById(id).lean();
    if (!mock) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: mock });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch reading mock' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const mock = await ReadingMock.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!mock) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: mock });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update reading mock' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const mock = await ReadingMock.findByIdAndDelete(id);
    if (!mock) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Reading mock deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete reading mock' }, { status: 500 });
  }
}
