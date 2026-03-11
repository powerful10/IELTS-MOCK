import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Question from '@/models/Question';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const question = await Question.findById(id).lean().exec();
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch question' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const { questionText, questionType, options, correctAnswer, explanation, passageId, listeningId } = await request.json();

    const question = await Question.findByIdAndUpdate(
      id,
      { questionText, questionType, options, correctAnswer, explanation, passageId: passageId || null, listeningId: listeningId || null },
      { new: true }
    ).lean();
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ success: false, message: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const question = await Question.findByIdAndDelete(id);
    if (!question) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete question' }, { status: 500 });
  }
}
