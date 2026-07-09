import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const secure = request.headers.get("x-forwarded-proto") === "https";
  await clearAuthCookie(secure);
  return apiSuccess({ message: "已退出登录" });
}
