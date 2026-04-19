'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';

async function ensureVerifiedProfile(user: User): Promise<string | null> {
  const supabase = createClient();
  const email = user.email ?? '';
  if (!email.endsWith('@tulane.edu')) {
    await supabase.auth.signOut();
    return 'Only @tulane.edu emails are allowed.';
  }

  const username =
    (typeof user.user_metadata?.username === 'string' && user.user_metadata.username) ||
    email.split('@')[0] ||
    'student';

  const gradRaw = user.user_metadata?.graduation_year;
  const graduationYear =
    typeof gradRaw === 'number'
      ? gradRaw
      : typeof gradRaw === 'string' && gradRaw !== ''
        ? Number(gradRaw)
        : null;
  const graduation_year = Number.isFinite(graduationYear as number) ? graduationYear : null;

  const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      username,
      graduation_year,
      verification_status: 'verified'
    });
    if (insertError) {
      return insertError.message;
    }
  } else {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username,
        graduation_year,
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    if (updateError) {
      return updateError.message;
    }
  }

  return null;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [msg, setMsg] = useState('');
  const [msgTone, setMsgTone] = useState<'error' | 'neutral'>('error');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setMsg(err);
      setMsgTone('error');
    }
  }, [searchParams]);

  const validateTulane = () => {
    if (!email.endsWith('@tulane.edu')) {
      setMsgTone('error');
      setMsg('Only @tulane.edu emails are allowed.');
      return false;
    }
    return true;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    setMsgTone('error');
    if (!validateTulane()) return;

    setSubmitting(true);
    const supabase = createClient();

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMsg(error.message);
          return;
        }
        if (!data.user) {
          setMsg('Could not load your account.');
          return;
        }
        const profileErr = await ensureVerifiedProfile(data.user);
        if (profileErr) {
          setMsg(profileErr);
          return;
        }
        router.replace('/home');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
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

      if (!data.user) {
        setMsg('Sign up did not return a user.');
        return;
      }

      if (!data.session) {
        setMsgTone('neutral');
        setMsg('Account created. Sign in once your email is confirmed (if required by your project settings).');
        setMode('login');
        return;
      }

      const profileErr = await ensureVerifiedProfile(data.user);
      if (profileErr) {
        setMsg(profileErr);
        return;
      }

      router.replace('/home');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md p-4">
      <h1 className="mb-3 text-xl font-semibold text-tulane-green">Tulane Marketplace</h1>
      <p className="mb-4 text-sm text-gray-600">Sign in with your Tulane email and password.</p>

      <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          className={`flex-1 rounded py-2 text-sm font-medium ${mode === 'login' ? 'bg-tulane-green text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => {
            setMode('login');
            setMsg('');
            setMsgTone('error');
          }}
        >
          Log in
        </button>
        <button
          type="button"
          className={`flex-1 rounded py-2 text-sm font-medium ${mode === 'signup' ? 'bg-tulane-green text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => {
            setMode('signup');
            setMsg('');
            setMsgTone('error');
          }}
        >
          Sign up
        </button>
      </div>

      <form className="space-y-3 border border-gray-300 p-4" onSubmit={submit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@tulane.edu"
          required
          autoComplete="email"
          className="w-full border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="w-full border border-gray-300 px-3 py-2 text-sm"
        />
        {mode === 'signup' && (
          <>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              autoComplete="username"
              className="w-full border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              placeholder="Graduation year (optional)"
              type="number"
              className="w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-tulane-green py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
      {msg && (
        <p className={`mt-3 text-sm ${msgTone === 'error' ? 'text-red-700' : 'text-gray-700'}`}>{msg}</p>
      )}
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-md p-4">
          <p className="text-sm text-gray-600">Loading…</p>
        </main>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
