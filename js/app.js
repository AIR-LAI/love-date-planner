// ============================================
// 约会策划小工具 - 使用 GitHub API 存储
// 令牌从 localStorage 或 URL 参数读取
// ============================================

const GITHUB_OWNER = "AIR-LAI";
const GITHUB_REPO = "love-date-planner";

// 获取 GitHub Token
function getToken() {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("t");
  if (urlToken && urlToken.length > 10) {
    try { localStorage.setItem("githubToken", urlToken); } catch(e) {}
    return urlToken;
  }
  return localStorage.getItem("githubToken");
}

// 生成短 ID
function generateId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// UTF-8 安全 Base64 编码
function toBase64(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// UTF-8 安全 Base64 解码
function fromBase64(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// 读取数据（通过 raw.githubusercontent.com，无需认证）
async function getDateConfig(dateId) {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/data/${dateId}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text);
  } catch(e) { return null; }
}

// 写入数据（通过 GitHub API）
async function githubPut(path, contentObj) {
  const token = getToken();
  if (!token) throw new Error("请先设置 Token（刷新页面会提示输入）");
  
  const content = JSON.stringify(contentObj, null, 2);
  const base64 = toBase64(content);
  
  // 获取文件 SHA
  let sha;
  try {
    const existing = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (existing.ok) sha = (await existing.json()).sha;
  } catch(e) {}
  
  const body = { message: `Update ${path}`, content: base64, branch: "main" };
  if (sha) body.sha = sha;
  
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub 写入失败: ${res.status}`);
  }
}

// 保存约会配置
async function saveDateConfig(dateId, config) {
  await githubPut(`data/${dateId}.json`, { config: config, response: null });
}

// 提交女友选择
async function submitResponse(dateId, response) {
  const existing = await getDateConfig(dateId) || { config: {}, response: null };
  existing.response = { ...response, submittedAt: new Date().toISOString() };
  await githubPut(`data/${dateId}.json`, existing);
}

// 轮询监听变化
function pollDateConfig(dateId, callback, interval = 5000) {
  let stop = false;
  let timer;
  async function check() {
    if (stop) return;
    try {
      const data = await getDateConfig(dateId);
      if (data) callback(data);
    } catch(e) {}
    if (!stop) timer = setTimeout(check, interval);
  }
  check();
  return () => { stop = true; if (timer) clearTimeout(timer); };
}

// 本地日期列表
function getMyDates() {
  const stored = localStorage.getItem("myDates");
  return stored ? JSON.parse(stored) : [];
}
function addMyDate(dateId, title) {
  const dates = getMyDates();
  if (!dates.find(d => d.id === dateId)) {
    dates.unshift({ id: dateId, title: title, createdAt: Date.now() });
    localStorage.setItem("myDates", JSON.stringify(dates));
  }
}

// 复制文本
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
  return Promise.resolve();
}

// Toast
function showToast(message) {
  let toast = document.querySelector(".copy-toast");
  if (!toast) {
    toast = document.createElement("div"); toast.className = "copy-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}
