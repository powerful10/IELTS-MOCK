import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ListeningMock from '@/models/ListeningMock';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const mock = await ListeningMock.findById(id).lean();
    if (!mock) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: mock });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch listening mock' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const mock = await ListeningMock.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!mock) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: mock });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update listening mock' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const mock = await ListeningMock.findByIdAndDelete(id);
    if (!mock) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Listening mock deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete listening mock' }, { status: 500 });
  }
}
