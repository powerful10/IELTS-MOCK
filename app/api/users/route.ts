import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    
    let filter: any = {};
    
    // For roles
    if (role === 'Students Only') filter.role = 'student';
    if (role === 'Administrators Only') filter.role = 'admin';

    // For name or email search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).exec();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, message: 'Unable to load data' }, { status: 500 });
  }
}
