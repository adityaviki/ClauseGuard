import { riskScoreColor, riskScoreLabel } from '@/lib/constants';

interface RiskGaugeProps {
  score: number;
  size?: number;
}

export function RiskGauge({ score, size = 160 }: RiskGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = riskScoreColor(score);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        {/* Score ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        {/* Center text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-foreground text-3xl font-bold"
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          {score.toFixed(1)}
        </text>
        <text
          x={center}
          y={center + 20}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 fill-muted-foreground text-xs"
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          / 10
        </text>
      </svg>
      <span className="text-sm font-medium" style={{ color }}>
        {riskScoreLabel(score)}
      </span>
    </div>
  );
}
