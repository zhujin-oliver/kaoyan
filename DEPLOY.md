# 腾讯云轻量服务器部署指南（考研打卡）

这份指南将带你把整个项目部署到腾讯云轻量应用服务器，让同学可以通过公网 IP 直接访问。

---

## 一、购买服务器

1. 打开 [腾讯云控制台](https://console.cloud.tencent.com/)，搜索「轻量应用服务器」
2. 点击「新建」，选择以下配置：
   - **地域**：上海 / 北京 / 广州（选离你同学最近的）
   - **镜像**：**Ubuntu 22.04 LTS**（64位）
   - **套餐**：2核2G4M
   - **时长**：1年
3. 点击购买，等待服务器创建完成（约1-2分钟）
4. 创建完成后，进入服务器控制台，找到：
   - **公网 IP**（例如 `123.123.123.123`）
   - 点击「重置密码」，设置 root 密码

---

## 二、连接服务器

### Windows 用户
打开 PowerShell 或 CMD，输入：
```bash
ssh ubuntu@你的公网IP
```
例如：`ssh ubuntu@123.123.123.123`

输入你重装系统时设置的密码。

### Mac/Linux 用户
打开终端，同样的命令：
```bash
ssh ubuntu@你的公网IP
```

---

## 三、安装环境

连接成功后，依次执行下面的命令（直接复制粘贴）。

### 1. 更新系统包
```bash
apt update && apt upgrade -y
```

### 2. 安装 Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

验证安装：
```bash
node -v   # 应显示 v20.x.x
npm -v    # 应显示 10.x.x
```

### 3. 安装 Git
```bash
apt install -y git
```

### 4. 安装 PM2（进程守护）
```bash
npm install -g pm2
```

### 5. 安装 Nginx（反向代理）
```bash
apt install -y nginx
```

---

## 四、部署项目代码

### 1. 把代码传到 GitHub（如果你还没做）

在你的本地项目目录（Windows PowerShell / VS Code 终端）：
```bash
git add .
git commit -m "准备部署"
# 如果你还没有远程仓库，先在 GitHub 新建一个空仓库，然后：
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 2. 在服务器上拉取代码

```bash
cd /var/www
git clone https://github.com/你的用户名/仓库名.git kaoyan
cd kaoyan
```

### 3. 安装依赖

```bash
npm install
```

### 4. 初始化数据库

```bash
npx prisma migrate deploy
```

这会根据 `prisma/schema.prisma` 自动创建 SQLite 数据库文件。

### 5. 构建项目

```bash
npm run build
```

构建成功后会显示 `□ Collecting page data ...` 等输出，最终提示成功。

---

## 五、启动项目

### 1. 用 PM2 启动

```bash
pm2 start npm --name "kaoyan" -- run start
```

### 2. 查看运行状态

```bash
pm2 status
pm2 logs kaoyan
```

看到 `ready on http://localhost:3000` 就表示启动成功了。

### 3. 设置开机自启

```bash
pm2 startup
pm2 save
```

---

## 六、配置防火墙（关键步骤）

### 1. 腾讯云控制台配置（安全组/防火墙）

1. 回到 [腾讯云轻量服务器控制台](https://console.cloud.tencent.com/lighthouse/instance)
2. 找到你的服务器，点击「防火墙」或「安全组」
3. 点击「添加规则」：
   - **协议**：TCP
   - **端口**：`80`（HTTP）、`443`（HTTPS，可选）、`3000`（如果你不想用 Nginx，直接暴露3000端口）
   - **来源**：`0.0.0.0/0`（允许所有IP）
   - **策略**：允许

### 2. 服务器本地防火墙（ufw）

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp    # SSH，保持开启
ufw enable
```

---

## 七、配置 Nginx 反向代理（推荐）

这样同学可以直接用 `http://你的IP` 访问，不用加 `:3000` 端口号。

### 1. 创建 Nginx 配置文件

```bash
nano /etc/nginx/sites-available/kaoyan
```

粘贴以下内容（把 `你的公网IP` 替换成实际IP，例如 `123.123.123.123`）：

```nginx
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
```

按 `Ctrl+O` 保存，`Ctrl+X` 退出。

### 2. 启用配置

```bash
ln -s /etc/nginx/sites-available/kaoyan /etc/nginx/sites-enabled/
nginx -t          # 检查配置是否正确
systemctl restart nginx
```

### 3. 验证

在浏览器访问：`http://你的公网IP`

应该能看到你的考研打卡网站首页了！

---

## 八、后续维护常用命令

### 更新代码（本地修改后推送到 GitHub，服务器拉取更新）
```bash
cd /var/www/kaoyan
git pull origin main
npm install          # 如果有新依赖
npm run build        # 重新构建
pm2 restart kaoyan   # 重启服务
```

### 查看日志
```bash
pm2 logs kaoyan
pm2 logs kaoyan --lines 100   # 最近100行
```

### 重启/停止/删除服务
```bash
pm2 restart kaoyan
pm2 stop kaoyan
pm2 delete kaoyan
```

### 服务器资源监控
```bash
pm2 monit            # PM2 监控面板
htop                 # 系统资源（需安装：apt install htop）
```

---

## 九、进阶：绑定域名（可选）

如果你想让同学用域名访问（如 `kaoyan.xxx.com`），需要：

1. **购买域名**：阿里云/腾讯云/GoDaddy 等，`.cn` 域名约 30 元/年
2. **域名解析**：在域名控制台添加 A 记录，指向你的服务器公网 IP
3. **ICP 备案**：域名 + 国内服务器必须备案（腾讯云有免费备案服务，约7-20天）
4. **HTTPS 证书**（可选）：用 Certbot 免费申请 Let's Encrypt 证书

> 💡 **提示**：如果你只是同班同学使用，直接用 IP 访问最快，不需要备案和域名。

---

## 十、常见问题

### Q1: 访问 IP 显示「无法访问此网站」
- 检查 PM2 是否在运行：`pm2 status`
- 检查 Nginx 是否运行：`systemctl status nginx`
- 检查腾讯云防火墙是否放行了 80 端口
- 检查 `npm run build` 是否成功（是否有报错）

### Q2: `npm run build` 失败
- 检查 Node.js 版本是否 ≥ 18：`node -v`
- 检查是否有足够的内存（2G 内存足够，但构建时可能紧张）
- 可以尝试增加 swap 空间：
  ```bash
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  ```

### Q3: 如何修改 JWT 密钥？
在服务器上：
```bash
cd /var/www/kaoyan
nano .env
```
添加：
```env
JWT_SECRET=你的随机密钥字符串
```
然后重启：
```bash
pm2 restart kaoyan
```

### Q4: 数据库文件在哪里？
```bash
ls /var/www/kaoyan/dev.db
```
这是 SQLite 数据库文件，**建议定期备份**：
```bash
cp /var/www/kaoyan/dev.db /var/www/kaoyan/dev.db.backup.$(date +%F)
```

---

## 部署完成后

把 `http://你的公网IP` 发到同学群里，大家就可以一起打卡了！🎉
