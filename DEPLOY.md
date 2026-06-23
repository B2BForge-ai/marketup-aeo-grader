# MarketUP AEO Grader — 独立服务器部署手册

本文档说明如何将 **marketup-aeo-grader** 从 Vercel 迁移到自有 Linux 服务器（阿里云 / 腾讯云 / AWS / 自建 VPS 均可）。

---

## 1. 架构概览

```
用户浏览器
    │
    ▼
Nginx（443 / HTTPS）
    │
    ▼
Next.js（Node.js，端口 3000）
    │
    ├── DeepSeek API（AI 初筛 + 深度报告）
    ├── Mailgun（邮箱 OTP + 报告链接邮件）
    ├── MarketUP 主站 API（短信发码）
    └── PostgreSQL（线索、报告、邮箱 OTP）
```

| 组件 | 说明 |
|------|------|
| 运行时 | Node.js **20 LTS** 或 **22 LTS** |
| 框架 | Next.js 16（`next start` 生产模式） |
| 数据库 | PostgreSQL 14+（可继续用 Supabase 云库，也可自建） |
| 进程守护 | PM2 或 systemd（推荐 PM2） |
| 反向代理 | Nginx + Let's Encrypt SSL |

> **与 Vercel 的主要区别**：自有服务器是**长驻单进程**，无 10s/60s 函数超时限制；深度报告 API 最长可跑约 5 分钟。邮箱 OTP 已存 PostgreSQL；手机 OTP 仍用进程内存（单实例部署无问题）。

---

## 2. 服务器最低配置

| 项目 | 建议 |
|------|------|
| CPU | 2 核 |
| 内存 | 2 GB（推荐 4 GB，DeepSeek 并发时更稳） |
| 磁盘 | 20 GB SSD |
| 系统 | Ubuntu 22.04 / 24.04 LTS，或 Debian 12 |
| 网络 | 可访问 DeepSeek、Mailgun、MarketUP 主站 |

---

## 3. 系统依赖安装

以 **Ubuntu 24.04** 为例，SSH 登录后执行：

```bash
# 基础工具
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx

# Node.js 22（via NodeSource）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # 应 >= v20
npm -v
```

---

## 4. 获取代码

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

git clone https://github.com/B2BForge-ai/marketup-aeo-grader.git
cd marketup-aeo-grader
```

若使用私有仓库，配置 SSH Key 或 Personal Access Token 后再 clone。

---

## 5. 数据库

### 方案 A：继续使用 Supabase 云数据库（迁移成本最低）

从 Vercel 切到自有服务器时，**DATABASE_URL 可保持不变**。

- **推荐（Serverless / 短连接）**：Transaction Pooler，端口 **6543**
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
  ```
- **自有服务器长驻进程**：也可使用 **Direct connection**，端口 **5432**（延迟更低，连接数占用更少）

在 Supabase → **SQL Editor** 中确认已执行 `prisma/supabase-init.sql`（含 `AuditRequest` 与 `EmailOtp` 表）。

### 方案 B：自建 PostgreSQL（同机或独立 DB 服务器）

```bash
sudo apt install -y postgresql postgresql-contrib

sudo -u postgres psql <<'SQL'
CREATE USER aeo_grader WITH PASSWORD '请换成强密码';
CREATE DATABASE aeo_grader OWNER aeo_grader;
GRANT ALL PRIVILEGES ON DATABASE aeo_grader TO aeo_grader;
SQL
```

导入表结构（任选其一）：

**方式 1 — 执行 SQL 脚本（推荐）**

```bash
sudo -u postgres psql -d aeo_grader -f /var/www/marketup-aeo-grader/prisma/supabase-init.sql
```

**方式 2 — Prisma 同步 schema**

```bash
cd /var/www/marketup-aeo-grader
export DATABASE_URL="postgresql://aeo_grader:密码@127.0.0.1:5432/aeo_grader"
npx prisma db push
```

连接串示例：

```
DATABASE_URL=postgresql://aeo_grader:你的密码@127.0.0.1:5432/aeo_grader
```

---

## 6. 环境变量

在项目根目录创建生产环境文件（**不要提交到 Git**）：

```bash
cd /var/www/marketup-aeo-grader
cp .env.example .env.production.local
nano .env.production.local
```

### 6.1 完整变量清单

```env
# ========== 必填 ==========

# DeepSeek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
# DEEPSEEK_MODEL=deepseek-chat

# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 站点公网地址（邮件里报告链接、健康检查提示用，必须是 https 域名）
NEXT_PUBLIC_APP_URL=https://aeo.你的域名.com

# 管理端审核 Token（自行生成随机长字符串，勿用默认值）
ADMIN_SECRET_TOKEN=请换成至少32位随机字符串

# ========== 邮件（生产强烈建议配置）==========

MAILGUN_API_KEY=key-xxxxxxxx
MAILGUN_DOMAIN=email.b2bforge.ai
MAILGUN_FROM_EMAIL=MarketUP GEO <noreply@email.b2bforge.ai>
# 美区默认 api.mailgun.net；仅欧区账户才设 eu
# MAILGUN_REGION=eu

# ========== 短信（MarketUP 主站发码）==========

MARKETUP_SMS_SEND=true
MARKETUP_API_BASE_URL=https://www.marketup.cn
MARKETUP_API_REFERER=https://www.marketup.cn/

# ========== 运行时 ==========

NODE_ENV=production
PORT=3000
```

