# AI 角色工坊 · 完整实施计划

## 一、产品定位

**一句话：** 让普通人在 3 分钟内创造一个有温度的 AI 角色陪聊，不需要任何技术背景。

**目标受众：** 对技术一窍不通的普通人。不会写 prompt，不会编程，不会配置环境。

**核心差异化：** 
- 不是张雪峰复制器，是角色工厂
- 不是问题回答工具，是情感陪伴 + 知识对话
- 不是 developer tool，是 consumer product

---

## 二、用户故事

### 场景 1：「我想做个毒舌损友」
> 小王打开网页，首页看到一排角色卡片。他点「创建新角色」，输入名字「嘴贱的阿强」，
> 设定「说话很损但真心关心朋友，爱用网络梗」。点生成，3 秒后进入聊天页。
> 他试探：「我今天分手了」，阿强回复：「分得好！那个女的配不上你，
> 你值得更好的——虽然你也没多好就是了」。

### 场景 2：「我想复刻我爸的语气」
> 小张想做一个像已故父亲一样说话的角色。她点「专家模式」，贴上
> 父亲生前的微信聊天记录（约 2000 字）。AI 蒸馏出父亲的语气特征：
> 每句话结尾爱加「啊」、喜欢用省略号、爱提天气。她测试：「爸，我找到工作了」，
> 角色回复：「不错啊...深圳那边热不热啊...记得多喝水」。

### 场景 3：「我想要一个法律顾问」
> 小李法考在即。他创建角色「法考张老师」，点开专家模式，贴了 3000 字
> 法考知识点笔记。聊天时问「行政复议和行政诉讼有什么区别」，
> 角色引用他贴的知识点，用讲课的语气回答。

### 场景 4：「越聊越不像怎么办」
> 小陈觉得他创建的「温柔学姐」说话太生硬。她点聊天框旁边的「微调」按钮，
> 弹出对话框，输入「语气更软一点，多点 emoji，像在小红书上说话」。
> 转圈 3 秒后完成，她继续聊天发现学姐的语气变了。但她还是不满意，
> 又点了一次微调：「不要用网络用语，像真诚的学姐而不是网红」。
> 又转 3 秒。这次对了。

---

## 三、执行阶段

### Phase 1：项目骨架 + LLM 层

**目标：** 能构建、能双击打开、LLM 能调通。

**文件清单（6 个）：**

```
skill-generator/
├── .gitignore
├── package.json
├── vite.config.ts          (base: './', 相对路径构建)
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css             (Tailwind + 全局样式)
│   └── llm/
│       ├── provider.ts         (StreamChunk/ChatMessage/LLMProvider/ApiConfig)
│       ├── openai-compatible.ts (fetch + SSE + AbortSignal)
│       └── stream-parser.ts    (SSE 流解析)
```

**验证标准：**
- `npx tsc --noEmit` 通过
- `npm run build` 通过
- `dist/index.html` 双击能打开（看到空白页也算通过）

---

### Phase 2：首页 + 角色创建向导

**目标：** 用户能浏览模板、创建角色、看到 AI 生成的结果。

**文件清单（8 个）：**

```
src/
├── store/
│   └── appStore.tsx        (全局状态: characters[], activeCharacter, apiConfig)
├── types/
│   └── character.ts        (Character 类型定义)
├── data/
│   └── templates.json      (10 个预设角色模板)
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx   (WorkBuddy 风格: 深色侧边栏 + 浅色主区域)
│   └── home/
│       ├── HomePage.tsx     (模板卡片墙 + 新建入口)
│       ├── CharacterCard.tsx (角色卡片: 颜色+emoji+名字+一句话)
│       └── CreateWizard.tsx (创建向导: 快速模式 + 专家模式可展开)
├── routes/
│   └── Home.tsx
├── utils/
│   └── promptBuilder.ts    (System Prompt 生成器)
```

**10 个预设模板（templates.json）：**

| emoji | 名字 | 性格描述 |
|-------|------|----------|
| 👩‍🏫 | 知心学姐 | 温柔耐心的大学学姐，会鼓励人，偶尔吐槽 |
| 😈 | 毒舌损友 | 嘴上损你但实际关心你，爱用网络梗 |
| 🧘 | 治愈系树洞 | 无条件接纳你的情绪，说话像心理咨询师 |
| 👴 | 老工程师 | 退休东北工程师，爱用修东西比喻讲道理 |
| 🎭 | 戏精闺蜜 | 每句话都像在演小品，夸张幽默 |
| 📚 | 励志导师 | 正能量满满，用名人名言鼓励你 |
| 🤖 | 冷酷 AI | 理性高效没感情，只给答案不给安慰 |
| 🐱 | 猫主子 | 用猫的视角说话，傲娇可爱 |
| 💼 | 毒舌面试官 | 模拟面试场景，犀利提问 |
| 🎤 | 东北唠嗑 | 东北大爷大妈唠嗑风格，热情实在 |

**创建向导设计：**

