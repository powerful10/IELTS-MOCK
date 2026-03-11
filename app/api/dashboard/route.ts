import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import ReadingMock from '@/models/ReadingMock';
import ListeningMock from '@/models/ListeningMock';

export async function GET() {
  try {
    await connectToDatabase();

    const [readingMocks, listeningMocks, totalStudents, recentReadingMocks, recentListeningMocks] = await Promise.all([
      ReadingMock.countDocuments(),
      ListeningMock.countDocuments(),
      User.countDocuments({ role: 'student' }),
      ReadingMock.find().sort({ createdAt: -1 }).limit(3).lean().exec(),
      ListeningMock.find().sort({ createdAt: -1 }).limit(3).lean().exec(),
    ]);

    const readingPublished = await ReadingMock.countDocuments({ status: 'published' });
    const listeningPublished = await ListeningMock.countDocuments({ status: 'published' });

    return NextResponse.json({
      success: true,
      data: {
        stats: { readingMocks, listeningMocks, totalStudents, readingPublished, listeningPublished },
        recentReadingMocks,
        recentListeningMocks,
      },
    });
  } catch (error) {
    console.error('Failed to aggregate dashboard data:', error);
    return NextResponse.json({ success: false, message: 'Unable to load dashboard data' }, { status: 500 });
  }
}
