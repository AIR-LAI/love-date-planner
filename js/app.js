// ============================================
// 约会策划小工具 - 核心逻辑
// ============================================

// 初始化 Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// 生成短 ID
function generateId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 保存约会配置
async function saveDateConfig(dateId, config) {
  const data = {
    config: config,
    response: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await db.collection("dates").doc(dateId).set(data);
}

// 获取约会配置
async function getDateConfig(dateId) {
  const doc = await db.collection("dates").doc(dateId).get();
  if (!doc.exists) return null;
  return doc.data();
}

// 提交女友选择
async function submitResponse(dateId, response) {
  await db.collection("dates").doc(dateId).update({
    response: {
      ...response,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    }
  });
}

// 实时监听约会数据变化
function listenDateConfig(dateId, callback) {
  return db.collection("dates").doc(dateId).onSnapshot((doc) => {
    if (doc.exists) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
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
  // fallback
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

// 显示 Toast 提示
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
