import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleZodError } from "@/lib/api-utils";

const registerSchema = z.object({
  name: z.string().min(1, "姓名不能为空").max(20, "姓名最多20个字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位").max(50, "密码最多50位"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError("该邮箱已被注册", 409);
    }

    // Check if name already exists
    const existingName = await prisma.user.findUnique({ where: { name } });
    if (existingName) {
      return apiError("该昵称已被使用", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return apiSuccess({ message: "注册成功", user }, 201);
  } catch {
    return apiError("注册失败，请稍后重试", 500);
  }
}
