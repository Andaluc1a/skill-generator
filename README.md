# AI 角色工坊

> 用大白话创造你的专属 AI 角色，双击启动就能用，不需要写代码。

## 是什么

一个纯前端的 AI 角色创作工具。你填个表描述想要的角色（说话语气、口头禅、贴几句原话），AI 自动生成 System Prompt，然后你立刻就能跟 ta 聊天。不满意就点「微调」，用大白话说「温柔一点」，AI 自动调整。

**SillyTavern 是 Photoshop，我们是美图秀秀。**

## 怎么用

### 最简单：双击启动（Windows）

1. 下载整个 `dist` 文件夹
2. 打开 `dist` 文件夹
3. 双击 `启动.bat`
4. 浏览器自动打开 → 开始使用

> 需要 Python（大多数人都有）或 Node.js。没有的话 .bat 会提示你安装。

### 或者开发者自己跑

```bash
git clone git@github.com:Andaluc1a/skill-generator.git
cd skill-generator
npm install
npm run dev
```

## 功能

- 🎨 **10 个预设模板**：毒舌损友、治愈树洞、东北唠嗑……
- 📝 **5 步填空创建**：语气/口头禅/原话/知识/开场白
- 💬 **立刻聊天测试**：创建完就能聊，Markdown 渲染
- 🎛️ **大白话微调**：点按钮 → 说「语气温柔点」→ 自动调整
- 📥 **一键导出**：SKILL.md / JSON 格式
- 🔑 **自带 API Key**：Key 只存你浏览器，不上传任何服务器

## 需要什么

一个 LLM API Key（推荐 DeepSeek，新用户送免费额度）：
- [DeepSeek 注册](https://platform.deepseek.com)

配置：点左下角 ⚙️ 设置 → 选 Provider → 填 Key → 验证 → 保存 → 回首页创建角色。

## 技术栈

Vite + React 18 + TypeScript + MUI v6 + Tailwind CSS

纯静态 SPA，`base: './'` + `createHashRouter`，双击 `启动.bat` 即用。

## License

MIT
