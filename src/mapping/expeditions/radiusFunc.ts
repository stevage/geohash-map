//@ts-ignore
import U from 'map-gl-utils'
interface CircleRadiusFuncParams {
  isGlow?: boolean
  isFlash?: boolean
  filters?: { scaleExpeditionsBy: string }
  isClickable?: boolean
}

export function circleRadiusFunc({
  isGlow,
  isFlash,
  filters,
  isClickable,
  type,
  subtractStroke = false,
}: CircleRadiusFuncParams = {}) {
  const getRadius = (r: number, strokeWidth?: number = 2) => {
    const d = ['case', ['get', 'success'], strokeWidth, 0]
    const extra = isFlash ? 30 : isGlow ? 2 : isClickable ? 6 : d
    return {
      none: ['+', r, extra], //['case', ['get', 'success'], strokeWidth, 0]],
      participantCount: ['+', ['*', ['log2', ['get', 'participantsCount']], r], extra],
      reportKb: ['+', ['*', ['*', 0.5, ['get', 'reportKb']], r], extra],
      achievementCount: ['+', ['*', ['length', ['get', 'achievements']], r], extra],
      r,
    }[filters!.scaleExpeditionsBy]
  }
  // new way
  return U.interpolateZoom({
    1: isFlash ? 5 : isGlow ? 0 : getRadius(1, 0),
    3: isFlash ? 10 : isGlow ? getRadius(1) : getRadius(1),
    5: isFlash ? 15 : getRadius(2),
    8: getRadius(3),
    10: getRadius(4),
    12: isGlow ? getRadius(16) : getRadius(10),
  })
}
