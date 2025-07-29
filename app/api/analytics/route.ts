import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Expenses by category
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...where, type: 'expense' },
      _sum: { amount: true },
      _count: true,
    });

    const categoriesData = await Promise.all(
      expensesByCategory.map(async (item) => {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
        });
        return {
          categoryId: item.categoryId,
          categoryName: category?.name || 'Unknown',
          color: category?.color || '#6366f1',
          amount: item._sum.amount || 0,
          count: item._count,
        };
      })
    );

    // Monthly trends
    const monthlyData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', date) as month,
        type,
        SUM(amount) as total
      FROM transactions 
      WHERE "userId" = ${userId}
      AND date >= COALESCE(${startDate}::timestamp, NOW() - INTERVAL '12 months')
      AND date <= COALESCE(${endDate}::timestamp, NOW())
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY month DESC
    `;

    // Summary stats
    const summary = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const totalIncome = summary.find(s => s.type === 'income')?._sum.amount || 0;
    const totalExpenses = summary.find(s => s.type === 'expense')?._sum.amount || 0;

    return NextResponse.json({
      expensesByCategory: categoriesData,
      monthlyTrends: monthlyData,
      summary: {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactionCount: summary.reduce((acc, s) => acc + s._count, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}