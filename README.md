# 北美留学月报反馈生成工具

这是一个基于 Next.js 的月报反馈生成 Web 应用，用于上传 Excel/CSV、填写沟通内容、选择申请类型、预览反馈报告，并导出 PDF/PNG。

## 当前架构

- 前端框架：Next.js 16、React 19、TypeScript、Tailwind CSS。
- 服务端：Next.js App Router API Route，仅保留可选的本地 OCR 接口。
- 月报核心功能：Excel/CSV 解析、字段筛选、报告预览、附件展示、PDF/PNG 导出均在浏览器端完成。
- 数据库：月报生成工具不依赖数据库。仓库内保留 Prisma/PostgreSQL 模块，用于更完整的申请管理系统扩展。
- 文件存储：当前不上传到云端，用户选择的 Excel、报告和附件只在浏览器会话中处理。
- 第三方 API：默认不依赖第三方 API。

## 推荐正式部署

优先部署到 Vercel Production。

- Production URL：使用 Vercel 项目的 Production Domain，例如 `https://your-project.vercel.app`。
- 不使用 localhost、局域网地址、Cloudflare quick tunnel 或 Preview Deployment URL 作为正式分享链接。
- 后续如需数据库、账号系统、云端文件存储，可接入 Supabase。
- 如未来拆出独立后端，可将前端继续放在 Vercel，后端放在 Render。

## 本地开发

```bash
pnpm install
pnpm dev
```

默认开发地址：

```text
http://127.0.0.1:3000/monthly-reports
```

如果只调试月报页面，也可以使用：

```bash
pnpm dev:monthly
```

## 生产构建

```bash
pnpm build
pnpm start
```

Vercel 配置见 `vercel.json`：

- Install Command：`pnpm install --frozen-lockfile`
- Build Command：`pnpm build`
- Output Directory：`.next`
- Framework Preset：Next.js

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | 否 | 正式生产域名。用于后续分享链接、回调或文档展示。 |
| `ENABLE_MACOS_OCR` | 否 | 本地 macOS OCR 开关。生产环境保持 `false`。 |
| `DATABASE_URL` | 否 | 申请管理扩展模块的数据库连接。月报工具不需要。 |
| `POSTGRES_DB` | 否 | 本地 PostgreSQL 数据库名。 |
| `POSTGRES_USER` | 否 | 本地 PostgreSQL 用户名。 |
| `POSTGRES_PASSWORD` | 否 | 本地 PostgreSQL 密码。生产环境请使用平台密钥，不要提交真实密码。 |

## GitHub 上传前检查

不要提交以下内容：

- `.env`、`.env.local`、任何真实 Token/API Key/密码。
- `.next/`、`node_modules/`、`tsconfig.tsbuildinfo`。
- 本地数据库文件，如 `*.db`、`*.sqlite`。
- 本地临时启动脚本和预览隧道脚本。

`.gitignore` 已包含以上规则。

## Vercel 部署步骤

1. 将仓库推送到 GitHub。
2. 在 Vercel 选择 `New Project`，导入 GitHub 仓库。
3. Framework Preset 选择 `Next.js`。
4. Install Command 使用 `pnpm install --frozen-lockfile`。
5. Build Command 使用 `pnpm build`。
6. 环境变量中设置：
   - `NEXT_PUBLIC_APP_URL=https://你的生产域名`
   - `ENABLE_MACOS_OCR=false`
7. 点击 Deploy。
8. 部署完成后，在 Vercel Project Settings 的 Domains 中确认 Production Domain。

## 后续更新与重新部署

```bash
git add .
git commit -m "Update monthly report generator"
git push
```

推送到默认生产分支后，Vercel 会自动重新部署，Production Domain 保持不变。

## 自定义域名

1. 在 Vercel 项目中进入 Settings → Domains。
2. 添加公司域名或子域名，例如 `reports.example.com`。
3. 按 Vercel 提示在域名 DNS 服务商处添加 CNAME 或 A 记录。
4. DNS 生效后，Vercel 会自动签发 HTTPS 证书。

## 常见部署问题

- 构建报 `node_modules` 或锁文件问题：确认提交了 `pnpm-lock.yaml`，并使用 `pnpm install --frozen-lockfile`。
- 生产环境截图 OCR 无结果：这是预期行为。正式版以 Excel/CSV 上传和手动补充为主，`ENABLE_MACOS_OCR` 不应在 Vercel 开启。
- 刷新页面后 404：Vercel + Next.js App Router 会自动处理 `/monthly-reports` 路由；不要把静态导出产物当作普通静态站点部署。
- 文件上传无结果：确认浏览器允许读取本地文件；Excel 建议使用 `.xlsx`、`.xls` 或 `.csv`。
- 导出无反应：确认浏览器未拦截下载，并至少勾选 PDF 或 PNG 一种导出格式。

## 主要入口

- 月报工具：`/monthly-reports`
- Excel 导入中心：`/import`
- 申请管理扩展页面：`/applications`
- 学生管理扩展页面：`/students`
