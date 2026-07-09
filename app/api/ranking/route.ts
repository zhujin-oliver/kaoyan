import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-utils";

interface UserRanking {
  id: number;
  name: string;
  totalDays: number;
  streakDays: number;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("请先登录", 401);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        plans: {
          select: { date: true },
          orderBy: { date: "desc" },
        },
      },
    });

    const rankings: UserRanking[] = users.map((user) => {
      const planDates = new Set(user.plans.map((p) => p.date));
      const totalDays = planDates.size;

      // Compute continuous streak from today
      let streakDays = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        if (planDates.has(dateStr)) {
          streakDays++;
        } else {
          // Allow skipping today or yesterday (not yet checked in)
          if (i <= 1) continue;
          break;
        }
      }

      return {
        id: user.id,
        name: user.name,
        totalDays,
        streakDays,
      };
    });

    // Sort by streak descending, then total days descending
    rankings.sort((a, b) =>
      b.streakDays - a.streakDays || b.totalDays - a.totalDays
    );

    return apiSuccess(rankings);
  } catch {
    return apiError("获取排行榜失败", 500);
  }
}
