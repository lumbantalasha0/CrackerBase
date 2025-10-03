Supabase setup for Crackerbase

1) Open your Supabase project and go to SQL editor.
2) Copy the contents of `supabase/ensure_tables.sql` and run it. This creates tables expected by the Netlify functions.
3) In Netlify site settings -> Build & deploy -> Environment -> Environment variables, add:
   - SUPABASE_URL = https://<your-project>.supabase.co
   - SUPABASE_SERVICE_ROLE = <your-service-role-key>
   - Optionally: DEBUG_SUPABASE_ERRORS = 1 (temporary, for debugging)
4) Trigger a new deploy (Deploys -> Trigger deploy -> Clear cache and deploy).
5) Use the debug endpoint to verify:
   curl -i https://<your-site>/.netlify/functions/debug-supabase

6) Test endpoints:
   POST /api/customers, /api/sales, /api/inventory with JSON bodies.
