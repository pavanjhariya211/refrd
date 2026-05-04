/**
 * Sends a transactional email via Resend's REST API. No npm dependency —
 * direct fetch keeps the bundle and lockfile small for a feature that
 * may not be configured.
 *
 * Configure with two Vercel env vars:
 *   RESEND_API_KEY   — from resend.com/api-keys
 *   EMAIL_FROM       — verified sender, e.g. "Refrd <noreply@refrd.com>"
 *
 * If either is missing the call no-ops and logs to the Vercel function
 * console. Production should set both; development can leave them out
 * and inspect logs.
 */
export interface SendEmailArgs {
  to: string | string[]
  subject: string
  html: string
  reply_to?: string
}

export async function sendEmail(args: SendEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    console.log('[email] Resend not configured; would send:', {
      to: args.to,
      subject: args.subject,
    })
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        reply_to: args.reply_to,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[email] Resend rejected send:', res.status, text)
    }
  } catch (err) {
    // Email failures should never break the calling business flow.
    console.error('[email] send failed:', err)
  }
}

// Tiny HTML helpers — no full templating library for an MVP.

export function emailLayout(body: string): string {
  return `<!doctype html><html><body style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#F8FAFC;padding:32px 16px;color:#1E293B">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <h1 style="margin:0 0 24px;font-size:20px;color:#1A56DB">Refrd</h1>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#94A3B8">— The Refrd team</p>
  </div>
</body></html>`
}
