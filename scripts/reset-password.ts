/**
 * 重置用户密码（管理员在服务器上运行）
 *
 * 用法：
 *   npx tsx scripts/reset-password.ts <email> <new-password>
 *
 * 示例：
 *   npx tsx scripts/reset-password.ts "zhangsan@example.com" "abc123"
 */
import bcrypt from "bcryptjs";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log("用法: npx tsx scripts/reset-password.ts <邮箱> <新密码>");
    console.log('示例: npx tsx scripts/reset-password.ts "zhangsan@example.com" "abc123"');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.log("❌ 密码至少需要6位");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`❌ 未找到用户: ${email}`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`✅ 密码已重置: ${email} → ${newPassword}`);
  console.log("   请通知用户登录后尽快修改密码");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("错误:", err);
  process.exit(1);
});
