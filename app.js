const STORE = {
  user: "fs_user",
  users: "fs_users",
  tasks: "fs_tasks",
  submissions: "fs_submissions",
  xp: "fs_xp",
  quiz: "fs_quiz_results"
};
const USER_SCOPED_KEYS = new Set([STORE.tasks, STORE.submissions, STORE.xp, STORE.quiz]);
const storageKey = (key) => {
  if (!USER_SCOPED_KEYS.has(key)) return key;
  const active = (() => {
    try { return JSON.parse(localStorage.getItem(STORE.user) || "null"); }
    catch { return null; }
  })();
  return active && active.username ? `${key}:${active.username}` : key;
};
const readStore = (key, fallback) => {
  try {
    const value = localStorage.getItem(storageKey(key));
    return value === null ? fallback : JSON.parse(value);
  } catch { return fallback; }
};
const writeStore = (key, value) => {
  try { localStorage.setItem(storageKey(key), JSON.stringify(value)); return true; }
  catch (error) {
    console.error("ذخیره‌سازی انجام نشد:", error);
    return false;
  }
};
const currentUser = () => readStore(STORE.user, null);
const requireUser = () => {
  const user = currentUser();
  if (!user) { window.location.href = "index.html"; return null; }
  return user;
};
const safeText = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
function showMessage(id, text, type = "success") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `notice ${type}`;
}
function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const username = document.getElementById("registerUsername").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  if (name.length < 2 || username.length < 3 || password.length < 4) {
    showMessage("formMessage", "نام باید حداقل ۲ حرف، نام کاربری ۳ حرف و رمز حداقل ۴ کاراکتر باشد.", "error");
    return;
  }
  const users = readStore(STORE.users, {});
  if (users[username]) {
    showMessage("formMessage", "این نام کاربری قبلاً ثبت شده است.", "error");
    return;
  }
  users[username] = { name, username, password };
  writeStore(STORE.users, users);
  writeStore(STORE.user, { name, username });
  writeStore(STORE.xp, 0);
  window.location.href = "HOME.html";
}
function loginUser(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const users = readStore(STORE.users, {});
  const account = users[username];
  if (!account || account.password !== password) {
    showMessage("formMessage", "نام کاربری یا رمز عبور درست نیست. اگر حساب نداری، ثبت‌نام کن.", "error");
    return;
  }
  writeStore(STORE.user, { name: account.name, username: account.username });
  window.location.href = "HOME.html";
}
function logout() {
  localStorage.removeItem(STORE.user);
  window.location.href = "index.html";
}
function addXP(amount) {
  const next = Math.max(0, Number(readStore(STORE.xp, 0)) + amount);
  writeStore(STORE.xp, next);
  return next;
}
function initHome() {
  const user = requireUser(); if (!user) return;
  const welcome = document.getElementById("welcomeName");
  if (welcome) welcome.textContent = user.name;
  const xp = document.getElementById("xpValue");
  if (xp) xp.textContent = readStore(STORE.xp, 0);
  const taskCount = document.getElementById("taskCount");
  if (taskCount) taskCount.textContent = readStore(STORE.tasks, []).filter(t => !t.done).length;
  const doneCount = document.getElementById("doneCount");
  if (doneCount) doneCount.textContent = readStore(STORE.tasks, []).filter(t => t.done).length;
}
function addTask(event) {
  event.preventDefault();
  const titleInput = document.getElementById("taskTitle");
  const subjectInput = document.getElementById("taskSubject");
  const dueInput = document.getElementById("taskDue");
  const title = titleInput.value.trim();
  if (!title) return;
  const tasks = readStore(STORE.tasks, []);
  tasks.unshift({ id: Date.now(), title, subject: subjectInput.value, due: dueInput.value, done: false });
  writeStore(STORE.tasks, tasks);
  titleInput.value = ""; dueInput.value = "";
  renderTasks();
  showMessage("taskMessage", "تکلیف با موفقیت ذخیره شد 🌱");
}
function toggleTask(id) {
  const tasks = readStore(STORE.tasks, []);
  const task = tasks.find(t => t.id === Number(id));
  if (task && !task.done) { task.done = true; addXP(10); }
  else if (task) task.done = false;
  writeStore(STORE.tasks, tasks);
  renderTasks();
}
function deleteTask(id) {
  writeStore(STORE.tasks, readStore(STORE.tasks, []).filter(t => t.id !== Number(id)));
  renderTasks();
}
function renderTasks() {
  const list = document.getElementById("taskList"); if (!list) return;
  const tasks = readStore(STORE.tasks, []);
  if (!tasks.length) { list.innerHTML = '<div class="empty">هنوز تکلیفی ثبت نشده؛ اولین تکلیفت رو اضافه کن! ✏️</div>'; }
  else list.innerHTML = tasks.map(t => `<div class="list-item">
    <div><strong>${safeText(t.title)}</strong><div class="small">${safeText(t.subject || "درس مشخص نشده")}${t.due ? " · موعد: " + safeText(t.due) : ""}</div></div>
    <div class="row"><button class="btn btn-small ${t.done ? "btn-light" : "btn-primary"}" onclick="toggleTask(${t.id})">${t.done ? "↩ انجام‌نشده" : "✓ انجام شد"}</button><button class="btn btn-small btn-danger" onclick="deleteTask(${t.id})">حذف</button></div>
  </div>`).join("");
  const remaining = document.getElementById("remainingCount");
  if (remaining) remaining.textContent = tasks.filter(t => !t.done).length;
  const completed = document.getElementById("completedCount");
  if (completed) completed.textContent = tasks.filter(t => t.done).length;
}
const questions = [
 {q:"حاصل ۱۲ × ۸ کدام است؟", options:["۸۶","۹۶","۱۰۸","۸۸"], answer:1},
 {q:"کدام کسر با ۱/۲ برابر است؟", options:["۲/۳","۳/۶","۴/۶","۱/۳"], answer:1},
 {q:"محیط مربعی با ضلع ۵ سانتی‌متر چند سانتی‌متر است؟", options:["۱۰","۱۵","۲۰","۲۵"], answer:2},
 {q:"عدد اعشاری ۰٫۷۵ برابر کدام کسر است؟", options:["۱/۴","۱/۲","۳/۴","۲/۵"], answer:2},
 {q:"بزرگ‌ترین مقسوم‌علیه مشترک ۱۲ و ۱۸ کدام است؟", options:["۲","۳","۶","۹"], answer:2}
];
let quizIndex = 0, quizScore = 0, quizAnswers = {};
function initQuiz() { if (!requireUser()) return; renderQuestion(); }
function renderQuestion() {
  const q = questions[quizIndex];
  const qText = document.getElementById("questionText");
  if (!qText) return;
  qText.textContent = `سؤال ${quizIndex + 1} از ${questions.length}: ${q.q}`;
  document.getElementById("quizProgress").style.width = `${(quizIndex / questions.length) * 100}%`;
  document.getElementById("options").innerHTML = q.options.map((opt,i) =>
    `<button type="button" class="quiz-option ${quizAnswers[quizIndex] === i ? "selected" : ""}" onclick="chooseAnswer(${i})">${safeText(opt)}</button>`
  ).join("");
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("nextQuestion").textContent = quizIndex === questions.length - 1 ? "پایان آزمون" : "سؤال بعدی ←";
  document.getElementById("nextQuestion").disabled = quizAnswers[quizIndex] === undefined;
}
function chooseAnswer(index) {
  quizAnswers[quizIndex] = index;
  document.querySelectorAll(".quiz-option").forEach((el,i) => el.classList.toggle("selected", i === index));
  document.getElementById("nextQuestion").disabled = false;
}
function nextQuestion() {
  if (quizAnswers[quizIndex] === undefined) return;
  if (quizIndex < questions.length - 1) { quizIndex++; renderQuestion(); return; }
  finishQuiz();
}
function finishQuiz() {
  quizScore = questions.reduce((sum,q,i) => sum + (quizAnswers[i] === q.answer ? 1 : 0), 0);
  const results = readStore(STORE.quiz, []);
  results.unshift({ date: new Date().toLocaleDateString("fa-IR"), score: quizScore, total: questions.length });
  writeStore(STORE.quiz, results.slice(0,20));
  addXP(quizScore * 5);
  document.getElementById("quizArea").classList.add("hidden");
  document.getElementById("quizResult").classList.remove("hidden");
  document.getElementById("scoreText").textContent = `${quizScore} از ${questions.length}`;
  document.getElementById("scoreMessage").textContent = quizScore === questions.length ? "عالی بود! همه‌ی پاسخ‌ها درست بود 🌟" : "آفرین که تلاش کردی! پاسخ‌ها رو مرور کن و دوباره امتحان کن 💚";
}
function saveHomeworkSubmission(event) {
  event.preventDefault();
  const title = document.getElementById("submissionTitle").value.trim();
  const note = document.getElementById("submissionNote").value.trim();
  if (!title) return;
  const submissions = readStore(STORE.submissions, []);
  submissions.unshift({ title, note, date: new Date().toLocaleString("fa-IR") });
  writeStore(STORE.submissions, submissions);
  renderSubmissions();
  document.getElementById("submissionTitle").value = "";
  document.getElementById("submissionNote").value = "";
  showMessage("submissionMessage", "ثبت تکلیف در همین مرورگر ذخیره شد. برای ارسال فایل، باید سامانه‌ی ارسال فایل جداگانه اضافه شود.");
}
function renderSubmissions() {
  const list = document.getElementById("submissionList"); if (!list) return;
  const submissions = readStore(STORE.submissions, []);
  list.innerHTML = submissions.length ? submissions.map(s => `<div class="list-item"><div><strong>${safeText(s.title)}</strong><div class="small">${safeText(s.date)}</div>${s.note ? `<div>${safeText(s.note)}</div>` : ""}</div><span class="pill">ثبت‌شده</span></div>`).join("") : '<div class="empty">هنوز تکلیفی ثبت نکردی.</div>';
}
function initDashboard() {
  const user = requireUser(); if (!user) return;
  document.getElementById("userDisplay").textContent = `سلام ${user.name} 🌱`;
  document.getElementById("xpDisplay").textContent = readStore(STORE.xp, 0);
  const results = readStore(STORE.quiz, []);
  document.getElementById("quizSummary").textContent = results.length ? `آخرین نتیجه: ${results[0].score} از ${results[0].total}` : "هنوز آزمونی ثبت نشده";
}
