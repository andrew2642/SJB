// app.js — CLEAN FIXED

// ---------- Helpers ----------
function qs(name){ return new URLSearchParams(window.location.search).get(name); }
function go(url){ window.location.href = url; }

function getRole(){ return localStorage.getItem("sjb_role"); } // user|company|admin
function getUser(){
  try { return JSON.parse(localStorage.getItem("sjb_user") || "null"); }
  catch { return null; }
}
function logout(){
  localStorage.removeItem("sjb_role");
  localStorage.removeItem("sjb_user");
  go("index.html");
}

// ---------- Navbar ----------
function initNavActive(){
  const page = location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav a").forEach(a=>{
    if(a.getAttribute("href") === page) a.classList.add("active");
  });

  const dash = document.getElementById("navDash");
  const role = getRole();

  if(dash){
    if(!role){
      dash.style.display = "none";
    }else{
      dash.style.display = "inline-flex";
      dash.setAttribute("href",
        role === "user" ? "dashboard-user.html" :
        role === "company" ? "dashboard-company.html" :
        "dashboard-admin.html"
      );
    }
  }

  const loginLink = document.getElementById("navLogin");
  if(loginLink && getRole()){
    loginLink.textContent = t("logout");
    loginLink.addEventListener("click", (e)=>{ e.preventDefault(); logout(); });
  }
}

// ---------- Language Button ----------
function initLanguageButton(){
  const btn = document.getElementById("langBtn");
  if(!btn) return;

  btn.textContent = (getLang()==="ar") ? "EN" : "AR";

  btn.addEventListener("click", ()=>{
    const next = (getLang()==="ar") ? "en" : "ar";
    setLang(next);
    btn.textContent = (next==="ar") ? "EN" : "AR";

    // rerender dynamic parts
    renderJobs();
    renderJobDetails();
    renderUserDashboard();
    renderCompanyDashboard();
    renderAdminDashboard();
  });
}

// ---------- Location/Type label helpers ----------
function norm(v){ return String(v ?? "").trim().toLowerCase(); }

function locationText(locRaw){
  const loc = norm(locRaw);
  if(loc === "cairo") return t("locCairo");
  if(loc === "alexandria") return t("locAlex");
  if(loc === "giza") return t("locGiza");
  if(loc === "dubai") return t("locDubai");
  if(loc === "riyadh") return t("locRiyadh");
  if(loc === "doha") return t("locDoha");
  if(loc === "london") return t("locLondon");
  if(loc === "berlin") return t("locBerlin");
  if(loc === "toronto") return t("locToronto");
  if(loc === "newyork" || loc === "new york") return t("locNewYork");
  if(loc === "remote") return t("locRemote");
  return String(locRaw || "");
}

function typeText(typeRaw){
  const v = norm(typeRaw).replace(/\s/g, "");
  if(v === "fulltime") return t("typeFull");
  if(v === "parttime") return t("typePart");
  if(v === "internship") return t("typeIntern");
  return String(typeRaw || "");
}

// ---------- Jobs List ----------
function renderJobs(){
  const grid = document.getElementById("jobsGrid");
  if(!grid) return;

  const lang = getLang();
  const loc = document.getElementById("locSelect")?.value || "all";
  const type = document.getElementById("typeSelect")?.value || "all";

  const jobs = (window.SJB_JOBS || []).filter(j=>{
    const locOk = (loc === "all") || (norm(j.location) === norm(loc));
    const typeOk = (type === "all") || (norm(j.type).replace(/\s/g,"") === norm(type));
    return locOk && typeOk;
  });

  if(!jobs.length){
    grid.innerHTML = `
      <div class="panel" style="grid-column:1/-1;text-align:center">
        <b>${lang==="ar" ? "لا توجد وظائف" : "No jobs found"}</b>
      </div>`;
    return;
  }

  grid.innerHTML = jobs.map(j=>{
    const title = j.title?.[lang] || j.title?.en || "";
    const company = j.company?.[lang] || j.company?.en || "";

    return `
      <div class="card">
        <div class="logoBadge"><span>${company.trim().slice(0,1)}</span></div>

        <div>
          <h3>${title}</h3>
          <div class="company">${company}</div>
          <div class="meta">
            <span class="pill green">📍 ${locationText(j.location)}</span>
            <span class="pill">✅ ${typeText(j.type)}</span>
          </div>
        </div>

        <div class="right">
          <div class="salary">${j.salary || ""}</div>
          <button class="btn accent" onclick="go('job.html?id=${j.id}')">${t("viewDetails")}</button>
        </div>
      </div>
    `;
  }).join("");
}

