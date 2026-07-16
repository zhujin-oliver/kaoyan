/**
 * 设置/取消管理员（在服务器上运行）
 *
 * 用法：
 *   npx tsx scripts/set-admin.ts <email>        → 设为管理员
 *   npx tsx scripts/set-admin.ts <email> --off   → 取消管理员
 *
 * 示例：
 *   npx tsx scripts/set-admin.ts "admin@example.com"
 */
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("用法: npx tsx scripts/set-admin.ts <邮箱> [--off]");
    console.log('示例: npx tsx scripts/set-admin.ts "admin@example.com"');
    console.log('       npx tsx scripts/set-admin.ts "admin@example.com" --off  (取消管理员)');
    process.exit(1);
  }

  const isAdmin = !process.argv.includes("--off");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`❌ 未找到用户: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { isAdmin },
  });

  console.log(
    isAdmin
      ? `✅ ${email} 已是管理员，访问 /admin 进行管理`
      : `✅ ${email} 已取消管理员权限`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("错误:", err);
  process.exit(1);
});
