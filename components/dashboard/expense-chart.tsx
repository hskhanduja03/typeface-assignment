"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ExpenseChartProps {
  data: Array<{
    categoryName: string;
    amount: number;
    color: string;
    percentage: number;
  }>;
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
      </text>
    );
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Expenses by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                labelLine={false}
                label={renderCustomizedLabel}
                dataKey="amount"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{
                      filter: "drop-shadow(0 0 2px rgba(0,0,0,0.1))",
                      transition: "all 0.3s ease-in-out",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  border: "none",
                  borderRadius: "8px",
                  color: "#000",
                  fontSize: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                formatter={(value: number) => [
                  `₹${value.toFixed(2)}`,
                  "Amount",
                ]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
                payload={data.map((entry) => ({
                  value: entry.categoryName,
                  type: "circle",
                  color: entry.color,
                }))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Details section */}
        <div className="max-h-[180px] overflow-y-auto space-y-3 pr-2">
          {data.map((item) => (
            <div
              key={item.categoryName}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate max-w-[140px]">
                  {item.categoryName}
                </span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-700 dark:text-gray-200">
                  ₹{item.amount.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