### 6.2 从 Vercel 迁移时

在 Vercel → **Settings → Environment Variables** 中逐项复制到 `.env.production.local`，并修改：

| 变量 | 改动 |
|------|------|
| `NEXT_PUBLIC_APP_URL` | 改为自有域名，如 `https://aeo.marketup.cn` |
| `DATABASE_URL` | 可不变（Supabase）；自建库则换新连接串 |
| `ADMIN_SECRET_TOKEN` | 建议重新生成，旧 token 作废 |

### 6.3 加载方式

Next.js 生产模式会自动读取 `.env.production.local`。也可在 PM2 / systemd 中注入，见下文。

---

## 7. 构建与启动

```bash
cd /var/www/marketup-aeo-grader

npm ci
npm run build
```

构建脚本等价于 `prisma generate && next build`，需保证 `DATABASE_URL` 已可连（至少 schema 同步完成）。

本地试跑（确认无报错后 Ctrl+C 退出）：

```bash
npm start
# 默认监听 http://0.0.0.0:3000
```

---

## 8. PM2 进程守护（推荐）

```bash
sudo npm install -g pm2

cd /var/www/marketup-aeo-grader
```

创建 `ecosystem.config.cjs`（可选，便于管理）：

```javascript
module.exports = {
  apps: [
    {
      name: "aeo-grader",
      cwd: "/var/www/marketup-aeo-grader",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // 若不用 .env.production.local，可在此 env_file 或逐项写入 env
      max_memory_restart: "1G",
      error_file: "/var/log/aeo-grader/err.log",
      out_file: "/var/log/aeo-grader/out.log",
    },
  ],
};
```

```bash
sudo mkdir -p /var/log/aeo-grader
sudo chown $USER:$USER /var/log/aeo-grader

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # 按提示执行 sudo 命令，实现开机自启
```

常用命令：

```bash
pm2 status
pm2 logs aeo-grader
pm2 restart aeo-grader
```

> **注意**：请保持 `instances: 1`。多实例会导致手机验证码（内存存储）在实例间不同步。

---

## 9. Nginx 反向代理 + HTTPS

假设域名为 `aeo.marketup.cn`，先确保 DNS A 记录指向服务器 IP。

```bash
sudo nano /etc/nginx/sites-available/aeo-grader
```

```nginx
server {
    listen 80;
    server_name aeo.marketup.cn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 深度报告 / AI 诊断可能较慢
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/aeo-grader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 申请 SSL 证书（按提示输入邮箱、同意条款）
sudo certbot --nginx -d aeo.marketup.cn
```

Certbot 会自动把 HTTP 重定向到 HTTPS 并配置证书续期。

---

## 10. 防火墙

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

仅开放 22（SSH）、80、443；**不要**对公网暴露 3000 端口。

---

## 11. 部署验证

替换为你的域名和 Admin Token：

```bash
# 健康检查（应返回 status: healthy 或 degraded，不应 unhealthy）
curl -s https://aeo.marketup.cn/api/health | jq .

# 管理端 API（200 = token 正确）
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://aeo.marketup.cn/api/admin/reports?token=你的ADMIN_SECRET_TOKEN"
```

浏览器访问：

| 页面 | URL |
|------|-----|
| 首页诊断 | `https://aeo.marketup.cn` |
| 管理端审核 | `https://aeo.marketup.cn/admin/reports?token=你的ADMIN_SECRET_TOKEN` |
| 健康检查 | `https://aeo.marketup.cn/api/health` |

### 功能自检清单

- [ ] 填写 URL + 手机号 → 初筛打分成功（`/api/grade`）
- [ ] 企业邮箱收 OTP → 验证码通过（`/api/auth/email-otp`）
- [ ] 深度报告生成后出现在管理端待审核列表
- [ ] 管理端核准后客户收到 Mailgun 邮件，报告链接可打开（`/report/[token]`）

项目自带检测脚本（需在服务器上执行）：

```bash
BASE_URL=https://aeo.marketup.cn ADMIN_TOKEN=你的token node scripts/check-availability.mjs
```

---

## 12. 日常更新发布

```bash
cd /var/www/marketup-aeo-grader

git pull origin main
npm ci
npm run build
pm2 restart aeo-grader
```

若 `prisma/schema.prisma` 有变更：

