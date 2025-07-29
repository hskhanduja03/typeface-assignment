"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { motion } from "framer-motion";

interface AnalyticsData {
  expensesByCategory: Array<{
    categoryName: string;
    amount: number;
    color: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    type: string;
    total: number;
  }>;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
  };
}

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    expensesByCategory: [],
    monthlyTrends: [],
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      transactionCount: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch("/api/analytics?userId=demo-user");
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
   const total = analyticsData.summary.totalExpenses;
   const pieData = analyticsData.expensesByCategory.map((item) => ({
     ...item,
     percentage: (item.amount / total) * 100,
   }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your financial activity
        </p>
      </motion.div>

      <StatsCards
        totalIncome={analyticsData.summary.totalIncome}
        totalExpenses={analyticsData.summary.totalExpenses}
        netIncome={analyticsData.summary.netIncome}
        transactionCount={analyticsData.summary.transactionCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ExpenseChart data={pieData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MonthlyChart data={analyticsData.monthlyTrends} />
        </motion.div>
      </div>
    </div>
  );
}