```
┌─ 创建角色 ──────────────────────────┐
│                                      │
│  起个名字：[_______________]          │
│                                      │
│  性格描述：[_______________]          │
│  （用大白话写，比如"说话很损的朋友，   │
│   但真心对人好"）                    │
│                                      │
│  ▶ 专家模式（给角色加点料）           │
│  ┌────────────────────────────┐     │
│  │ 贴点材料（ta是怎么说话的）：  │     │
│  │ [大文本框，粘贴聊天记录/文章] │     │
│  │                            │     │
│  │ 给一句示例对话：             │     │
│  │ 谁说：[你]                  │     │
│  │ ta回：[_______________]     │     │
│  └────────────────────────────┘     │
│                                      │
│  知识来源（如果ta需要专业知识）：      │
│  ○ 不需要（纯聊天）                  │
│  ○ 粘贴文章/笔记                    │
│  ○ 上传文件（.txt/.md/.pdf）        │
│                                      │
│  [🎨 生成角色]                       │
└──────────────────────────────────────┘
```

- 专家模式**默认收起**，普通人看不到
- 点「生成角色」→ LLM 调用（用专门的 meta-prompt）→ 生成完整 System Prompt → 跳转聊天页

**System Prompt 生成用的 meta-prompt：**

```
你是一个 System Prompt 设计专家。根据用户对一个角色
的描述，生成一份能让 AI 精确扮演这个角色的 System Prompt。

角色名称：{name}
性格描述：{description}
参考材料：{materials}（如果有）
知识来源：{knowledge}（如果有）

System Prompt 必须包含：
1. 角色定义（我是谁）
2. 说话风格（语气/句式/常用词）
3. 行为准则（什么该做什么不该做）
4. 知识范围（引用用户提供的知识，不要编造）
5. 示例对话（展示正确风格）

直接输出 System Prompt，不要解释。
```

用户输入「老王，东北退休工程师，说话带东北口音，爱用修东西打比方」→ LLM 输出完整 System Prompt → 存入角色数据 → 用户立刻能聊。

**验证标准：**
- LLM 能成功生成 System Prompt
- 首页能看到模板卡片 + 新建按钮
- 创建向导流程走通
- 生成的角色能进入聊天页

---

### Phase 3：聊天测试 + 微调

**目标：** 核心体验闭环——聊天 + 不满意随时微调。

**文件清单（7 个）：**

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx        (聊天主面板: 消息列表 + 输入 + 微调按钮)
│   │   ├── ChatMessage.tsx      (聊天气泡: Markdown 渲染 + 头像)
│   │   ├── ChatInput.tsx        (输入框: Enter发送/ShiftEnter换行/停止)
│   │   ├── TweakDialog.tsx      (微调弹窗: 大白话输入 → LLM调整 → 转圈)
│   │   └── PersonaCard.tsx      (侧边角色信息卡: 名字/头像色/参数)
│   ├── routes/
│   │   └── Chat.tsx             (聊天页路由)
│   └── utils/
│       ├── personaTweaker.ts    (微调引擎: 调 LLM 改 System Prompt)
│       └── chatManager.ts       (流式聊天封装)
```

**微调按钮的位置和交互：**

```
┌─ 聊天界面 ────────────────────────┐
│                                    │
│  [角色卡片: 🤖 嘴贱的阿强]         │
│  [微调 ▼]                          │
│                                    │
│  用户：我今天分手了                 │
│  阿强：分得好！那女的配不上你      │
│  用户：她跟别人跑了                 │
│  阿强：啥？！那等哥帮你骂她        │
│                                    │
│  [输入框...................] [发送] │
│  [🎨 微调这个角色]                 │ ← 在这里
└────────────────────────────────────┘
```

点「微调」→ 弹出：

```
┌─ 微调角色风格 ────────────────────┐
│                                    │
│  用大白话说说想怎么调整：           │
│                                    │
│  ┌────────────────────────┐       │
│  │                        │       │
│  │                        │       │
│  └────────────────────────┘       │
│                                    │
│  常用调整：                        │
│  · "语气温和一点，不要那么冲"       │
│  · "太啰嗦了，说话简短一点"         │
│  · "多点幽默感"                    │
│  · "更专业一些，用术语"             │
│  · "像真的朋友一样，别太正式"       │
│                                    │
│  [取消]  [⏳ 调整中...]            │
└────────────────────────────────────┘
```

**微调核心逻辑：**

```
用户点「微调」→ 输入大白话反馈
  → 用专门的 meta-prompt 调 LLM
  → LLM 理解「语气太冲」→ 在 System Prompt 加「语气温和、避免攻击性语言」
  → 返回新的 System Prompt
  → 更新角色的 systemPrompt
  → 后续对话自动用新 prompt
  → 不需要重新生成之前的消息
```

meta-prompt：
```
你是一个 System Prompt 调优器。下面是当前角色的完整 System Prompt：

"""
{currentSystemPrompt}
"""

用户觉得这个角色还不够像，想调整的地方是：

「{userFeedback}」

