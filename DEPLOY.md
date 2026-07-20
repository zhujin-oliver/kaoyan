# 腾讯云轻量服务器部署指南（考研打卡）

这份指南记录了整个项目**实际部署到腾讯云**的完整流程，包括踩过的坑和解决方案。

> **环境说明**
> - 服务器：腾讯云轻量应用服务器，2核2G4M
> - 系统：Ubuntu 22.04 LTS（**必须选这个，不要选 Windows 镜像**）
> - 项目：Next.js 16 + React 19 + Prisma + SQLite
> - 部署方式：GitHub + PM2 + Nginx 反向代理

---

## 零、本地测试

在部署到服务器之前，先在本地跑起来看看效果：

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. 初始化数据库（SQLite，自动创建 dev.db）
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

启动后访问 http://localhost:3000

---

## 一、购买并初始化服务器

1. 打开 [腾讯云控制台](https://console.cloud.tencent.com/)，搜索「轻量应用服务器」
2. 点击「新建」，选择：
   - **地域**：上海 / 北京 / 广州（选离你同学最近的）
   - **镜像**：**Ubuntu 22.04 LTS**（64位）⚠️ **不要选 Windows 镜像**
   - **套餐**：2核2G4M（新用户首单约 50-100 元/年）
   - **时长**：1年
3. 购买完成后，进入控制台：
   - 记录 **公网 IP**（如 `101.33.247.111`）
   - 点击「重置密码」，设置一个强密码

---

## 二、连接服务器

> ⚠️ **注意**：腾讯云 Ubuntu 镜像的默认用户名是 `ubuntu`，不是 `root`。

```bash
# Windows 用户打开 PowerShell，Mac/Linux 打开终端
ssh ubuntu@你的公网IP
# 例如：ssh ubuntu@101.33.247.111

# 输入你重置密码时设置的密码（输入时不显示，直接回车）
```

**如果连接超时：**
1. 进入 [腾讯云轻量服务器控制台](https://console.cloud.tencent.com/lighthouse/instance)
2. 找到你的服务器 → 「防火墙」
3. 添加规则：**TCP 端口 22**，来源 `0.0.0.0/0`，策略允许
4. 等待 1-2 分钟后重试

---

## 三、安装环境（含踩坑记录）

连接成功后，**先切换到 root 权限**（方便后续操作）：

```bash
sudo -i
```

### 1. 更新系统

```bash
apt update && apt upgrade -y
```

**常见问题：apt 锁被占用**

如果提示 `Waiting for cache lock: Could not get lock /var/lib/dpkg/lock-frontend`，说明后台有 apt 进程在跑：

```bash
# 找到占用进程并结束它
kill 进程ID
rm -f /var/lib/dpkg/lock-frontend
rm -f /var/lib/apt/lists/lock
rm -f /var/cache/apt/archives/lock
dpkg --configure -a
apt update
```

### 2. 安装 Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
```

验证：
```bash
node -v   # v20.x.x
npm -v    # 10.x.x
```

### 3. 安装 Git、Nginx

```bash
apt install -y git nginx
```

**常见问题：debconf 锁导致 nginx 安装失败**

如果安装 nginx 时报错 `debconf: DbDriver "config": /var/cache/debconf/config.dat is locked`：

```bash
fuser -k /var/cache/debconf/config.dat 2>/dev/null
rm -f /var/cache/debconf/config.dat.lock
dpkg --configure -a
apt install -f -y
apt install -y nginx
```

### 4. 安装 PM2

```bash
npm install -g pm2
```

---

## 四、把代码推到 GitHub

**在本地电脑（Windows）上操作：**

```bash
cd D:\aazhj\aaa\kaoyan

# 确认 .gitignore 排除了 dev.db 和 .env
git add .
git commit -m "deploy: init"

# 如果没有远程仓库，先在 GitHub 新建一个空仓库（不要勾选 README）
# 然后绑定并推送
git remote add origin https://github.com/你的用户名/kaoyan.git
git branch -M master
git push -u origin master
```

> **注意**：GitHub 从 2021 年起不再支持密码登录，推送时会要求输入 **Personal Access Token**（PAT）。
> - 生成地址：[https://github.com/settings/tokens](https://github.com/settings/tokens)
> - 勾选 `repo` 权限，复制生成的 `ghp_xxxx...` 作为密码粘贴

---

## 五、在服务器上部署代码

```bash
cd /var/www
git clone https://github.com/你的用户名/kaoyan.git kaoyan
cd kaoyan
```

**常见问题：国内服务器访问 GitHub 不稳定**

如果 `git clone` 或 `git pull` 报 `GnuTLS recv error`：

```bash
git config --global http.version HTTP/1.1
# 然后重试 git clone / git pull
```

---

## 六、安装依赖并配置数据库

```bash
npm install
```

### 1. 创建 .env 文件

```bash
echo 'DATABASE_URL="file:./dev.db"' > .env
```

> **重要**：`.env` 文件在 `.gitignore` 中，不会从 GitHub 拉下来，必须在服务器上手动创建。

### 2. 初始化数据库迁移

```bash
npx prisma migrate dev --name init
```

> 第一次部署时**没有迁移文件**，所以用 `migrate dev` 创建并应用。后续更新可以用 `migrate deploy`。

### 3. 生成 Prisma Client

```bash
npx prisma generate
```

> **必须执行**，否则构建时会报错 `Module not found: Can't resolve '@/app/generated/prisma/client'`。

---

## 七、构建项目

```bash
npm run build
```

**常见问题：构建失败**

如果构建报错，先清理缓存再重新构建：

```bash
rm -rf .next
npm run build
```

构建成功后会显示类似输出：
```
✓ Compiled successfully in 5.6s
✓ Finished TypeScript in 4.2s
✓ Collecting page data ...
✓ Generating static pages ...
```

---

## 八、启动并守护进程

```bash
# 启动
pm2 start npm --name "kaoyan" -- run start

# 查看日志（确认启动成功）
pm2 logs kaoyan --lines 20
```

看到 `ready on http://localhost:3000` 表示启动成功。

**设置开机自启：**
```bash
pm2 startup
pm2 save
```

---

## 九、配置 Nginx 反向代理

这样同学可以直接用 `http://你的IP` 访问，不需要加端口号。

```bash
# 创建配置文件
cat > /etc/nginx/sites-available/kaoyan << 'EOF'
server {
    listen 80;
    server_name 你的公网IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/kaoyan /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

> 把 `你的公网IP` 替换成实际 IP，如 `101.33.247.111`。

---

## 十、配置防火墙（关键步骤，最容易遗漏）

### 1. 腾讯云控制台防火墙

1. 打开 [腾讯云轻量服务器控制台](https://console.cloud.tencent.com/lighthouse/instance)
2. 找到你的服务器 → 「防火墙」
3. 添加以下规则：

| 协议 | 端口 | 来源 | 策略 |
|------|------|------|------|
| TCP | 80 | `0.0.0.0/0` | 允许 |
| TCP | 22 | `0.0.0.0/0` | 允许 |

### 2. 服务器本地防火墙

```bash
ufw allow 80/tcp
ufw allow 22/tcp
ufw enable
```

---

## 十一、验证部署

在浏览器打开：`http://你的公网IP`

应该能看到考研打卡网站首页。

---

## 十二、后续更新代码

**本地修改后：**

```bash
cd D:\aazhj\aaa\kaoyan
git add .
git commit -m "update: xxx"
git push origin master
```

**服务器上拉取更新：**

```bash
cd /var/www/kaoyan

# 如果提示 "detected dubious ownership"，先执行下面这行（因为可能用不同用户 clone 的）：
git config --global --add safe.directory /var/www/kaoyan

git pull origin master

# 如果有新依赖
npm install

# 如果有数据库迁移变更
npx prisma migrate deploy

# 重新生成 Prisma Client（如果 schema 有变）
npx prisma generate

# 清理缓存并重新构建
rm -rf .next
npm run build

# 彻底重启（确保加载新代码）
pm2 delete kaoyan
pm2 start npm --name "kaoyan" -- run start
```

---

## 十三、常见问题与排查

### Q1: 访问 IP 显示「无法访问此网站」
- `pm2 status` — 检查 Node 服务是否运行
- `systemctl status nginx` — 检查 Nginx 是否运行
- 检查腾讯云控制台防火墙是否放行了 80 端口
- `ufw status` — 检查服务器本地防火墙

### Q2: 构建时内存不足（2G 服务器可能遇到）
```bash
# 增加 swap 空间
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### Q3: 登录成功但页面不跳转 / 登录后仍然未登录

**已修复（v0.1.1）**：如果已拉取最新代码，此问题不会再出现。

**原因**：在 HTTP 环境下，`Secure` cookie 标记会导致浏览器拒绝存储认证 cookie（浏览器只会在 HTTPS 下接受 Secure cookie）。旧代码在 `NODE_ENV=production` 时自动启用 Secure 标记，但服务器通过 HTTP 访问（没有配置 HTTPS 证书），导致 cookie 被浏览器丢弃，登录状态无法保持。

**修复方式**：`lib/auth.ts` 改为根据请求的实际协议（`x-forwarded-proto` 头）动态判断是否启用 Secure 标记，而不是简单检查 `NODE_ENV`。HTTP 访问时不再设置 Secure 标记。

**临时排查（旧版本）**：
- 打开浏览器开发者工具 → Console 查看是否有报错
- Application → Cookies 查看 `kaoyan-token` 是否存在
- 如果 cookie 不存在，说明就是此问题，拉取最新代码重新部署即可

### Q4: 如何修改 JWT 密钥？
```bash
cd /var/www/kaoyan
nano .env
# 添加：JWT_SECRET=你的随机密钥字符串
pm2 restart kaoyan
```

### Q5: 数据库文件备份
```bash
# SQLite 数据库文件在 /var/www/kaoyan/dev.db
cp /var/www/kaoyan/dev.db /var/www/kaoyan/dev.db.backup.$(date +%F)
```

### Q6: 用户忘记密码怎么重置？

```bash
cd /var/www/kaoyan
npx tsx scripts/reset-password.ts "用户邮箱" "新密码"
# 示例：npx tsx scripts/reset-password.ts "zhangsan@example.com" "abc123456"
```

然后把新密码发给用户，让他登录后自行修改密码。

### Q7: 服务器常用运维命令
```bash
# 查看实时日志
pm2 logs kaoyan --lines 100

# 查看 PM2 监控面板
pm2 monit

# 查看系统资源
apt install -y htop
htop

# 查看 Nginx 访问日志
tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

---

## 部署完成后

把 `http://你的公网IP` 发到同学群里，大家就可以一起打卡了！🎉
