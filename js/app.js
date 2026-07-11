// ============================================
// 约会策划小工具 - 使用 GitHub API 存储
// ============================================

// 生成短 ID
function generateId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GitHub API 基础 URL
const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;

// 读取 GitHub 上的文件
async function githubGet(path) {
  const res = await fetch(`${GITHUB_API}/${path}`, {
    headers: { "Authorization": `Bearer ${GITHUB_TOKEN}` }
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const json = await res.json();
  // GitHub API 返回 base64 编码的内容
  const decoded = atob(json.content.replace(/\n/g, ""));
  return JSON.parse(decoded);
}

// 写入 GitHub 上的文件
async function githubPut(path, contentObj) {
  const content = JSON.stringify(contentObj);
  // 先检查文件是否存在（获取 SHA）
  let sha;
  try {
    const existing = await fetch(`${GITHUB_API}/${path}`, {
      headers: { "Authorization": `Bearer ${GITHUB_TOKEN}` }
    });
    if (existing.ok) {
      sha = (await existing.json()).sha;
    }
  } catch(e) {}
  
  const body = {
    message: `Update ${path}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: "main"
  };
  if (sha) body.sha = sha;
  
  const res = await fetch(`${GITHUB_API}/${path}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API write error: ${res.status} - ${err.substring(0, 100)}`);
  }
}

// 保存约会配置
async function saveDateConfig(dateId, config) {
  const data = { config: config, response: null };
  await githubPut(`data/${dateId}.json`, data);
}

// 获取约会配置
async function getDateConfig(dateId) {
  return await githubGet(`data/${dateId}.json`);
}

// 提交女友选择
async function submitResponse(dateId, response) {
  const existing = await getDateConfig(dateId) || { config: {}, response: null };
  existing.response = {
    ...response,
    submittedAt: new Date().toISOString()
  };
  await githubPut(`data/${dateId}.json`, existing);
}

// 轮询监听变化
function pollDateConfig(dateId, callback, interval = 3000) {
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

// 获取或创建本地日期列表
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

function removeMyDate(dateId) {
  const dates = getMyDates().filter(d => d.id !== dateId);
  localStorage.setItem("myDates", JSON.stringify(dates));
}

// 复制文本
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  return Promise.resolve();
}

// 显示 Toast
function showToast(message) {
  let toast = document.querySelector(".copy-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "copy-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}
