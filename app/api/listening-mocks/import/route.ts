import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ListeningMock from '@/models/ListeningMock';
import mongoose from 'mongoose';

// The expected structure of the JSON file
interface ImportJSON {
  title: string;
  parts: Array<{
    partNumber: 1 | 2 | 3 | 4;
    transcript?: string;
    questions: Array<{
      questionText: string;
      questionType: string;
      options?: string[];
      correctAnswer: string;
      explanation?: string;
    }>;
  }>;
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    // Parse the JSON body
    const data: ImportJSON = await request.json();

    if (!data.title) {
      return NextResponse.json({ success: false, message: 'Missing title in JSON' }, { status: 400 });
    }

    if (!Array.isArray(data.parts) || data.parts.length === 0) {
      return NextResponse.json({ success: false, message: 'JSON must contain a parts array' }, { status: 400 });
    }

    // Validate and format parts
    const formattedParts = [1, 2, 3, 4].map(partNum => {
      const partData = data.parts.find(p => p.partNumber === partNum);
      
      return {
        partNumber: partNum,
        audioUrl: '', // Audio is uploaded separately
        transcript: partData?.transcript || '',
        questions: (partData?.questions || []).map((q, idx) => ({
          questionText: q.questionText || '',
          questionType: q.questionType || 'multiple_choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          explanation: q.explanation || '',
          order: idx + 1
        }))
      };
    });

    // Create the mock test
    const newMock = new ListeningMock({
      title: data.title,
      status: 'draft',
      parts: formattedParts
    });

    await newMock.save();

    return NextResponse.json({ 
      success: true, 
      data: newMock,
      message: 'Successfully imported mock test' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to import JSON' }, 
      { status: 500 }
    );
  }
}
