# AI 角色工坊

> 用大白话创造你的专属 AI 角色，双击 HTML 就能用，不需要写代码。

## 是什么

一个纯前端的 AI 角色创作工具。你填个表描述想要的角色（说话语气、口头禅、贴几句原话），AI 自动生成 System Prompt，然后你立刻就能跟 ta 聊天。不满意就点「微调」，用大白话说「温柔一点」，AI 自动调整。

**SillyTavern 是 Photoshop，我们是美图秀秀。**

## 怎么用

### 方式一：在线打开（推荐）
1. 下载 `dist` 文件夹
2. 解压
3. 双击 `index.html`
4. 浏览器里打开即用

### 方式二：开发者模式
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
- [Qwen 注册](https://dashscope.aliyun.com)

配置：点左下角 ⚙️ 设置 → 选 Provider → 填 Key → 验证 → 保存。

## 技术栈

Vite + React 18 + TypeScript + MUI v6 + Tailwind CSS

纯静态 SPA，`base: './'` 相对路径，无后端依赖。

## License

MIT