// ---------- Job Details ----------
function renderJobDetails(){
  const wrap = document.getElementById("jobDetailsWrap");
  if(!wrap) return;

  const id = qs("id");
  const job = (window.SJB_JOBS || []).find(j => String(j.id) === String(id));

  if(!id || !job){
    wrap.innerHTML = `
      <div class="panel" style="text-align:center">
        <b>${t("missingIdTitle")}</b>
        <div class="small" style="margin-top:8px">${t("missingIdDesc")}</div>
        <div style="margin-top:12px">
          <button class="btn accent" onclick="go('jobs.html')">${t("backJobs")}</button>
        </div>
      </div>`;
    return;
  }

  const lang = getLang();
  const title = job.title?.[lang] || job.title?.en || "";
  const company = job.company?.[lang] || job.company?.en || "";
  const desc = job.description?.[lang] || job.description?.en || "";
  const reqs = Array.isArray(job.requirements?.[lang]) ? job.requirements[lang] : [];

  wrap.innerHTML = `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
        <div>
          <div class="badgeRole">${company}</div>
          <h2 style="margin:10px 0 0">${title}</h2>
          <div class="meta" style="margin-top:10px">
            <span class="pill green">📍 ${locationText(job.location)}</span>
            <span class="pill">✅ ${typeText(job.type)}</span>
            <span class="pill">💰 ${job.salary || ""}</span>
          </div>
        </div>

        <div class="stack">
          <button class="btn outline" onclick="go('jobs.html')">${t("backJobs")}</button>
          <button class="btn accent" onclick="openApply(${job.id})">${t("applyNow")}</button>
        </div>
      </div>

      <div class="hr"></div>

      <h3>${t("description")}</h3>
      <p style="line-height:1.8;margin-top:8px;font-weight:700;color:#334155">${desc}</p>

      <h3 style="margin-top:16px">${t("requirements")}</h3>
      <ul style="margin-top:8px;font-weight:700;color:#334155;line-height:1.9">
        ${reqs.map(r=>`<li>${r}</li>`).join("")}
      </ul>
    </div>
  `;
}

// ---------- Apply Modal ----------
function openApply(jobId){
  const role = getRole();
  if(!role){
    localStorage.setItem("sjb_redirect", location.href);
    go("auth.html");
    return;
  }
  if(role !== "user"){
    alert(getLang()==="ar" ? "التقديم متاح للطلاب فقط" : "Apply is for students/users only");
    return;
  }

  const overlay = document.getElementById("applyOverlay");
  if(!overlay) return;

  overlay.style.display = "flex";
  document.getElementById("applyJobId").value = String(jobId);

  const u = getUser();
  if(u){
    document.getElementById("appName").value = u.name || "";
    document.getElementById("appEmail").value = u.email || "";
  }
}

function closeApply(){
  const overlay = document.getElementById("applyOverlay");
  if(overlay) overlay.style.display = "none";
}

function submitApplication(e){
  e.preventDefault();

  const lang = getLang();
  if(getRole() !== "user"){
    alert(lang==="ar" ? "مسموح للطلاب فقط" : "Only for users");
    return;
  }

  const app = {
    id: Date.now(),
    jobId: Number(document.getElementById("applyJobId").value),
    name: document.getElementById("appName").value.trim(),
    email: document.getElementById("appEmail").value.trim(),
    phone: document.getElementById("appPhone").value.trim(),
    cvName: (document.getElementById("appCv").files[0]?.name || "")
  };

  if(!app.name || !app.email || !app.phone || !app.cvName){
    alert(lang==="ar" ? "من فضلك اكملي كل البيانات + ارفعي الـ CV" : "Please fill all fields + upload CV");
    return;
  }

  const apps = JSON.parse(localStorage.getItem("sjb_apps") || "[]");
  apps.push(app);
  localStorage.setItem("sjb_apps", JSON.stringify(apps));

  alert(lang==="ar" ? "تم إرسال طلبك بنجاح ✅" : "Application submitted ✅");
  closeApply();
  go("dashboard-user.html");
}

