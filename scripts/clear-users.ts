/**
 * 清空所有用户和计划数据（管理员在服务器上运行）
 *
 * 用法：
 *   npx tsx scripts/clear-users.ts
 *
 * ⚠️ 此操作不可逆！建议先备份数据库：
 *   cp /var/www/kaoyan/dev.db /var/www/kaoyan/dev.db.backup.$(date +%F)
 */
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete plan items → day plans → users (respect FK constraints)
  const itemsDeleted = await prisma.planItem.deleteMany();
  console.log(`已删除 ${itemsDeleted.count} 条计划项`);

  const plansDeleted = await prisma.dayPlan.deleteMany();
  console.log(`已删除 ${plansDeleted.count} 条计划`);

  const usersDeleted = await prisma.user.deleteMany();
  console.log(`已删除 ${usersDeleted.count} 个用户`);

  console.log("\n✅ 全部用户和计划数据已清空");
  console.log("   现在打开网站，所有同学可以重新注册");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("错误:", err);
  process.exit(1);
});
