'use client';

import { FormEvent, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { createClient } from '@/lib/supabase-browser';

export default function ProfilePage() {
  const bypassAuthInDev = process.env.NODE_ENV === 'development';
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [activeCount, setActiveCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (bypassAuthInDev) {
          const demoProfile = { username: 'demo_user', verification_status: 'verified', graduation_year: 2026 };
          setProfile(demoProfile);
          setUsername(demoProfile.username);
          setGraduationYear(demoProfile.graduation_year.toString());
          setActiveCount(2);
          setSoldCount(1);
          setLikedCount(5);
        }
        return;
      }

      const [{ data: p }, { count: active }, { count: sold }, { count: liked }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', auth.user.id).eq('status', 'available'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', auth.user.id).eq('status', 'sold'),
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', auth.user.id)
      ]);

      setProfile(p);
      setUsername(p?.username ?? '');
      setGraduationYear(p?.graduation_year?.toString() ?? '');
      setActiveCount(active ?? 0);
      setSoldCount(sold ?? 0);
      setLikedCount(liked ?? 0);
    };
    void load();
  }, [bypassAuthInDev]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      if (bypassAuthInDev) {
        setProfile((prev: any) => ({ ...(prev ?? {}), username, graduation_year: graduationYear ? Number(graduationYear) : null }));
      }
      return;
    }

    await supabase
      .from('profiles')
      .update({ username, graduation_year: graduationYear ? Number(graduationYear) : null })
      .eq('id', auth.user.id);
  };

  const signOut = async () => {
    if (bypassAuthInDev) {
      window.location.href = '/';
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <RequireAuth>
      <section className="space-y-3 p-3">
        <h2 className="text-base font-semibold">Profile</h2>
        <div className="card p-3 text-sm">
          <p>Username: {profile?.username}</p>
          <p>Verification: {profile?.verification_status === 'verified' ? 'Tulane Verified' : 'Unverified'}</p>
          <p>Active listings: {activeCount}</p>
          <p>Sold listings: {soldCount}</p>
          <p>Liked items: {likedCount}</p>
        </div>

        <form onSubmit={save} className="space-y-2 border border-gray-300 p-3">
          <h3 className="font-semibold">Settings</h3>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
          <input
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            placeholder="Graduation year"
            type="number"
          />
          <button className="bg-tulane-green px-3 py-2 text-white" type="submit">
            Save
          </button>
        </form>

        <button onClick={signOut} className="border border-gray-500 px-3 py-2 text-sm">
          Sign out
        </button>
      </section>
    </RequireAuth>
  );
}
