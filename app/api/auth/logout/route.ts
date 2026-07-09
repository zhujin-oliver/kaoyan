import { clearAuthCookie } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-utils";

export async function POST() {
  await clearAuthCookie();
  return apiSuccess({ message: "已退出登录" });
}
