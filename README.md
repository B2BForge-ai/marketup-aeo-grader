# marketup-aeo-grader

AI 搜索可见度诊断器 — 基于 Next.js + DeepSeek 的企业 GEO 可见度审计工具。

## 本地开发

```bash
npm install
cp .env.example .env.local   # 填入 DEEPSEEK_API_KEY
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 环境变量

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek 开放平台 API Key |
| `DEEPSEEK_MODEL` | 可选，默认 `deepseek-chat` |

## 部署到 Vercel

1. 导入本仓库
2. 在 Vercel 环境变量中配置 `DEEPSEEK_API_KEY`
3. Deploy（建议 Pro 计划，诊断 API 响应约 30–60 秒）