// ---------- Auth ----------
function authInit(){
  const form = document.getElementById("authForm");
  if(!form) return;

  const roleTabs = document.querySelectorAll("[data-role]");
  const roleInput = document.getElementById("authRole");
  const roleLabel = document.getElementById("roleLabel");

  // ✅ location for companies only (if you wrapped it with id="locField")
  function toggleLocationField(role){
    const locField = document.getElementById("locField");
    if(!locField) return;
    locField.style.display = (role === "company") ? "flex" : "none";
  }

  roleTabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      roleTabs.forEach(b=>b.classList.remove("primary"));
      btn.classList.add("primary");

      const r = btn.dataset.role;
      roleInput.value = r;

      roleLabel.textContent =
        r === "user" ? t("roleStudent") :
        r === "company" ? t("roleCompany") :
        t("roleAdmin");

      toggleLocationField(r);
    });
  });
function oauthDemo(provider){
  // role الحالي اللي مختاره فوق (user/company/admin)
  const role = document.getElementById("authRole")?.value || "user";
  const lang = (typeof getLang === "function") ? getLang() : "en";

  const msg = (lang === "ar")
    ? `تسجيل دخول تجريبي عبر ${provider}\nاكتبي الإيميل:`
    : `Demo sign-in via ${provider}\nEnter your email:`;

  const email = prompt(msg, `demo@${provider.toLowerCase()}.com`);
  if(!email) return;

  // بيانات تجريبية
  const userObj = {
    email: email.trim(),
    name: provider + " User",
    location: "",
    role,
    provider
  };

  localStorage.setItem("sjb_role", role);
  localStorage.setItem("sjb_user", JSON.stringify(userObj));

  // لو كان في redirect (جاية من Apply)
  const redirect = localStorage.getItem("sjb_redirect");
  if(redirect){
    localStorage.removeItem("sjb_redirect");
    window.location.href = redirect;
    return;
  }

  // مهم: أسماء صفحات الداشبورد زي ما اتفقنا
  go(
    role === "user" ? "user-dashboard.html" :
    role === "company" ? "company-dashboard.html" :
    "admin-dashboard.html"
  );
}

function bindOAuthButtons(){
  const g = document.getElementById("oauthGoogle");
  const a = document.getElementById("oauthApple");
  const f = document.getElementById("oauthFacebook");
  const l = document.getElementById("oauthLinkedIn");

  if(g) g.addEventListener("click", ()=> oauthDemo("Google"));
  if(a) a.addEventListener("click", ()=> oauthDemo("Apple"));
  if(f) f.addEventListener("click", ()=> oauthDemo("Facebook"));
  if(l) l.addEventListener("click", ()=> oauthDemo("LinkedIn"));
}

  // initial
  toggleLocationField(roleInput.value);

  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    const role = roleInput.value;
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const pass  = document.getElementById("authPassword").value.trim();
    const name  = document.getElementById("authName").value.trim();
    const loc   = document.getElementById("authLocation").value.trim();

    if(!email || !pass){
      alert(getLang()==="ar" ? "اكتبي الإيميل والباسورد" : "Enter email & password");
      return;
    }

    // ✅ Admin restricted
    if(role === "admin" && email !== "admin@sjb.com"){
      alert(getLang()==="ar"
        ? "الأدمن للمسؤول فقط. استخدمي admin@sjb.com"
        : "Admin is restricted. Use admin@sjb.com");
      return;
    }

    localStorage.setItem("sjb_role", role);
    localStorage.setItem("sjb_user", JSON.stringify({ email, name, location: loc, role }));

    const redirect = localStorage.getItem("sjb_redirect");
    if(redirect){
      localStorage.removeItem("sjb_redirect");
      window.location.href = redirect;
      return;
    }

    go(
      role === "user" ? "dashboard-user.html" :
      role === "company" ? "dashboard-company.html" :
      "dashboard-admin.html"
    );
  });
}

