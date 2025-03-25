
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts";
import { PnLData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PnLChartProps {
  data: PnLData[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PnLData;
    const isPositive = data.change >= 0;
    
    return (
      <div className="glass-card p-3 min-w-[180px]">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xl font-mono mt-1">
          ${data.value.toLocaleString()}
        </p>
        <div className={cn(
          "text-sm mt-1",
          isPositive ? "text-crypto-green" : "text-crypto-red"
        )}>
          {isPositive ? "+" : ""}{data.change.toLocaleString()} ({isPositive ? "+" : ""}{data.changePercent}%)
        </div>
      </div>
    );
  }

  return null;
};

const PnLChart = ({ data, className }: PnLChartProps) => {
  const isPositiveTrend = data[data.length - 1].value > data[0].value;
  const gradientColor = isPositiveTrend ? "#10B981" : "#F43F5E";
  const strokeColor = isPositiveTrend ? "#10B981" : "#F43F5E";
  
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  };
  
  const formatXAxis = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn("glass-card p-4 h-[300px]", className)}>
      <h3 className="text-lg font-medium mb-2">Portfolio Value</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickLine={false}
            axisLine={false}
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PnLChart;
