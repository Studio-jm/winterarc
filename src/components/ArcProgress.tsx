interface ArcProgressProps {
  day: number
  total: number
}

export default function ArcProgress({ day, total }: ArcProgressProps) {
  const pct = Math.round((day / total) * 100)
  const size = 96
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (pct / 100) * circumference

  return (
    <div className="arc" title={`Day ${day} of ${total}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="arc__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="arc__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="arc__label">
        <span className="arc__day">{day}</span>
        <span className="arc__of">/ {total}</span>
      </div>
    </div>
  )
}