请根据用户的白话反馈，精确修改 System Prompt 中相关的部分。
只改用户提到的地方，其他保持不变。
直接输出修改后的完整 System Prompt，不要解释。
```

**验证标准：**
- 创建角色后自动进入聊天页
- 发送消息 → LLM 流式回复 → 打字机效果
- 点微调 → 弹出对话框 → 输入反馈 → 转圈 → 完成
- 微调后发送新消息，角色风格明显改变

---

### Phase 4：导出 + 设置 + 角色管理

**目标：** 角色能保存、导出、分享、管理。

**文件清单（5 个）：**

```
src/
├── components/
│   ├── settings/
│   │   └── SettingsPage.tsx    (API Key 配置)
│   ├── routes/
│   │   └── Settings.tsx
│   ├── utils/
│   │   ├── skillExport.ts     (导出 SKILL.md)
│   │   ├── characterIO.ts     (导入/导出 JSON)
│   │   └── storage.ts         (localStorage 封装)
│   └── store/
│       └── appStore.tsx       (补充: 角色增删改查)
```

**导出 SKILL.md 格式：**

与 agent-skills 协议兼容的完整 Skill 文件。

**导出分享链接：**

```
导出 JSON → 生成分享码 → 朋友在首页点「导入角色」
→ 粘贴分享码 → 角色和他的 System Prompt 一起加载
```

**角色管理功能：**
- 角色列表（首页侧边栏）
- 角色编辑（修改名字/描述/System Prompt）
- 角色删除
- 角色复制（基于现有角色创建新角色）
- 微调历史（最近 5 次调整，可回退）

**验证标准：**
- 导出 SKILL.md 格式正确
- 导出/导入角色 JSON 正常
- API Key 配置页功能正常
- 角色管理（增删改查）正常

---

### Phase 5：构建 + 验证 + 推送

**目标：** 确保任何人任何环境都能打开使用。

**文件清单（3 个）：**
```
README.md          (中文，面向普通用户)
.github/workflows/ (可选: 自动构建)
```

**环境验证清单：**

| 测试场景 | 预期结果 |
|----------|----------|
| `npm install && npm run dev` | 开发环境启动 |
| `npm run build && npm run preview` | 预览模式正常 |
| 双击 dist/index.html | 页面完全正常加载 |
| Chrome/Edge 最新版 | 正常 |
| Firefox 最新版 | 正常 |
| 360/搜狗浏览器 | 降级正常（ES6+ 需支持） |

**README 内容：**

面向普通用户，两种打开方式：
1. **在线版（推荐）：** 打开 GitHub Pages（部署后加上链接）
2. **离线版：** 下载 dist 文件夹 → 解压 → 双击 index.html

包含：
- 什么是 AI 角色工坊（一句话）
- 怎么用（3 步截图）
- 需要什么（API Key，哪里获取）
- 常见问题

---

## 四、完整文件清单（共 30 个文件）

```
skill-generator/
├── .gitignore
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── README.md
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── llm/
│   │   ├── provider.ts
│   │   ├── openai-compatible.ts
│   │   └── stream-parser.ts
│   ├── types/
│   │   └── character.ts
│   ├── data/
│   │   └── templates.json
│   ├── store/
│   │   └── appStore.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx
│   │   ├── home/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CharacterCard.tsx
│   │   │   └── CreateWizard.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TweakDialog.tsx
│   │   │   └── PersonaCard.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   ├── routes/
│   │   ├── Home.tsx
│   │   ├── Chat.tsx
│   │   └── Settings.tsx
│   └── utils/
│       ├── promptBuilder.ts
│       ├── personaTweaker.ts
│       ├── chatManager.ts
│       ├── skillExport.ts
│       ├── characterIO.ts
│       └── storage.ts
```

---

## 五、改进预留

| 预留功能 | 预留方式 | 触发版号 |
|----------|----------|----------|
| 角色社区/分享 | Character 类型含 shareCode 字段 | V1.1 |
| 更多模板 | templates.json 独立文件，加模板不改代码 | V1.1 |
| PDF 上传 | pdf.js 懒加载，失败不影响主流程 | V1.1 |
| 网页链接导入 | URL 输入框 + fetch 前端抓取 | V1.1 |
| RAG 知识库 | Transformers.js 按需加载 | V2.0 |
| 语音对话 | ChatInput 预留麦克风按钮占位 | V2.0 |
| 角色评分 | ChatMessage 预留 👍👎 按钮位置但隐藏 | V1.1 |
| 多语言 | System Prompt 生成时传 language 参数 | V1.1 |
| 深色模式 | Tailwind dark: 类 + 全局切换 | V1.1 |
| 对话导出 | 导出聊天记录为 Markdown | V1.1 |

---

## 六、分步确认流程

每完成一个 Phase：
1. 代码写完
2. `npx tsc --noEmit` 验证类型
3. `npm run build` 验证构建
4. 双击 `dist/index.html` 验证文件协议可开
5. 截图/描述给你看效果
6. **你确认后** 我继续下一个 Phase
