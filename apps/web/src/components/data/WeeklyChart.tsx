import { weeklyEngagement } from '../../services/demoData'
import { DemoBadge } from '../ui/DemoBadge'

export function WeeklyChart() {
  const points = weeklyEngagement
    .map((item, index) => {
      const x = 24 + index * 62
      const y = 156 - item.value * 1.25
      return x + ',' + y
    })
    .join(' ')

  return (
    <div className="chart-panel">
      <div className="chart-meta">
        <div>
          <span className="eyebrow">PARTICIPATION INDEX</span>
          <strong>Audience activity</strong>
        </div>
        <DemoBadge />
      </div>
      <figure className="chart-figure">
      <svg aria-hidden="true" className="line-chart" viewBox="0 0 420 190">
        <defs>
          <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9565f5" stopOpacity=".25" />
            <stop offset="100%" stopColor="#9565f5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 75, 120, 165].map((y) => (
          <line className="chart-gridline" key={y} x1="18" x2="412" y1={y} y2={y} />
        ))}
        <polygon points={'24,165 ' + points + '396,165'} fill="url(#area-fill)" />
        <polyline className="chart-line" points={points} />
        {weeklyEngagement.map((item, index) => {
          const x = 24 + index * 62
          const y = 156 - item.value * 1.25
          return (
            <g key={item.label}>
              <circle className="chart-point" cx={x} cy={y} r="3.5" />
              <text className="chart-label" textAnchor="middle" x={x} y="184">{item.label}</text>
            </g>
          )
        })}
      </svg>
      <figcaption className="sr-only">Demo audience activity rises over the week, with a Saturday peak.</figcaption>
      </figure>
    </div>
  )
}
