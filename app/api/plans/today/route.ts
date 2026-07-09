import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-utils";

// GET /api/plans/today — 获取今天所有人的公开计划
export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const plans = await prisma.dayPlan.findMany({
      where: { date: today },
      include: {
        user: { select: { id: true, name: true } },
        items: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({
      date: today,
      count: plans.length,
      plans: plans.map((p) => {
        const completedCount = p.items.filter((i) => i.completed).length;
        const completion =
          p.items.length > 0 ? Math.round((completedCount / p.items.length) * 100) : 0;
        return {
          id: p.id,
          userId: p.userId,
          userName: p.user.name,
          items: p.items.map((i) => ({
            content: i.content,
            completed: i.completed,
          })),
          completion,
          note: p.note,
        };
      }),
    });
  } catch {
    return apiError("获取今日计划失败", 500);
  }
}
