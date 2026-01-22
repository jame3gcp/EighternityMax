import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { Phase } from '@/types'
import { calculatePhaseAngles, calculateArcPath, getPhaseAtPoint, defaultConfig, type ChartConfig } from './CycleChart.utils'

interface CycleChartProps {
  phases: Phase[]
  currentPhase: number
  onPhaseClick?: (phaseId: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfigs: Record<string, ChartConfig> = {
  sm: { width: 300, height: 300, innerRadius: 60, outerRadius: 100, padding: 10 },
  md: { width: 500, height: 500, innerRadius: 100, outerRadius: 180, padding: 20 },
  lg: { width: 700, height: 700, innerRadius: 140, outerRadius: 250, padding: 30 },
}

const CycleChart: React.FC<CycleChartProps> = ({
  phases,
  currentPhase,
  onPhaseClick,
  size = 'md',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null)
  const config = sizeConfigs[size] || defaultConfig

  useEffect(() => {
    if (!svgRef.current || phases.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, innerRadius, outerRadius, padding } = config
    const centerX = width / 2
    const centerY = height / 2

    const phaseAngles = calculatePhaseAngles(phases.length)

    // 배경 원
    svg
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', outerRadius + 5)
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 2)
      .attr('opacity', 0.1)

    // 각 단계별 아크 그리기
    phases.forEach((phase, index) => {
      const { start, end } = phaseAngles[index]
      const isCurrent = index === currentPhase
      const isHovered = index === hoveredPhase

      const arcPath = calculateArcPath(start, end, innerRadius, outerRadius)

      const g = svg.append('g')

      // 아크
      g.append('path')
        .attr('d', arcPath)
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .attr('fill', phase.color)
        .attr('opacity', isCurrent ? 0.9 : isHovered ? 0.7 : 0.5)
        .attr('stroke', isCurrent ? '#fff' : 'transparent')
        .attr('stroke-width', isCurrent ? 3 : 0)
        .attr('cursor', 'pointer')
        .on('mouseenter', () => setHoveredPhase(index))
        .on('mouseleave', () => setHoveredPhase(null))
        .on('click', () => onPhaseClick?.(index))
        .transition()
        .duration(200)
        .attr('opacity', isCurrent ? 0.9 : isHovered ? 0.7 : 0.5)

      // 중간 지점에 레이블
      const midAngle = (start + end) / 2
      const labelRadius = (innerRadius + outerRadius) / 2
      const labelX = centerX + labelRadius * Math.cos(midAngle)
      const labelY = centerY + labelRadius * Math.sin(midAngle)

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', isCurrent ? '#fff' : '#333')
        .attr('font-size', size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px')
        .attr('font-weight', isCurrent ? 'bold' : 'normal')
        .attr('pointer-events', 'none')
        .text(phase.name.split(' ')[0]) // 첫 단어만 표시
    })

    // 현재 위치 표시
    if (currentPhase >= 0 && currentPhase < phases.length) {
      const { start, end } = phaseAngles[currentPhase]
      const midAngle = (start + end) / 2
      const indicatorRadius = outerRadius + 15

      svg
        .append('circle')
        .attr('cx', centerX + indicatorRadius * Math.cos(midAngle))
        .attr('cy', centerY + indicatorRadius * Math.sin(midAngle))
        .attr('r', 8)
        .attr('fill', phases[currentPhase].color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
    }

    // 터치 이벤트 처리
    const handleTouch = (event: TouchEvent) => {
      event.preventDefault()
      const touch = event.touches[0] || event.changedTouches[0]
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      const phaseId = getPhaseAtPoint(x, y, centerX, centerY, phases, innerRadius, outerRadius)
      if (phaseId !== null) {
        onPhaseClick?.(phaseId)
      }
    }

    svgRef.current?.addEventListener('touchstart', handleTouch)
    svgRef.current?.addEventListener('touchmove', handleTouch)

    return () => {
      svgRef.current?.removeEventListener('touchstart', handleTouch)
      svgRef.current?.removeEventListener('touchmove', handleTouch)
    }
  }, [phases, currentPhase, hoveredPhase, config, onPhaseClick, size])

  return (
    <div className={`flex justify-center items-center ${className}`} role="img" aria-label="에너지 사이클 차트">
      <svg
        ref={svgRef}
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="max-w-full h-auto"
        aria-hidden="false"
      >
        {/* SVG 내용은 useEffect에서 동적으로 생성 */}
      </svg>
    </div>
  )
}

export default CycleChart
