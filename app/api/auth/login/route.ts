import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { apiError, apiSuccess, handleZodError } from "@/lib/api-utils";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return handleZodError(parsed.error);
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiError("邮箱或密码错误", 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return apiError("邮箱或密码错误", 401);
    }

    // Sign JWT
    const token = await signToken({ userId: user.id, email: user.email });

    // Set cookie
    await setAuthCookie(token);

    return apiSuccess({
      message: "登录成功",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    return apiError("登录失败，请稍后重试", 500);
  }
}
