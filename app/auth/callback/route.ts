import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

function safeNextPath(raw: string | null): string {
  const fallback = '/home';
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback;
  }
  return raw;
}

/**
 * Ensures a Tulane profile row exists and is verified after email confirmation.
 * Mirrors the DB trigger for projects that have not applied the latest schema.sql yet.
 */
async function syncTulaneVerifiedProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null }
) {
  const email = user.email ?? '';
  if (!email.endsWith('@tulane.edu') || !user.email_confirmed_at) {
    return;
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

  const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();

  if (!existing) {
    await supabase.from('profiles').insert({
      id: user.id,
      username,
      graduation_year: Number.isFinite(graduationYear as number) ? graduationYear : null,
      verification_status: 'verified'
    });
    return;
  }

  await supabase
    .from('profiles')
    .update({ verification_status: 'verified', updated_at: new Date().toISOString() })
    .eq('id', user.id);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextPath = safeNextPath(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=missing_code', request.url));
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // ignore if called from an unsupported context; middleware still refreshes sessions
          }
        }
      }
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errUrl = new URL('/auth', request.url);
    errUrl.searchParams.set('error', error.message);
    return NextResponse.redirect(errUrl);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await syncTulaneVerifiedProfile(supabase, user);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
