import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, apiSuccess, handleZodError } from "@/lib/api-utils";

const createUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空").max(20, "姓名最多20个字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位").max(50, "密码最多50位"),
});

// GET /api/admin/users — 列出所有用户（含打卡统计）
export async function GET() {
  try {
    const { user: _, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        plans: {
          select: { date: true },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = users.map((user) => {
      const planDates = new Set(user.plans.map((p) => p.date));
      const totalDays = planDates.size;

      // 计算连续打卡天数
      let streakDays = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        if (planDates.has(dateStr)) {
          streakDays++;
        } else {
          if (i <= 1) continue; // 允许今天或昨天还没打卡
          break;
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        totalDays,
        streakDays,
        planCount: user.plans.length,
      };
    });

    return apiSuccess(result);
  } catch {
    return apiError("获取用户列表失败", 500);
  }
}

// POST /api/admin/users — 管理员新增用户
export async function POST(request: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { name, email, password } = parsed.data;

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return apiError("该邮箱已被注册", 409);

    const existingName = await prisma.user.findUnique({ where: { name } });
    if (existingName) return apiError("该昵称已被使用", 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
    });

    return apiSuccess({ message: "用户创建成功", user }, 201);
  } catch {
    return apiError("创建用户失败", 500);
  }
}
