import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Question from '@/models/Question';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const passageId = searchParams.get('passageId');
    const listeningId = searchParams.get('listeningId');
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    let filter: any = {};
    if (passageId) filter.passageId = passageId;
    if (listeningId) filter.listeningId = listeningId;
    if (search) filter.questionText = { $regex: search, $options: 'i' };
    if (type && type !== 'All Types') filter.questionType = type;

    const questions = await Question.find(filter).lean().exec();
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, message: 'Unable to load questions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { questionText, questionType, options, correctAnswer, explanation, passageId, listeningId } = await request.json();

    if (!questionText || !correctAnswer) {
      return NextResponse.json({ success: false, message: 'questionText and correctAnswer are required' }, { status: 400 });
    }

    const question = new Question({
      questionText,
      questionType: questionType || 'multiple_choice',
      options: options || [],
      correctAnswer,
      explanation: explanation || '',
      passageId: passageId || null,
      listeningId: listeningId || null,
    });
    await question.save();

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ success: false, message: 'Failed to create question' }, { status: 500 });
  }
}
