import { getCurrentUser } from "./auth";
import { apiError } from "./api-utils";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}

/**
 * 校验当前用户是否是管理员
 * 如果不是，返回错误响应
 * 如果是，返回用户对象
 */
export async function requireAdmin(): Promise<
  { user: AdminUser; errorResponse: null } | { user: null; errorResponse: ReturnType<typeof apiError> }
> {
  const user = await getCurrentUser();
  if (!user) return { user: null, errorResponse: apiError("请先登录", 401) };

  if (!user.isAdmin) {
    return { user: null, errorResponse: apiError("无权访问，需要管理员权限", 403) };
  }

  return { user: user as AdminUser, errorResponse: null };
}
