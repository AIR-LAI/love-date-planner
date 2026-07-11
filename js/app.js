// ============================================
// 约会策划小工具 - 使用 GitHub API 存储
// 令牌永不提交到代码，从 localStorage 读取
// ============================================

const GITHUB_OWNER = "AIR-LAI";
const GITHUB_REPO = "love-date-planner";

// 获取 GitHub Token（从 URL 参数或 localStorage）
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
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 读取数据（使用 raw.githubusercontent.com，无需认证）
async function getDateConfig(dateId) {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/data/${dateId}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch(e) {
    return null;
  }
}

// 写入数据（使用 GitHub API，需要 Token）
async function githubPut(path, contentObj) {
  const token = getToken();
  if (!token) throw new Error("请先设置 GitHub Token");
  
  const content = JSON.stringify(contentObj);
  let sha;
  try {
    const existing = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (existing.ok) sha = (await existing.json()).sha;
  } catch(e) {}
  
  const body = { message: `Update ${path}`, content: btoa(unescape(encodeURIComponent(content))), branch: "main" };
  if (sha) body.sha = sha;
  
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`写入失败: ${err.substring(0, 100)}`);
  }
}

// 保存约会配置（需要 Token）
async function saveDateConfig(dateId, config) {
  await githubPut(`data/${dateId}.json`, { config, response: null });
}

// 提交女友选择（需要 Token）
async function submitResponse(dateId, response) {
  const existing = await getDateConfig(dateId) || { config: {}, response: null };
  existing.response = { ...response, submittedAt: new Date().toISOString() };
  await githubPut(`data/${dateId}.json`, existing);
}

// 轮询监听变化
function pollDateConfig(dateId, callback, interval = 4000) {
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
    dates.unshift({ id: dateId, title, createdAt: Date.now() });
    localStorage.setItem("myDates", JSON.stringify(dates));
  }
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
  return Promise.resolve();
}

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
