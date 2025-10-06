// Supabase client removed: this project uses Neon/Postgres for server-side storage.
// If you relied on client-side Supabase for auth/storage, replace calls with
// calls to your server API (Netlify functions) that interact with Neon.

// Export a stub to avoid build-time errors if imported elsewhere. It will throw
// if used at runtime to make the migration obvious.
const supabase = new Proxy({}, {
	get() { throw new Error('Supabase client removed. Call your server APIs instead.'); }
});

export { supabase };