// ---------- Dashboards ----------
function renderUserDashboard(){
  const wrap = document.getElementById("userAppsTable");
  if(!wrap) return;

  const apps = JSON.parse(localStorage.getItem("sjb_apps") || "[]");
  const lang = getLang();
  const jobs = window.SJB_JOBS || [];

  if(!apps.length){
    wrap.innerHTML = `
      <div class="panel center" style="text-align:center">
        <b>${lang==="ar" ? "لا توجد تقديمات بعد" : "No applications yet"}</b>
        <div class="small">${lang==="ar" ? "ابدأي وقدّمي على وظيفة" : "Start and apply to a job"}</div>
        <div style="margin-top:10px">
          <button class="btn accent" onclick="go('jobs.html')">${lang==="ar" ? "تصفح الوظائف" : "Browse Jobs"}</button>
        </div>
      </div>
    `;
    return;
  }

  const rows = apps.map(a=>{
    const job = jobs.find(j=>j.id===a.jobId);
    const title = job ? (job.title?.[lang] || job.title?.en) : (lang==="ar" ? "وظيفة" : "Job");
    return `
      <tr>
        <td>${title}</td>
        <td>${a.email}</td>
        <td>${a.phone}</td>
        <td>${a.cvName || "-"}</td>
      </tr>
    `;
  }).join("");

  wrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>${lang==="ar" ? "الوظيفة" : "Job"}</th>
          <th>${lang==="ar" ? "الإيميل" : "Email"}</th>
          <th>${lang==="ar" ? "الموبايل" : "Mobile"}</th>
          <th>CV</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function openPostJob(){
  const overlay = document.getElementById("postOverlay");
  if(overlay) overlay.style.display = "flex";
}
function closePostJob(){
  const overlay = document.getElementById("postOverlay");
  if(overlay) overlay.style.display = "none";
}

function submitPostJob(e){
  e.preventDefault();
  const lang = getLang();

  if(getRole() !== "company"){
    alert(lang==="ar" ? "هذه الصفحة للشركات فقط" : "Company only");
    return;
  }

  const job = {
    id: Date.now(),
    title: document.getElementById("pjTitle").value.trim(),
    location: document.getElementById("pjLocation").value.trim(),
    type: document.getElementById("pjType").value,
    description: document.getElementById("pjDesc").value.trim()
  };

  if(!job.title || !job.location || !job.description){
    alert(lang==="ar" ? "من فضلك اكملي البيانات" : "Please fill all fields");
    return;
  }

  const jobs = JSON.parse(localStorage.getItem("sjb_company_jobs") || "[]");
  jobs.push(job);
  localStorage.setItem("sjb_company_jobs", JSON.stringify(jobs));

  alert(lang==="ar" ? "تم نشر الوظيفة ✅" : "Job posted ✅");
  closePostJob();
  renderCompanyDashboard();
}

function renderCompanyDashboard(){
  const wrap = document.getElementById("companyJobsWrap");
  if(!wrap) return;

  const lang = getLang();
  const u = getUser();
  const jobs = JSON.parse(localStorage.getItem("sjb_company_jobs") || "[]");

  if(!jobs.length){
    wrap.innerHTML = `
      <div class="panel center" style="text-align:center">
        <b>${lang==="ar" ? "لم تقومي بإضافة وظائف بعد" : "No jobs posted yet"}</b>
        <div class="small">${lang==="ar" ? "ابدأي بإضافة وظيفة جديدة" : "Start by posting a new job"}</div>
        <div style="margin-top:10px">
          <button class="btn accent" onclick="openPostJob()">${lang==="ar" ? "إضافة وظيفة" : "Post a Job"}</button>
        </div>
      </div>
    `;
    return;
  }

  const cards = jobs.map(j=>`
    <div class="card">
      <div class="logoBadge"><span>${(u?.name || "C").slice(0,1)}</span></div>
      <div>
        <h3>${j.title}</h3>
        <div class="company">${u?.name || (lang==="ar" ? "شركة" : "Company")}</div>
        <div class="meta">
          <span class="pill green">📍 ${j.location}</span>
          <span class="pill">✅ ${j.type}</span>
        </div>
      </div>
      <div class="right">
        <button class="btn outline" onclick="viewApplicants()">${lang==="ar" ? "عرض المتقدمين" : "View Applicants"}</button>
      </div>
    </div>
  `).join("");

  wrap.innerHTML = `<div class="grid">${cards}</div>`;
}

function viewApplicants(){
  const overlay = document.getElementById("applicantsOverlay");
  const body = document.getElementById("applicantsBody");
  if(!overlay || !body) return;

  overlay.style.display = "flex";

  const lang = getLang();
  const apps = JSON.parse(localStorage.getItem("sjb_apps") || "[]");

  if(!apps.length){
    body.innerHTML = `<div class="small">${lang==="ar" ? "لا يوجد متقدمين بعد" : "No applicants yet"}</div>`;
    return;
  }

  body.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>${lang==="ar" ? "الاسم" : "Name"}</th>
          <th>${lang==="ar" ? "الإيميل" : "Email"}</th>
          <th>${lang==="ar" ? "الموبايل" : "Mobile"}</th>
          <th>CV</th>
        </tr>
      </thead>
      <tbody>
        ${apps.map(a=>`
          <tr>
            <td>${a.name}</td>
            <td>${a.email}</td>
            <td>${a.phone}</td>
            <td>${a.cvName || "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function closeApplicants(){
  const overlay = document.getElementById("applicantsOverlay");
  if(overlay) overlay.style.display = "none";
}

function renderAdminDashboard(){
  const wrap = document.getElementById("adminWrap");
  if(!wrap) return;

  const role = getRole();
  if(role !== "admin"){
    wrap.innerHTML = `
      <div class="panel" style="text-align:center">
        <b>${getLang()==="ar" ? "غير مصرح" : "Access denied"}</b>
        <div class="small" style="margin-top:8px">${getLang()==="ar" ? "هذه الصفحة للأدمن فقط" : "This page is for admin only"}</div>
      </div>
    `;
    return;
  }

  const lang = getLang();
  const apps = JSON.parse(localStorage.getItem("sjb_apps") || "[]");
  const companyJobs = JSON.parse(localStorage.getItem("sjb_company_jobs") || "[]");

  wrap.innerHTML = `
    <div class="panel">
      <div class="stack" style="justify-content:space-between;align-items:center">
        <div>
          <div class="badgeRole">${t("adminManage")}</div>
          <h2 style="margin:10px 0 0">${t("adminSummary")}</h2>
          <div class="small">${lang==="ar" ? "لوحة بسيطة للتخرج (Demo)" : "Simple graduation demo panel"}</div>
        </div>
        <button class="btn outline" onclick="logout()">${t("logout")}</button>
      </div>

      <div class="hr"></div>

      <div class="grid">
        <div class="panel">
          <b>${t("demoJobs")}</b>
          <div style="font-size:34px;font-weight:900;margin-top:8px">${(window.SJB_JOBS || []).length}</div>
        </div>

        <div class="panel">
          <b>${t("companyPostedJobs")}</b>
          <div style="font-size:34px;font-weight:900;margin-top:8px">${companyJobs.length}</div>
        </div>

        <div class="panel">
          <b>${t("applications")}</b>
          <div style="font-size:34px;font-weight:900;margin-top:8px">${apps.length}</div>
        </div>

        <div class="panel">
          <b>${lang==="ar" ? "ملاحظة" : "Note"}</b>
          <div class="small" style="margin-top:8px">
            ${lang==="ar"
              ? "دي نسخة Demo. عشان OAuth حقيقي وقاعدة بيانات لازم Backend."
              : "This is a demo. Real OAuth/DB needs a backend."}
          </div>
        </div>
      </div>
    </div>
  `;
}
// ===== Social Login Buttons (DEMO) =====
function bindOAuthButtons(){
  const form = document.getElementById("authForm");
  const buttons = document.querySelectorAll(".oauthBtn");
  if(!form || !buttons.length) return;

  buttons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const provider = btn.dataset.provider || "social";
      const ts = Date.now();

      const emailEl = document.getElementById("authEmail");
      const passEl  = document.getElementById("authPassword");
      const nameEl  = document.getElementById("authName");

      // Demo fill
      if(emailEl) emailEl.value = `${provider}${ts}@sjb.demo`;
      if(passEl)  passEl.value  = "123456";
      if(nameEl && !nameEl.value.trim()) nameEl.value = provider.toUpperCase() + " User";

      // Submit same as normal login
      if(form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { bubbles:true, cancelable:true }));
    });
  });
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", ()=>{
  // لو حصل Error هنا التحويل والوظائف هتقف، فدي مهمة
  if(typeof applyI18N === "function") applyI18N();

  initLanguageButton();
  initNavActive();

  // pages
  renderJobs();
  renderJobDetails();
  authInit();
  renderUserDashboard();
  renderCompanyDashboard();
  renderAdminDashboard();

  const applyForm = document.getElementById("applyForm");
  if(applyForm) applyForm.addEventListener("submit", submitApplication);

  const pjForm = document.getElementById("postJobForm");
  if(pjForm) pjForm.addEventListener("submit", submitPostJob);
   bindOAuthButtons(); // social buttons demo

});


