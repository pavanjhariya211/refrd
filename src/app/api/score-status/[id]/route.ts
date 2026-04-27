import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS ensures only authorized parties can read.
  const { data } = await supabase
    .from('match_scores')
    .select('*')
    .eq('application_id', params.id)
    .maybeSingle()

  return NextResponse.json({ score: data })
}
