'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Mail, Filter, Edit, Shield, ShieldOff, Users as UsersIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'All Roles') params.append('role', roleFilter);
      
      const response = await fetch(`/api/users?${params.toString()}`);
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error();
      setUsers(json.data || []);
    } catch (err) {
      setError('Something went wrong while loading data. Please refresh the page.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, roleFilter, fetchUsers]);

  const handleRoleToggle = async (user: any) => {
    if (!confirm(`Are you sure you want to change ${user.name}'s role?`)) return;
    
    try {
      setIsUpdating(user._id);
      const newRole = user.role === 'admin' ? 'student' : 'admin';
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, role: newRole }),
      });
      
      if (!response.ok) throw new Error('Failed to update user role');
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Users</h1>
          <p className="text-slate-500 text-sm mt-1">Manage administrators and view student accounts</p>
        </div>
        <Link 
          href="/dashboard/users/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} className="mr-2" />
          Create User
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-sm flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 sm:flex-none text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option>All Roles</option>
              <option>Students Only</option>
              <option>Administrators Only</option>
            </select>
          </div>
        </div>

        {loading && users.length === 0 ? (
           <LoadingSpinner text="Loading users..." />
        ) : error ? (
           <div className="p-8 text-center text-red-500">{error}</div>
        ) : users.length === 0 ? (
           <EmptyState 
             title={search || roleFilter !== 'All Roles' ? "No users found" : "No users exist yet"}
             description={search || roleFilter !== 'All Roles' ? "Try adjusting your search or filters." : "Users will appear here when they register."}
             iconType={search || roleFilter !== 'All Roles' ? "search" : "user"}
           />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4 font-medium">User Profile</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Joined Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold mr-3 shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{user.name}</div>
                          <div className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Mail size={12} className="mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' && <Shield size={12} className="mr-1" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === 'admin' ? (
                          <button 
                            onClick={() => handleRoleToggle(user)}
                            disabled={isUpdating === user._id}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50" 
                            title="Revoke Admin"
                          >
                            {isUpdating === user._id ? <LoadingSpinner text="" /> : <ShieldOff size={16} />}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRoleToggle(user)}
                            disabled={isUpdating === user._id}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50" 
                            title="Make Admin"
                          >
                           {isUpdating === user._id ? <LoadingSpinner text="" /> : <Shield size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
