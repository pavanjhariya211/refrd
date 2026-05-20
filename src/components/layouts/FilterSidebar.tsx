'use client'

import { Filter } from 'lucide-react'
import { EXPERIENCE_LEVELS, LOCATION_TYPES } from '@/lib/constants'
import type { ExperienceLevel, LocationType } from '@/types'
import { Button } from '@/components/ui/Button'

export interface JobFilters {
  q: string
  locationType?: LocationType
  experienceLevel?: ExperienceLevel
  minBid?: number
  hasVerified?: boolean
}

interface Props {
  filters: JobFilters
  onChange: (next: JobFilters) => void
  onReset: () => void
}

export function FilterSidebar({ filters, onChange, onReset }: Props) {
  return (
    <aside className="card sticky top-20 space-y-5 self-start">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <Filter className="h-4 w-4" /> Filters
        </h3>
        <button
          onClick={onReset}
          className="text-xs font-medium text-primary hover:underline"
        >
          Reset
        </button>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-faint">
          Location
        </label>
        <div className="space-y-1">
          {LOCATION_TYPES.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="locationType"
                checked={filters.locationType === opt.value}
                onChange={() => onChange({ ...filters, locationType: opt.value })}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-faint">
          Experience
        </label>
        <div className="space-y-1">
          {EXPERIENCE_LEVELS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="experienceLevel"
                checked={filters.experienceLevel === opt.value}
                onChange={() => onChange({ ...filters, experienceLevel: opt.value })}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!filters.hasVerified}
            onChange={(e) => onChange({ ...filters, hasVerified: e.target.checked })}
          />
          Only verified employees
        </label>
      </div>

      <Button variant="outline" size="sm" fullWidth onClick={onReset}>
        Clear all filters
      </Button>
    </aside>
  )
}
