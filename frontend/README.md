# Coursework Frontend (Vite + React + Tailwind)

基于仓库 `openapi.json` 定义的接口快速搭建的控制面板，支持学生、课程、选课与成绩管理。

## 开发

```bash
cd frontend
npm install   # 如遇到私有镜像限制，可配置 NPM registry 后重试
npm run dev   # 默认 http://localhost:5173
```

运行后可在页面顶部配置 API 基础地址与共享密码（默认为 `team007`），其余操作会自动附带密码字段以满足后端要求。