```bash
npx prisma db push    # 或执行新的 SQL 迁移脚本
npm run build
pm2 restart aeo-grader
```

---

## 13. systemd 替代方案（不用 PM2 时）

创建 `/etc/systemd/system/aeo-grader.service`：

```ini
[Unit]
Description=MarketUP AEO Grader
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/marketup-aeo-grader
EnvironmentFile=/var/www/marketup-aeo-grader/.env.production.local
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable aeo-grader
sudo systemctl start aeo-grader
sudo systemctl status aeo-grader
```

---

## 14. Docker 部署（可选）

若偏好容器化，在项目根目录新建 `Dockerfile`：

```dockerfile
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

> 需在 `next.config.ts` 中开启 `output: 'standalone'` 后 Docker 方案才完整可用。当前仓库默认未开启，**推荐先用 PM2 + Nginx 方式**，稳定后再容器化。

---

## 15. 生产安全建议

1. **ADMIN_SECRET_TOKEN**：使用 `openssl rand -hex 32` 生成，勿使用 `dev-admin-123456`。
2. **移除测试万能码**：上线前在代码中关闭 `123456` mock 验码（邮箱/手机），并清理 `lib/usage-limit.ts` 中的测试白名单。
3. **`.env.production.local`**：权限设为 `chmod 600`，仅部署用户可读。
4. **HTTPS 必须**：`NEXT_PUBLIC_APP_URL` 使用 `https://`，否则邮件内报告链接 Mixed Content 或跳转异常。
5. **数据库**：Supabase 控制台限制 IP 或改用强密码；自建库勿对公网开放 5432。
6. **Mailgun Key**：定期轮换；Key 长度约 50 字符，勿含多余空格或换行。
7. **日志**：`pm2 logs` 可能含手机号/邮箱，注意日志留存与合规。

---

## 16. 常见问题

### Q1：`/api/health` 显示 database 失败

- 检查 `DATABASE_URL` 用户名、密码、主机、端口
- Supabase：确认 IP 未被拒（Settings → Database → Network）
- 自建库：`sudo systemctl status postgresql`

### Q2：邮箱验证码「填对仍报错」

- 确认 `EmailOtp` 表已创建（见 `prisma/supabase-init.sql`）
- 多 PM2 实例会导致问题；保持 **单实例**

### Q3：深度报告一直 pending

- 查看 `pm2 logs aeo-grader` 中 DeepSeek 报错
- 确认 `DEEPSEEK_API_KEY` 有效且有余额
- Nginx `proxy_read_timeout` 是否 ≥ 300s

### Q4：Mailgun 发信失败

- 健康检查 `/api/health` 查看 `mailgun.apiReachable`
- 确认 `MAILGUN_DOMAIN` 已在 Mailgun 验证
- **不要**误设 `MAILGUN_REGION=eu`（美区账户）

### Q5：管理端 404

- URL 必须带 `?token=`，且与 `ADMIN_SECRET_TOKEN` **完全一致**
- 示例：`https://aeo.marketup.cn/admin/reports?token=你的token`

### Q6：从 Vercel 切域名后旧链接失效

- 更新 `NEXT_PUBLIC_APP_URL` 后重新 `npm run build` 并重启
- 已发出的邮件内链接仍指向旧域名，需重新核准发信

---

## 17. 环境变量速查表

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API |
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `NEXT_PUBLIC_APP_URL` | ✅ | 公网 HTTPS 地址 |
| `ADMIN_SECRET_TOKEN` | ✅ | 管理端 token |
| `MAILGUN_API_KEY` | 建议 | 邮箱 OTP + 报告邮件 |
| `MAILGUN_DOMAIN` | 建议 | 发信域名 |
| `MAILGUN_FROM_EMAIL` | 建议 | 发件人显示名 |
| `MARKETUP_SMS_SEND` | 建议 | `true` 走真实短信 |
| `MARKETUP_API_BASE_URL` | 可选 | 默认 `https://www.marketup.cn` |
| `MARKETUP_API_REFERER` | 可选 | 默认 `https://www.marketup.cn/` |
| `DEEPSEEK_MODEL` | 可选 | 默认 `deepseek-chat` |
| `PORT` | 可选 | 默认 `3000` |
| `NODE_ENV` | 建议 | 生产设 `production` |

---

## 18. 相关文件

| 文件 | 用途 |
|------|------|
| `.env.example` | 环境变量模板 |
| `prisma/supabase-init.sql` | 数据库建表 SQL |
| `prisma/schema.prisma` | Prisma 模型定义 |
| `scripts/check-availability.mjs` | 线上功能自检 |
| `app/api/health/route.ts` | 健康检查 API |

---

**仓库**：https://github.com/B2BForge-ai/marketup-aeo-grader  
**当前 Vercel 演示**：https://marketup-aeo-grader.vercel.app  

如有问题，可先访问 `/api/health` 查看各子系统状态与 `hints` 提示。
