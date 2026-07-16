import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, apiSuccess, handleZodError } from "@/lib/api-utils";

const updateUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空").max(20, "姓名最多20个字符").optional(),
  email: z.string().email("邮箱格式不正确").optional(),
  password: z.string().min(6, "密码至少6位").max(50, "密码最多50位").optional(),
});

// PUT /api/admin/users/[id] — 修改用户 / 重置密码 / 切换管理员
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return apiError("无效的用户 ID", 400);

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const { name, email, password } = parsed.data;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) return apiError("用户不存在", 404);

    // 检查 name 唯一性
    if (name && name !== existingUser.name) {
      const nameTaken = await prisma.user.findUnique({ where: { name } });
      if (nameTaken) return apiError("该昵称已被使用", 409);
    }

    // 检查 email 唯一性
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) return apiError("该邮箱已被注册", 409);
    }

    // 构建更新数据
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 12);

    if (Object.keys(data).length === 0) {
      return apiError("没有需要更新的字段", 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
    });

    return apiSuccess({ message: "用户已更新", user: updated });
  } catch {
    return apiError("更新用户失败", 500);
  }
}

// DELETE /api/admin/users/[id] — 删除用户及其所有数据
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return apiError("无效的用户 ID", 400);

    // 不能删除自己
    if (userId === adminUser.id) {
      return apiError("不能删除自己的账号", 400);
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return apiError("用户不存在", 404);

    // 级联删除：PlanItem → DayPlan → User
    // 利用已有的 onDelete: Cascade 关系，先手动清理 PlanItem 再删 DayPlan 最后删 User
    // 实际上 SQLite 外键开启后会自动级联，但为了清晰，我们分步操作
    const dayPlanIds = await prisma.dayPlan.findMany({
      where: { userId },
      select: { id: true },
    });

    // 删除所有 PlanItem
    for (const plan of dayPlanIds) {
      await prisma.planItem.deleteMany({ where: { dayPlanId: plan.id } });
    }

    // 删除所有 DayPlan
    await prisma.dayPlan.deleteMany({ where: { userId } });

    // 删除用户
    await prisma.user.delete({ where: { id: userId } });

    return apiSuccess({ message: `用户 "${targetUser.name}" 及其所有数据已删除` });
  } catch {
    return apiError("删除用户失败", 500);
  }
}
