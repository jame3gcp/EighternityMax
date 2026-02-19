import React, { useMemo } from 'react'
import { REGION_SIDO_GUN, formatRegionValue, parseRegionValue } from '@/data/region'

const selectClass =
  'touch-target w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-300 dark:border-gray-600'

interface RegionSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

const RegionSelect: React.FC<RegionSelectProps> = ({
  value,
  onChange,
  label = '거주 지역 (선택사항)',
  error,
  disabled,
  className = '',
}) => {
  const [sido, sigungu] = useMemo(() => parseRegionValue(value), [value])
  const currentSidoEntry = useMemo(() => REGION_SIDO_GUN.find(s => s.name === sido), [sido])
  const sigunguOptions = currentSidoEntry?.sigungu ?? []

  const handleSidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSido = e.target.value
    onChange(formatRegionValue(nextSido, ''))
  }

  const handleSigunguChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSigungu = e.target.value
    onChange(formatRegionValue(sido, nextSigungu))
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={sido}
          onChange={handleSidoChange}
          disabled={disabled}
          className={selectClass}
          aria-label="시·도 선택"
        >
          <option value="">시·도 선택</option>
          {REGION_SIDO_GUN.map(s => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={sigungu}
          onChange={handleSigunguChange}
          disabled={disabled || !sido}
          className={selectClass}
          aria-label="구·군 선택"
        >
          <option value="">구·군 선택</option>
          {sigunguOptions.map(g => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export default RegionSelect
