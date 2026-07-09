import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiError, apiSuccess, handleZodError } from "@/lib/api-utils";

const planItemSchema = z.object({
  content: z.string().min(1, "计划项不能为空"),
  completed: z.boolean().default(false),
});

const planSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
  items: z.array(planItemSchema).min(1, "至少添加一条计划"),
  note: z.string().optional(),
});

// GET /api/plans — 获取当前用户的所有计划（可选 ?date= 查询某天）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("请先登录", 401);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const where: { userId: number; date?: string } = { userId: user.id };
    if (date) where.date = date;

    const plans = await prisma.dayPlan.findMany({
      where,
      include: {
        items: { orderBy: { order: "asc" } },
      },
      orderBy: { date: "desc" },
    });

    return apiSuccess(plans);
  } catch {
    return apiError("获取计划失败", 500);
  }
}

// PUT /api/plans — 创建或更新某天的计划（禁止修改过去的计划）
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("请先登录", 401);

    const body = await request.json();
    const parsed = planSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const { date, items, note } = parsed.data;

    // 禁止修改过去的计划
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return apiError("过去的计划不能修改", 403);
    }

    // Delete existing items and recreate
    const existing = await prisma.dayPlan.findUnique({
      where: {
        userId_date: { userId: user.id, date },
      },
    });

    if (existing) {
      await prisma.planItem.deleteMany({ where: { dayPlanId: existing.id } });
    }

    // 自动计算完成度
    const completedCount = items.filter((i) => i.completed).length;
    const completion = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    const result = await prisma.dayPlan.upsert({
      where: {
        userId_date: { userId: user.id, date },
      },
      update: {
        note: note ?? null,
        items: {
          create: items.map((item, idx) => ({
            content: item.content,
            completed: item.completed,
            order: idx,
          })),
        },
      },
      create: {
        userId: user.id,
        date,
        note: note ?? null,
        items: {
          create: items.map((item, idx) => ({
            content: item.content,
            completed: item.completed,
            order: idx,
          })),
        },
      },
      include: {
        items: { orderBy: { order: "asc" } },
      },
    });

    return apiSuccess({ ...result, completion });
  } catch {
    return apiError("保存计划失败", 500);
  }
}
