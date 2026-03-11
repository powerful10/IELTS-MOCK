'use client';

import { BookOpen, Headphones, Users, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) throw new Error();
        setData(json.data);
      } catch {
        setError('Something went wrong while loading data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  const { stats, recentReadingMocks, recentListeningMocks } = data;

  const statCards = [
    {
      title: 'Reading Mocks',
      value: stats.readingMocks,
      sub: `${stats.readingPublished} published`,
      icon: <BookOpen size={22} />,
      color: 'bg-indigo-50 text-indigo-600',
      href: '/dashboard/reading',
    },
    {
      title: 'Listening Mocks',
      value: stats.listeningMocks,
      sub: `${stats.listeningPublished} published`,
      icon: <Headphones size={22} />,
      color: 'bg-teal-50 text-teal-600',
      href: '/dashboard/listening',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      sub: 'Registered users',
      icon: <Users size={22} />,
      color: 'bg-blue-50 text-blue-600',
      href: '/dashboard/users',
    },
    {
      title: 'Published Total',
      value: stats.readingPublished + stats.listeningPublished,
      sub: 'Live tests',
      icon: <CheckCircle size={22} />,
      color: 'bg-green-50 text-green-600',
      href: '/dashboard/reading',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor your IELTS platform activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href} className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-slate-500 text-xs font-medium">{stat.title}</h3>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reading Mocks */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800">Recent Reading</h2>
            <Link href="/dashboard/reading" className="text-xs text-indigo-600 font-medium hover:text-indigo-800">View All</Link>
          </div>
          {recentReadingMocks?.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No reading mocks yet.</p>
          ) : (
            <div className="space-y-3">
              {recentReadingMocks?.map((mock: any) => (
                <div key={mock._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen size={14} />
                    </div>
                    <span className="font-medium text-slate-700 text-sm truncate">{mock.title}</span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${mock.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {mock.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listening Mocks */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800">Recent Listening</h2>
            <Link href="/dashboard/listening" className="text-xs text-teal-600 font-medium hover:text-teal-800">View All</Link>
          </div>
          {recentListeningMocks?.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No listening mocks yet.</p>
          ) : (
            <div className="space-y-3">
              {recentListeningMocks?.map((mock: any) => (
                <div key={mock._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Headphones size={14} />
                    </div>
                    <span className="font-medium text-slate-700 text-sm truncate">{mock.title}</span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${mock.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {mock.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/reading/new" className="flex items-center gap-3 w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 text-sm">
              <BookOpen size={16} /> Create Reading Mock
            </Link>
            <Link href="/dashboard/listening/new" className="flex items-center gap-3 w-full py-3 px-4 bg-teal-50 text-teal-700 font-semibold rounded-lg hover:bg-teal-100 transition-colors border border-teal-100 text-sm">
              <Headphones size={16} /> Create Listening Mock
            </Link>
            <Link href="/dashboard/users" className="flex items-center gap-3 w-full py-3 px-4 bg-slate-50 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 text-sm">
              <Users size={16} /> Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
