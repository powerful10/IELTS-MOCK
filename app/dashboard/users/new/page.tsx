'use client';

import UserForm from '@/components/UserForm';

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Create User Account</h1>
        <p className="text-slate-500 text-sm mt-1">Manually provision a new student or administrator</p>
      </div>

      <UserForm />
    </div>
  );
}
