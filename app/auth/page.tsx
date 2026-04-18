'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('@tulane.edu')) {
      setMsg('Only @tulane.edu emails are allowed.');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: {
          username,
          graduation_year: gradYear ? Number(gradYear) : null
        }
      }
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg('Check your Tulane email for the login link.');
  };

  return (
    <main className="mx-auto min-h-screen max-w-md p-4">
      <h1 className="mb-3 text-xl font-semibold text-tulane-green">Tulane Marketplace Login</h1>
      <form className="space-y-2 border border-gray-300 p-4" onSubmit={submit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@tulane.edu"
          required
        />
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        <input
          value={gradYear}
          onChange={(e) => setGradYear(e.target.value)}
          placeholder="Graduation year (optional)"
          type="number"
        />
        <button type="submit" className="w-full bg-tulane-green py-2 text-white">
          Send Magic Link
        </button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
