import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Magic links may still point at /home?code=... — send them through the server callback.
  const code = url.searchParams.get('code');
  if (code && !url.pathname.startsWith('/auth/callback')) {
    const clean = url.clone();
    clean.searchParams.delete('code');
    const nextPath = `${clean.pathname}${clean.search}` || '/home';
    const redirect = new URL('/auth/callback', request.url);
    redirect.searchParams.set('code', code);
    redirect.searchParams.set('next', nextPath.startsWith('/') ? nextPath : '/home');
    return NextResponse.redirect(redirect);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
