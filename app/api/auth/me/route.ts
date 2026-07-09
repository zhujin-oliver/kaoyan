import { getCurrentUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("未登录", 401);
  return apiSuccess(user);
}
