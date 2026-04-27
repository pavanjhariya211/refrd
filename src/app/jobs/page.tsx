'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { FilterSidebar, type JobFilters } from '@/components/layouts/FilterSidebar'
import { JobCard } from '@/components/ui/JobCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { Input } from '@/components/ui/Input'
import { useJobs } from '@/hooks/useJobs'

const EMPTY: JobFilters = { q: '' }

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>(EMPTY)
  const { jobs, loading } = useJobs(filters)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Open roles</h1>
            <p className="text-sm text-slate-600">
              Bid to be reviewed first. Full refund if not selected.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search by title, company, or skills"
            prefix={<Search className="h-4 w-4" />}
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(EMPTY)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : jobs.length === 0 ? (
              <div className="col-span-full card text-center text-sm text-slate-600">
                No jobs match your filters. Try clearing them.
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
