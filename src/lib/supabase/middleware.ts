import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

let warnedMissingEnv = false;

// Refreshes the Supabase session cookie on every request so Server
// Components always see a valid session.
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; userId: string | null }> {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // Missing config would otherwise throw on every request — let it through
    // unauthenticated instead of taking the whole app down.
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.error("Supabase env vars are not set; skipping session refresh.");
    }
    return { response: supabaseResponse, userId: null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the JWT against Supabase Auth and refreshes it if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, userId: user?.id ?? null };
}
