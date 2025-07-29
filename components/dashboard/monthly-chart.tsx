"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { TooltipProps } from "recharts";


interface MonthlyChartProps {
  data: Array<{
    month: string;
    type: string;
    total: number;
  }>;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  // Transform data for the chart
  const chartData = data.reduce((acc: any[], item) => {
    const monthStr = format(new Date(item.month), "MMM yyyy");
    const existingMonth = acc.find((m) => m.month === monthStr);

    if (existingMonth) {
      existingMonth[item.type] = item.total;
    } else {
      acc.push({
        month: monthStr,
        [item.type]: item.total,
      });
    }

    return acc;
  }, []);
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-md border bg-white dark:bg-zinc-900 dark:border-zinc-700 px-3 py-2 shadow-sm">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: ${entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
