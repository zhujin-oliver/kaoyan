import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("请先登录", 401);

    const plans = await prisma.dayPlan.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { date: "asc" },
    });

    if (plans.length === 0) {
      return apiSuccess({
        totalDays: 0,
        avgCompletion: 0,
        streakDays: 0,
        completionDistribution: [
          { label: "0-25%", count: 0 },
          { label: "26-50%", count: 0 },
          { label: "51-75%", count: 0 },
          { label: "76-100%", count: 0 },
        ],
        recentTrend: [],
        avgItemCount: 0,
      });
    }

    // 计算每条计划的完成度
    const plansWithCompletion = plans.map((p) => {
      const completedCount = p.items.filter((i) => i.completed).length;
      const completion = p.items.length > 0 ? Math.round((completedCount / p.items.length) * 100) : 0;
      return { ...p, completion, itemCount: p.items.length };
    });

    const totalDays = plansWithCompletion.length;
    const avgCompletion = Math.round(
      plansWithCompletion.reduce((sum, p) => sum + p.completion, 0) / totalDays
    );
    const avgItemCount = Math.round(
      plansWithCompletion.reduce((sum, p) => sum + p.itemCount, 0) / totalDays
    );

    // Completion distribution
    const distribution = [
      { label: "0-25%", min: 0, max: 25, count: 0 },
      { label: "26-50%", min: 26, max: 50, count: 0 },
      { label: "51-75%", min: 51, max: 75, count: 0 },
      { label: "76-100%", min: 76, max: 100, count: 0 },
    ];
    for (const p of plansWithCompletion) {
      for (const d of distribution) {
        if (p.completion >= d.min && p.completion <= d.max) {
          d.count++;
          break;
        }
      }
    }

    // Streak days
    const planDates = new Set(plans.map((p) => p.date));
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (planDates.has(dateStr)) {
        streakDays++;
      } else {
        if (i <= 1) continue;
        break;
      }
    }

    // Recent 30-day trend
    const last30Days: { date: string; completion: number; itemCount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const plan = plansWithCompletion.find((p) => p.date === dateStr);
      last30Days.push({
        date: dateStr,
        completion: plan?.completion ?? 0,
        itemCount: plan?.itemCount ?? 0,
      });
    }

    return apiSuccess({
      totalDays,
      avgCompletion,
      streakDays: Math.max(0, streakDays),
      completionDistribution: distribution.map(({ label, count }) => ({ label, count })),
      recentTrend: last30Days,
      avgItemCount,
    });
  } catch {
    return apiError("获取分析数据失败", 500);
  }
}
