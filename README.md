# 💕 约会策划小工具

一个浪漫的约会邀请 & 策划工具，韩系奶油手绘风，手机网页版。

## 功能

- 💌 **约会邀请页** — 女友打开链接，看到浪漫的邀请卡片，拒绝按钮会「溜走」，只能点接受
- 📅 **选择页面** — 接受后，挑选日期、时间段、约会项目、吃的、补充备注，提交
- 🎉 **提交庆祝** — 提交后显示五彩纸屑动画和感谢页面
- 🎨 **设置页面** — 你配置所有选项（日期、项目、吃的、时间段），查看女友的选择结果
- 🔄 **实时同步** — 女友提交后，你立即就能看到（使用 Firebase Firestore 实时数据库）

## 文件结构

```
love-date-planner/
├── index.html          # 首页（入口）
├── setup.html          # 设置页（你的管理后台）
├── invite.html         # 邀请页（发给女友）
├── css/
│   └── style.css       # 韩系奶油手绘风样式
├── js/
│   ├── firebase-config.js  # Firebase 配置（需要你填写）
│   └── app.js              # 核心逻辑（Firebase 初始化 + CRUD）
```

## 部署步骤

### 第 1 步：创建 Firebase 项目（免费，5 分钟）

1. 打开 [Firebase 控制台](https://console.firebase.google.com)
2. 点击「创建项目」，输入项目名称（如 `love-date-planner`）
3. 关闭 Google Analytics（不需要）
4. 创建完成后，左侧菜单 → **Firestore Database** → **创建数据库**
   - 选择「测试模式」（安全规则设为 `if true`，方便分享）
   - 选择 Cloud Firestore 位置（选最近的，如 `asia-east1`）
   - 点击「创建」
5. 左上角齿轮图标 → **项目设置** → **常规** → 向下滚动到「您的应用」
   - 点击「**添加应用**」→ 选择 **Web 图标（</>）**
   - 输入应用名称（如 `约会小工具`）
   - 点击「注册应用」
   - **复制显示的 firebaseConfig 对象**（包含 apiKey, authDomain 等字段）

### 第 2 步：填写配置

1. 用文本编辑器打开 `js/firebase-config.js`
2. 将第 1 步复制的配置粘贴进去，替换 `YOUR_API_KEY` 等占位符

### 第 3 步：部署到 Vercel（免费，3 分钟）

#### 方式一：使用 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 进入项目目录
cd love-date-planner

# 部署
vercel --prod
```

按照提示登录 Vercel 账号，部署完成后会得到一个 URL。

#### 方式二：使用 Vercel Web 界面

1. 打开 [vercel.com](https://vercel.com)，登录（可用 GitHub 账号）
2. 点击 **Add New → Project**
3. 导入你的项目（需要先推送到 GitHub），或者：
4. 点击 **"Import Third-Party Git Repository"** → 选择 **"Deploy without Git"**
   - 将整个 `love-date-planner` 文件夹拖拽上传
   - Framework Preset 选择 **Other**
   - 点击 **Deploy**
5. 等待部署完成，得到 URL

### 第 4 步：开始使用

1. 打开部署后的 `https://你的域名.vercel.app/setup.html`
2. 填写约会选项（日期、项目、吃的等）
3. 点击「生成邀请链接」
4. **复制「邀请链接」**，发给女朋友
5. **复制「设置链接」**，自己保存，以后可以随时查看结果
6. 女友打开邀请链接 → 接受 → 选好 → 提交
7. 你打开设置链接 → 看到女友的选择结果

## 安全说明

- 本工具使用 Firebase 测试模式（完全开放），任何人拿到链接都可以查看/修改
- 请妥善保管你的设置链接
- 不要将设置链接发给女友（发邀请链接即可）

## 自定义

- 修改 `css/style.css` 中的 CSS 变量可以更改主题色
- 邀请页的躲避消息在 `invite.html` 的 `DODGE_MESSAGES` 数组中修改
- 浮动装饰件在 `style.css` 的 `.floating-hearts` 部分修改
