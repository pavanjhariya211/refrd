/**
 * Returns true if the given Supabase user id is allowed to use admin tools.
 * Admins are configured via the comma-separated ADMIN_USER_IDS env var
 * (Vercel → Settings → Environment Variables). No DB migration needed —
 * editing the env var + redeploy adds/removes admins.
 *
 * Find your UUID by running this in Supabase SQL editor:
 *   select id, email from auth.users where email = 'you@example.com';
 */
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false
  const list = (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.includes(userId)
}
