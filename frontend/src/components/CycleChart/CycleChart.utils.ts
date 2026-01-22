import * as d3 from 'd3'
import type { Phase } from '@/types'

export interface ChartConfig {
  width: number
  height: number
  innerRadius: number
  outerRadius: number
  padding: number
}

export const defaultConfig: ChartConfig = {
  width: 600,
  height: 600,
  innerRadius: 120,
  outerRadius: 200,
  padding: 20,
}

export function calculateArcPath(
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number
): string {
  const arc = d3
    .arc<unknown>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle)
    .endAngle(endAngle)

  return arc() || ''
}

export function calculatePhaseAngles(phaseCount: number): Array<{ start: number; end: number }> {
  const angleStep = (2 * Math.PI) / phaseCount
  return Array.from({ length: phaseCount }, (_, i) => ({
    start: i * angleStep - Math.PI / 2, // -90도부터 시작
    end: (i + 1) * angleStep - Math.PI / 2,
  }))
}

export function getPointOnArc(
  angle: number,
  radius: number,
  centerX: number,
  centerY: number
): { x: number; y: number } {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  }
}

export function getPhaseAtPoint(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  phases: Phase[],
  innerRadius: number,
  outerRadius: number
): number | null {
  const dx = x - centerX
  const dy = y - centerY
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < innerRadius || distance > outerRadius) {
    return null
  }

  let angle = Math.atan2(dy, dx)
  // -90도 오프셋 조정
  angle = angle + Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI

  const phaseIndex = Math.floor((angle / (2 * Math.PI)) * phases.length)
  return phaseIndex < phases.length ? phaseIndex : null
}
