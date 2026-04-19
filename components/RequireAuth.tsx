'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'allowed' | 'blocked'>('loading');

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user || !user.email_confirmed_at || !user.email?.endsWith('@tulane.edu')) {
        setState('blocked');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', user.id)
        .single();

      if (profile?.verification_status !== 'verified') {
        setState('blocked');
        return;
      }

      setState('allowed');
    };

    check();
  }, []);

  if (state === 'loading') {
    return <p className="p-4 text-sm">Checking account...</p>;
  }

  if (state === 'blocked') {
    return (
      <div className="m-4 border border-red-300 bg-red-50 p-4 text-sm">
        <p className="font-semibold">You must be a verified @tulane.edu student to access this section.</p>
        <Link href="/auth" className="mt-2 inline-block text-tulane-green underline">
          Go to authentication
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}