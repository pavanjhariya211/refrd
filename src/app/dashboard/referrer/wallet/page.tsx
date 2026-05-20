import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { formatINR, formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard/referrer/wallet')

  const { data: wallet } = await supabase
    .from('referrer_wallets')
    .select('id, balance, total_earned, total_withdrawn')
    .eq('referrer_id', user.id)
    .maybeSingle()

  const { data: txns } = wallet
    ? await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] as { id: string; type: 'credit' | 'withdrawal'; amount: number; description?: string; created_at: string }[] }

  // Compute pending review total — sum of paid bids on referrer's active jobs that aren't yet referred/refunded.
  const { data: jobIds } = await supabase
    .from('job_posts')
    .select('id')
    .eq('referrer_id', user.id)
  const ids = (jobIds ?? []).map((j) => j.id)
  let pending = 0
  if (ids.length) {
    const { data: pendingApps } = await supabase
      .from('applications')
      .select('bid_amount')
      .in('job_id', ids)
      .eq('payment_status', 'paid')
      .in('status', ['applied', 'reviewing', 'accepted'])
    pending = (pendingApps ?? []).reduce((acc, a) => acc + a.bid_amount, 0)
  }

  // Earnings chart: last 30 days credits
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const dailyEarnings: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dailyEarnings[d.toISOString().slice(0, 10)] = 0
  }
  ;(txns ?? []).forEach((t) => {
    if (t.type !== 'credit') return
    const ts = new Date(t.created_at).getTime()
    if (ts < thirtyDaysAgo) return
    const key = new Date(t.created_at).toISOString().slice(0, 10)
    if (key in dailyEarnings) dailyEarnings[key] += t.amount
  })
  const max = Math.max(1, ...Object.values(dailyEarnings))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-extrabold text-text">Wallet</h1>
        <p className="text-sm text-text-soft">
          Each successful referral credits 85% of the bid (min ₹50 platform fee).
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="card">
            <p className="text-xs uppercase text-text-faint">Available balance</p>
            <p className="mt-1 text-3xl font-extrabold text-success">
              {formatINR(wallet?.balance ?? 0)}
            </p>
            <Link href="#withdraw" className="mt-3 inline-block">
              <Button size="sm">Request withdrawal</Button>
            </Link>
          </div>
          <div className="card">
            <p className="text-xs uppercase text-text-faint">Total earned</p>
            <p className="mt-1 text-3xl font-extrabold">{formatINR(wallet?.total_earned ?? 0)}</p>
            <p className="text-xs text-text-faint">Lifetime payouts</p>
          </div>
          <div className="card">
            <p className="text-xs uppercase text-text-faint">Pending review</p>
            <p className="mt-1 text-3xl font-extrabold text-warning">{formatINR(pending)}</p>
            <p className="text-xs text-text-faint">Potential earnings if referred</p>
          </div>
        </div>

        <section className="mt-8 card">
          <h2 className="text-lg font-bold text-text">Earnings — last 30 days</h2>
          <div className="mt-4 flex h-32 items-end gap-1">
            {Object.entries(dailyEarnings).map(([day, value]) => (
              <div
                key={day}
                title={`${day}: ${formatINR(value)}`}
                className="flex-1 rounded-t bg-primary/80"
                style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? '4px' : '1px' }}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-text">Transactions</h2>
          {!txns?.length ? (
            <div className="card text-center text-sm text-text-soft">No transactions yet.</div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-white/[0.03] text-left text-xs font-semibold uppercase text-text-faint">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text-faint">
                        {formatRelativeTime(t.created_at)}
                      </td>
                      <td className="px-4 py-3">{t.description ?? '—'}</td>
                      <td
                        className={
                          'px-4 py-3 text-right font-semibold ' +
                          (t.type === 'credit' ? 'text-success' : 'text-error')
                        }
                      >
                        {t.type === 'credit' ? '+' : '−'}
                        {formatINR(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="withdraw" className="mt-8 card">
          <h2 className="text-lg font-bold text-text">Withdraw funds</h2>
          <p className="text-sm text-text-soft">
            Withdrawals are processed in 1–2 business days. Minimum withdrawal: ₹500.
          </p>
          <p className="mt-3 rounded-card bg-amber-500/10 p-3 text-xs text-warning">
            Bank account onboarding is being rolled out. Email{' '}
            <a className="underline" href="mailto:support@refrd.com">support@refrd.com</a> in
            the meantime.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
