import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, apiSuccess, handleZodError } from "@/lib/api-utils";

const mergeSchema = z.object({
  sourceUserId: z.number().int().positive(),
  targetUserId: z.number().int().positive(),
});

// POST /api/admin/users/merge — 合并两个用户
// 将 sourceUser 的所有 DayPlan 转移给 targetUser
// 如果 targetUser 在同一天已有计划，则追加 PlanItem
export async function POST(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const parsed = mergeSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { sourceUserId, targetUserId } = parsed.data;

    if (sourceUserId === targetUserId) {
      return apiError("不能将用户合并到自己", 400);
    }

    // 验证两个用户都存在
    const [sourceUser, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sourceUserId },
        select: { id: true, name: true },
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true },
      }),
    ]);

    if (!sourceUser) return apiError("源用户不存在", 404);
    if (!targetUser) return apiError("目标用户不存在", 404);

    // 获取 source 的所有 DayPlan
    const sourcePlans = await prisma.dayPlan.findMany({
      where: { userId: sourceUserId },
      include: { items: { orderBy: { order: "asc" } } },
    });

    let mergedItemsCount = 0;
    let transferredPlansCount = 0;

    for (const sourcePlan of sourcePlans) {
      // 检查 target 在同一天是否已有计划
      const targetPlan = await prisma.dayPlan.findUnique({
        where: {
          userId_date: { userId: targetUserId, date: sourcePlan.date },
        },
        include: { items: true },
      });

      if (targetPlan) {
        // target 在同一天已有计划 → 追加 PlanItem
        // 获取当前最大 order
        const maxOrder = targetPlan.items.reduce(
          (max, item) => Math.max(max, item.order),
          0
        );

        // 将 sourcePlan 的 PlanItem 追加到 targetPlan
        for (let i = 0; i < sourcePlan.items.length; i++) {
          await prisma.planItem.create({
            data: {
              content: sourcePlan.items[i].content,
              completed: sourcePlan.items[i].completed,
              order: maxOrder + i + 1,
              dayPlanId: targetPlan.id,
            },
          });
        }
        mergedItemsCount += sourcePlan.items.length;

        // 如果 sourcePlan 有 note 而 targetPlan 没有，复制 note
        if (sourcePlan.note && !targetPlan.note) {
          await prisma.dayPlan.update({
            where: { id: targetPlan.id },
            data: { note: sourcePlan.note },
          });
        }

        // 删除 sourcePlan（其 PlanItem 会被 cascade 删除）
        await prisma.dayPlan.delete({ where: { id: sourcePlan.id } });
      } else {
        // target 同一天没有计划 → 直接转移
        await prisma.dayPlan.update({
          where: { id: sourcePlan.id },
          data: { userId: targetUserId },
        });
        transferredPlansCount++;
      }
    }

    // 删除 sourceUser
    await prisma.user.delete({ where: { id: sourceUserId } });

    return apiSuccess({
      message: `已将 "${sourceUser.name}" 合并到 "${targetUser.name}"`,
      detail: {
        transferredPlans: transferredPlansCount,
        mergedItems: mergedItemsCount,
      },
    });
  } catch {
    return apiError("合并用户失败", 500);
  }
}
