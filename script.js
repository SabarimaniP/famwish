/* ══════════════════════════════════════════════
   FAMWISH — SCRIPT.JS  (Production Logic v2)
   Effort → Submission → Approval → Reward
══════════════════════════════════════════════ */

// ── STORAGE LAYER ──────────────────────────────
const DB = {
  get:  (k)    => { try { return JSON.parse(localStorage.getItem('fw_' + k)); } catch { return null; } },
  set:  (k, v) => localStorage.setItem('fw_' + k, JSON.stringify(v)),
  getParents:  () => DB.get('parents')  || [],
  getChildren: () => DB.get('children') || [],
  getTasks:    () => DB.get('tasks')    || [],
  getWishes:   () => DB.get('wishes')   || [],
  getSession:  () => DB.get('session'),
  save: {
    parents:  (d) => DB.set('parents', d),
    children: (d) => DB.set('children', d),
    tasks:    (d) => DB.set('tasks', d),
    wishes:   (d) => DB.set('wishes', d),
    session:  (d) => DB.set('session', d),
  }
};

function genId()         { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function genFamilyCode() { return 'FAM-' + Math.floor(1000 + Math.random() * 9000); }
function ts()            { return new Date().toISOString(); }
function fmtDate(iso)    {
  if (!iso) return 'Today';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}
function fmtRupee(n) { return '₹\u00A0' + Number(n || 0).toLocaleString('en-IN'); }

// ── SESSION ────────────────────────────────────
let session = { role: null, userId: null };

function getCurrentUser() {
  if (!session.userId) return null;
  if (session.role === 'parent')
    return DB.getParents().find(p => p.id === session.userId) || null;
  return DB.getChildren().find(c => c.id === session.userId) || null;
}
function getChildById(id)    { return DB.getChildren().find(c => c.id === id) || null; }
function getPByFam(code)     { return DB.getParents().find(p => p.familyCode === code) || null; }

// ── DEMO SEED ──────────────────────────────────
function seedDemoData() {
  if (DB.getParents().length) return;
  const pId = 'parent_demo', c1 = 'child_alex', c2 = 'child_sarah';
  DB.save.parents([{
    id: pId, name: 'Mr. & Mrs. Johnson', email: 'parent@demo.com',
    password: 'demo', familyName: 'The Johnson Family',
    familyCode: 'FAM-4821', children: [c1, c2]
  }]);
  DB.save.children([
    { id: c1, name: 'Alex Johnson',  age: 13, username: 'alexj',  password: 'demo',
      familyCode: 'FAM-4821', familyName: 'The Johnson Family', balance: 240, pendingBalance: 0, totalEarned: 590 },
    { id: c2, name: 'Sarah Johnson', age: 10, username: 'sarahj', password: 'demo',
      familyCode: 'FAM-4821', familyName: 'The Johnson Family', balance: 120, pendingBalance: 0, totalEarned: 280 },
  ]);
  DB.save.tasks([
    { id:'t1', title:'Clean bedroom',       reward:30, assignedBy:pId, assignedTo:c1, status:'approved',  description:'Clean and tidy your bedroom.',    createdAt:ts(), completedAt:ts() },
    { id:'t2', title:'Finish homework',     reward:20, assignedBy:pId, assignedTo:c1, status:'approved',  description:'Complete all school homework.',    createdAt:ts(), completedAt:ts() },
    { id:'t3', title:'Water the plants',    reward:15, assignedBy:pId, assignedTo:c1, status:'pending',   description:'Water all balcony and indoor plants.', createdAt:ts(), completedAt:null },
    { id:'t4', title:'Wash the dishes',     reward:20, assignedBy:pId, assignedTo:c2, status:'pending',   description:'Wash and dry all dishes after dinner.', createdAt:ts(), completedAt:null },
    { id:'t5', title:'Help with groceries', reward:50, assignedBy:pId, assignedTo:c1, status:'approved',  description:'Help carry groceries from the car.', createdAt:ts(), completedAt:ts() },
    { id:'t6', title:'Set dinner table',    reward:10, assignedBy:pId, assignedTo:c2, status:'submitted', description:'Set the table for dinner tonight.',  createdAt:ts(), completedAt:ts() },
  ]);
  DB.save.wishes([
    { id:'w1', title:'Gaming Console',      emoji:'🎮', targetAmount:800,  savedAmount:240, status:'active',    createdBy:c1, description:'I want this to play with my friends!' },
    { id:'w2', title:'New Bicycle',         emoji:'🚲', targetAmount:1200, savedAmount:180, status:'pending',   createdBy:c2, description:'To ride to school!' },
    { id:'w3', title:'Wireless Headphones', emoji:'🎧', targetAmount:500,  savedAmount:300, status:'active',    createdBy:c1, description:'For music and studying.' },
    { id:'w4', title:'Book Collection',     emoji:'📚', targetAmount:350,  savedAmount:350, status:'completed', createdBy:c2, description:'The complete Harry Potter series.' },
  ]);
}

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  seedDemoData();
  const saved = DB.getSession();
  if (saved && saved.userId) {
    session = saved;
    if (getCurrentUser()) { enterApp(); return; }
  }
  goTo('screen-landing');
});

// ── AUTH SCREENS ───────────────────────────────
function goTo(id) {
  document.querySelectorAll('.auth-screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function registerParent() {
  const name    = gv('parent-reg-name');
  const email   = gv('parent-reg-email');
  const famName = gv('parent-reg-family');
  const pass    = gv('parent-reg-pass');
  const confirm = gv('parent-reg-confirm');
  if (!name||!email||!famName||!pass) return toast('Please fill in all fields','error');
  if (pass !== confirm)               return toast('Passwords do not match','error');
  const parents = DB.getParents();
  if (parents.find(p => p.email===email)) return toast('Email already registered','error');
  const familyCode = genFamilyCode();
  parents.push({ id:genId(), name, email, password:pass, familyName:famName, familyCode, children:[] });
  DB.save.parents(parents);
  toast('Family created! Your code: '+familyCode+' — share with your kids! 🏠','success');
  setTimeout(() => goTo('screen-parent-login'), 2800);
}

function registerChild() {
  const name    = gv('user-reg-name');
  const uname   = gv('user-reg-username');
  const age     = gv('user-reg-age');
  const famCode = gv('user-reg-family-code').toUpperCase();
  const pass    = gv('user-reg-pass');
  if (!name||!uname||!age||!famCode||!pass) return toast('Please fill in all fields','error');
  const parent = getPByFam(famCode);
  if (!parent) return toast('Invalid family code — check with your parent!','error');
  const children = DB.getChildren();
  if (children.find(c => c.username===uname)) return toast('Username already taken','error');
  const child = { id:genId(), name, username:uname, age:parseInt(age), password:pass,
    familyCode:famCode, familyName:parent.familyName, balance:0, pendingBalance:0, totalEarned:0 };
  children.push(child);
  DB.save.children(children);
  parent.children.push(child.id);
  DB.save.parents(DB.getParents().map(p => p.id===parent.id ? parent : p));
  toast('Account created! Welcome to '+parent.familyName+' 🎉','success');
  setTimeout(() => goTo('screen-user-login'), 1800);
}

function loginAsParent() {
  const email = gv('parent-login-email');
  const pass  = gv('parent-login-pass');
  if (!email||!pass) return toast('Please fill in all fields','error');
  const parent = DB.getParents().find(p => p.email===email && p.password===pass);
  if (!parent) return toast('Invalid email or password','error');
  session = { role:'parent', userId:parent.id };
  DB.save.session(session);
  enterApp();
  toast('Welcome back! 🏠','success');
}

function loginAsUser() {
  const uname = gv('user-login-name');
  const pass  = gv('user-login-pass');
  if (!uname||!pass) return toast('Please fill in all fields','error');
  const child = DB.getChildren().find(c => c.username===uname && c.password===pass);
  if (!child) return toast('Invalid username or password','error');
  session = { role:'child', userId:child.id };
  DB.save.session(session);
  enterApp();
  toast('Welcome back, '+child.name.split(' ')[0]+'! 👋','success');
}

function enterApp() {
  document.getElementById('auth-layer').classList.add('hidden');
  document.getElementById('app-layer').classList.remove('hidden');
  const isP = session.role==='parent';
  tog('nav-user',        !isP);
  tog('nav-parent',       isP);
  tog('mobile-nav-user', !isP);
  tog('mobile-nav-parent',isP);
  updateHeader();
  if (isP) switchScreen('screen-parent-home', qs('#nav-parent [data-screen="screen-parent-home"]'));
  else     switchScreen('screen-home',         qs('#nav-user  [data-screen="screen-home"]'));
}

function updateHeader() {
  const u = getCurrentUser(); if (!u) return;
  const h = new Date().getHours();
  const greet = h<12?'Good morning,':h<17?'Good afternoon,':'Good evening,';
  set('header-greeting-text', greet);
  if (session.role==='parent') {
    set('header-user-name', u.familyName);
    set('header-balance', fmtRupee(totalPaidOut()) + ' paid');
  } else {
    set('header-user-name', u.name.split(' ')[0]);
    set('header-balance', fmtRupee(u.balance));
  }
}

function logout() {
  session = {role:null,userId:null};
  DB.save.session(null);
  document.getElementById('auth-layer').classList.remove('hidden');
  document.getElementById('app-layer').classList.add('hidden');
  document.querySelectorAll('#auth-layer input').forEach(i=>i.value='');
  goTo('screen-landing');
}

// ── SCREEN SWITCHING ───────────────────────────
function switchScreen(id, navBtn) {
  document.querySelectorAll('.app-screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');

  if (navBtn) {
    const nid = session.role==='parent' ? '#nav-parent' : '#nav-user';
    document.querySelectorAll(nid+' .nav-item').forEach(b=>b.classList.remove('active'));
    navBtn.classList.add('active');
    const mid = session.role==='parent' ? '#mobile-nav-parent' : '#mobile-nav-user';
    const dItems = [...document.querySelectorAll(nid+' .nav-item')];
    const mItems = [...document.querySelectorAll(mid+' .mobile-nav-item')];
    const idx = dItems.indexOf(navBtn);
    mItems.forEach((b,i)=>b.classList.toggle('active',i===idx));
  }
  closeSidebar();
  const ca = document.querySelector('.content-area');
  if (ca) ca.scrollTop = 0;
  renderScreen(id);
}

function switchMobile(id, btn, isParent) {
  document.querySelectorAll('.app-screen').forEach(s=>s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  const mid = isParent ? '#mobile-nav-parent' : '#mobile-nav-user';
  document.querySelectorAll(mid+' .mobile-nav-item').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const nid = isParent ? '#nav-parent' : '#nav-user';
  const mItems = [...document.querySelectorAll(mid+' .mobile-nav-item')];
  const dItems = [...document.querySelectorAll(nid+' .nav-item')];
  const idx = mItems.indexOf(btn);
  dItems.forEach((b,i)=>b.classList.toggle('active',i===idx));
  closeSidebar();
  const ca = document.querySelector('.content-area');
  if (ca) ca.scrollTop = 0;
  renderScreen(id);
}

// ── RENDER ROUTER ──────────────────────────────
function renderScreen(id) {
  ({
    'screen-home':           renderUserHome,
    'screen-wishes':         renderUserWishes,
    'screen-tasks':          renderUserTasks,
    'screen-profile':        renderUserProfile,
    'screen-parent-home':    renderParentHome,
    'screen-parent-wishes':  renderParentWishes,
    'screen-parent-tasks':   renderParentTasks,
    'screen-parent-profile': renderParentProfile,
  }[id] || (()=>{}))();
}

// ══════════════════════════════════════════════
//  USER RENDERS
// ══════════════════════════════════════════════
function renderUserHome() {
  const child = getCurrentUser(); if (!child) return;
  const tasks  = DB.getTasks().filter(t=>t.assignedTo===child.id);
  const wishes = DB.getWishes().filter(w=>w.createdBy===child.id);
  set('home-balance',       fmtRupee(child.balance));
  set('home-active-wishes', wishes.filter(w=>w.status==='active').length);
  set('home-tasks-done',    tasks.filter(t=>t.status==='approved').length);
  set('home-tasks-pending', tasks.filter(t=>t.status==='pending'||t.status==='submitted').length);

  const topWish = wishes.filter(w=>w.status==='active').sort((a,b)=>b.savedAmount-a.savedAmount)[0];
  const wpEl = document.getElementById('home-top-wish');
  if (wpEl) {
    wpEl.innerHTML = topWish ? `
      <div class="wish-progress-card">
        <div class="wish-progress-info">
          <span class="wish-progress-name">${topWish.emoji} ${esc(topWish.title)}</span>
          <span class="wish-progress-amount">${fmtRupee(topWish.savedAmount)} / ${fmtRupee(topWish.targetAmount)}</span>
        </div>
        <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct(topWish.savedAmount,topWish.targetAmount)}%"></div></div>
        <span class="progress-pct">${pct(topWish.savedAmount,topWish.targetAmount)}% saved</span>
      </div>` : '<p class="empty-state">No active wishes yet.</p>';
  }

  const rtEl = document.getElementById('home-recent-tasks');
  if (rtEl) {
    const recent = tasks.slice(-4).reverse();
    rtEl.innerHTML = recent.length ? recent.map(t=>`
      <div class="task-item">
        <div class="task-check ${t.status==='approved'?'done':''}">${t.status==='approved'?'✓':t.status==='submitted'?'→':'○'}</div>
        <div class="task-info"><span class="task-name">${esc(t.title)}</span><span class="task-reward">+ ${fmtRupee(t.reward)}</span></div>
        ${taskTag(t.status)}
      </div>`).join('') : '<p class="empty-state">No tasks yet.</p>';
  }

  const wgEl = document.getElementById('home-wish-grid');
  if (wgEl) {
    const dw = wishes.filter(w=>w.status!=='completed').slice(0,2);
    wgEl.innerHTML = dw.length ? dw.map(w=>wishMiniCard(w)).join('') : '<p class="empty-state">No wishes yet.</p>';
  }
}

function renderUserWishes() {
  const child = getCurrentUser(); if (!child) return;
  const wishes = DB.getWishes().filter(w=>w.createdBy===child.id);
  const grid = document.getElementById('wishes-grid'); if (!grid) return;
  grid.innerHTML = wishes.length ? wishes.map(w=>`
    <div class="wish-card" data-status="${w.status}" onclick="showWishDetail('${w.id}')">
      <div class="wish-card-img">${w.emoji||'⭐'}</div>
      <div class="wish-card-body">
        <span class="wish-card-name">${esc(w.title)}</span>
        <span class="wish-card-price">${fmtRupee(w.targetAmount)}</span>
        <div class="progress-bar-wrap sm"><div class="progress-bar" style="width:${pct(w.savedAmount,w.targetAmount)}%"></div></div>
        <div class="wish-card-footer">
          <span class="progress-text">${fmtRupee(w.savedAmount)} saved</span>
          ${wishTag(w.status)}
        </div>
      </div>
    </div>`).join('') : '<p class="empty-state" style="grid-column:1/-1">No wishes yet. Add your first wish!</p>';
  document.querySelectorAll('#screen-wishes .filter-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
}

function renderUserTasks() {
  const child = getCurrentUser(); if (!child) return;
  const tasks = DB.getTasks().filter(t=>t.assignedTo===child.id);
  const list  = document.getElementById('tasks-list'); if (!list) return;
  list.innerHTML = tasks.length ? tasks.map(t=>`
    <div class="task-item-full" data-status="${t.status==='approved'?'completed':t.status}" onclick="showTaskDetail('${t.id}')">
      <div class="task-check-lg ${t.status==='approved'?'done':''}">${t.status==='approved'?'✓':t.status==='submitted'?'→':'○'}</div>
      <div class="task-info-full">
        <span class="task-name-lg">${esc(t.title)}</span>
        <span class="task-meta">Assigned by Parent · ${t.completedAt?'Done '+fmtDate(t.completedAt):'Due today'}</span>
      </div>
      <div class="task-right"><span class="task-reward-lg">+ ${fmtRupee(t.reward)}</span>${taskTag(t.status)}</div>
    </div>`).join('') : '<p class="empty-state">No tasks assigned yet.</p>';
  document.querySelectorAll('#screen-tasks .filter-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
}

function renderUserProfile() {
  const c = getCurrentUser(); if (!c) return;
  const tasks  = DB.getTasks().filter(t=>t.assignedTo===c.id);
  const wishes = DB.getWishes().filter(w=>w.createdBy===c.id);
  set('profile-name',       c.name);
  set('profile-family',     c.familyName);
  set('profile-balance',    fmtRupee(c.balance));
  set('profile-wishes-ct',  wishes.length);
  set('profile-tasks-done', tasks.filter(t=>t.status==='approved').length);
  set('profile-earned',     fmtRupee(c.totalEarned));
  set('profile-full-name',  c.name);
  set('profile-username',   '@'+c.username);
  set('profile-age',        c.age);
  set('profile-family-val', c.familyName);
}

// ══════════════════════════════════════════════
//  PARENT RENDERS
// ══════════════════════════════════════════════
function renderParentHome() {
  const parent = getCurrentUser(); if (!parent) return;
  const children = DB.getChildren().filter(c=>parent.children.includes(c.id));
  const allTasks  = DB.getTasks().filter(t=>t.assignedBy===parent.id);
  const childIds  = parent.children;
  const allWishes = DB.getWishes().filter(w=>childIds.includes(w.createdBy));
  const pendingCt = allTasks.filter(t=>t.status==='submitted').length + allWishes.filter(w=>w.status==='pending').length;

  set('ph-total-paid',    fmtRupee(totalPaidOut()));
  set('ph-active-wishes', allWishes.filter(w=>w.status==='active').length);
  set('ph-pending-tasks', pendingCt);
  set('ph-children-ct',  children.length);

  const clEl = document.getElementById('parent-children-list');
  if (clEl) clEl.innerHTML = children.length ? children.map(c=>`
    <div class="child-card">
      <div class="child-avatar">${c.name[0]}</div>
      <div class="child-info"><span class="child-name">${esc(c.name)}</span><span class="child-age">Age ${c.age}</span></div>
      <div class="child-stats">
        <div><span class="cs-label">Balance</span><span class="cs-val accent">${fmtRupee(c.balance)}</span></div>
        <div><span class="cs-label">Tasks</span><span class="cs-val">${DB.getTasks().filter(t=>t.assignedTo===c.id&&t.status==='approved').length} done</span></div>
      </div>
      <span class="tag tag-active">Active</span>
    </div>`).join('') : '<p class="empty-state">No children linked yet.</p>';

  const appEl = document.getElementById('parent-approval-list');
  if (appEl) {
    let html = '';
    allWishes.filter(w=>w.status==='pending').forEach(w=>{
      const child = getChildById(w.createdBy);
      html += `<div class="approval-item">
        <span class="approval-emoji">${w.emoji||'⭐'}</span>
        <div class="approval-info"><span class="approval-name">${esc(w.title)}</span><span class="approval-child">${child?esc(child.name):'?'} · ${fmtRupee(w.targetAmount)}</span></div>
        <div class="approval-actions">
          <button class="btn-approve" onclick="approveWish('${w.id}')">Approve</button>
          <button class="btn-reject"  onclick="rejectWish('${w.id}')">Reject</button>
        </div></div>`;
    });
    allTasks.filter(t=>t.status==='submitted').forEach(t=>{
      const child = getChildById(t.assignedTo);
      html += `<div class="approval-item">
        <span class="approval-emoji">✅</span>
        <div class="approval-info"><span class="approval-name">${esc(t.title)}</span><span class="approval-child">${child?esc(child.name):'?'} · ${fmtRupee(t.reward)} reward</span></div>
        <div class="approval-actions">
          <button class="btn-approve" onclick="approveTask('${t.id}')">Approve</button>
          <button class="btn-reject"  onclick="rejectTask('${t.id}')">Reject</button>
        </div></div>`;
    });
    appEl.innerHTML = html || '<p class="empty-state">No pending approvals 🎉</p>';
  }
}

function renderParentWishes() {
  const parent = getCurrentUser(); if (!parent) return;
  const wishes = DB.getWishes().filter(w=>parent.children.includes(w.createdBy));
  const grid   = document.getElementById('parent-wishes-grid'); if (!grid) return;
  grid.innerHTML = wishes.length ? wishes.map(w=>{
    const child = getChildById(w.createdBy);
    const btns  = w.status==='pending' ? `<div class="approval-actions mt">
      <button class="btn-approve" onclick="approveWish('${w.id}')">Approve</button>
      <button class="btn-reject"  onclick="rejectWish('${w.id}')">Reject</button></div>` : '';
    return `<div class="wish-card-parent" data-status="${w.status}">
      <div class="wish-card-img">${w.emoji||'⭐'}</div>
      <div class="wish-card-body">
        <div class="wish-child-tag">${child?esc(child.name):'?'}</div>
        <span class="wish-card-name">${esc(w.title)}</span>
        <span class="wish-card-price">${fmtRupee(w.targetAmount)}</span>
        <div class="progress-bar-wrap sm"><div class="progress-bar" style="width:${pct(w.savedAmount,w.targetAmount)}%"></div></div>
        <div class="wish-card-footer"><span class="progress-text">${fmtRupee(w.savedAmount)} saved</span>${wishTag(w.status)}</div>
        ${btns}
      </div></div>`;
  }).join('') : '<p class="empty-state" style="grid-column:1/-1">No family wishes yet.</p>';
  document.querySelectorAll('#screen-parent-wishes .filter-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
}

function renderParentTasks() {
  const parent = getCurrentUser(); if (!parent) return;
  const tasks = DB.getTasks().filter(t=>t.assignedBy===parent.id);
  const list  = document.getElementById('parent-tasks-list'); if (!list) return;
  list.innerHTML = tasks.length ? tasks.map(t=>{
    const child = getChildById(t.assignedTo);
    const btns  = t.status==='submitted' ? `<div class="approval-actions" style="margin-top:8px">
      <button class="btn-approve" onclick="approveTask('${t.id}')">Approve</button>
      <button class="btn-reject"  onclick="rejectTask('${t.id}')">Reject</button></div>` : '';
    return `<div class="task-item-full parent" data-status="${t.status}">
      <div class="task-check-lg ${t.status==='approved'?'done':''}">${t.status==='approved'?'✓':t.status==='submitted'?'→':'○'}</div>
      <div class="task-info-full">
        <span class="task-name-lg">${esc(t.title)}</span>
        <span class="task-meta">Assigned to: ${child?esc(child.name):'?'} · ${t.completedAt?'Done '+fmtDate(t.completedAt):'Due today'}</span>
        ${btns}
      </div>
      <div class="task-right"><span class="task-reward-lg">${fmtRupee(t.reward)}</span>${taskTag(t.status)}</div>
    </div>`;
  }).join('') : '<p class="empty-state">No tasks created yet.</p>';
  document.querySelectorAll('#screen-parent-tasks .filter-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
}

function renderParentProfile() {
  const p = getCurrentUser(); if (!p) return;
  const children = DB.getChildren().filter(c=>p.children.includes(c.id));
  const tasks    = DB.getTasks().filter(t=>t.assignedBy===p.id);
  const wishes   = DB.getWishes().filter(w=>p.children.includes(w.createdBy));
  set('pp-name',         p.name);
  set('pp-family',       p.familyName);
  set('pp-children-ct',  children.length);
  set('pp-total-paid',   fmtRupee(totalPaidOut()));
  set('pp-tasks-ct',     tasks.length);
  set('pp-wishes-appr',  wishes.filter(w=>w.status!=='pending'&&w.status!=='rejected').length);
  set('pp-family-name',  p.familyName);
  set('pp-family-code',  p.familyCode);
  set('pp-email',        p.email);
}

// ══════════════════════════════════════════════
//  WISH FLOW
// ══════════════════════════════════════════════
let activeWishId = null;

function showAddWish() {
  document.querySelectorAll('.emoji-opt').forEach((b,i)=>b.classList.toggle('selected',i===0));
  const f = document.getElementById('add-wish-form'); if (f) f.reset();
  switchScreen('screen-add-wish', null);
}

function submitWish() {
  const child = getCurrentUser(); if (!child) return;
  const title  = gv('wish-name');
  const amount = parseFloat(gv('wish-amount'));
  const desc   = gv('wish-desc');
  const emoji  = (document.querySelector('.emoji-opt.selected')||{}).textContent || '⭐';
  if (!title||!amount) return toast('Please fill in wish name and amount','error');
  const wishes = DB.getWishes();
  wishes.push({ id:genId(), title, emoji, targetAmount:amount, savedAmount:0,
    status:'pending', createdBy:child.id, description:desc, createdAt:ts() });
  DB.save.wishes(wishes);
  toast('Wish submitted for parent approval! ⭐','success');
  setTimeout(()=>switchScreen('screen-wishes', qs('#nav-user [data-screen="screen-wishes"]')), 1000);
}

function showWishDetail(id) {
  activeWishId = id;
  const w = DB.getWishes().find(x=>x.id===id); if (!w) return;
  set('wd-emoji',     w.emoji||'⭐');
  set('wd-title',     w.title);
  set('wd-desc',      w.description||'');
  set('wd-target',    fmtRupee(w.targetAmount));
  set('wd-saved',     fmtRupee(w.savedAmount));
  set('wd-remaining', fmtRupee(Math.max(0, w.targetAmount - w.savedAmount)));
  const bar = document.getElementById('wd-bar'); if (bar) bar.style.width = pct(w.savedAmount,w.targetAmount)+'%';
  set('wd-pct', pct(w.savedAmount,w.targetAmount)+'% Complete');
  const stEl = document.getElementById('wd-status-wrap');
  if (stEl) stEl.innerHTML = wishTag(w.status);
  const child = getChildById(w.createdBy);
  const histEl = document.getElementById('wd-history');
  if (histEl && child) {
    const items = DB.getTasks().filter(t=>t.assignedTo===child.id&&t.status==='approved').slice(-5).reverse();
    histEl.innerHTML = items.length ? items.map(t=>`
      <div class="history-item">
        <span class="history-date">${fmtDate(t.completedAt)}</span>
        <span class="history-desc">Completed "${esc(t.title)}"</span>
        <span class="history-amount accent">+ ${fmtRupee(t.reward)}</span>
      </div>`).join('') : '<p class="empty-state">No history yet.</p>';
  }
  switchScreen('screen-wish-detail', null);
}

function approveWish(id) {
  const wishes = DB.getWishes();
  const idx    = wishes.findIndex(w=>w.id===id); if (idx<0) return;
  wishes[idx].status = 'active';
  DB.save.wishes(wishes);
  toast('✓ Wish approved!','success');
  renderParentHome();
  renderParentWishes();
}

function rejectWish(id) {
  const wishes = DB.getWishes();
  const idx    = wishes.findIndex(w=>w.id===id); if (idx<0) return;
  wishes[idx].status = 'rejected';
  DB.save.wishes(wishes);
  toast('Wish rejected.','error');
  renderParentHome();
  renderParentWishes();
}

// ══════════════════════════════════════════════
//  TASK FLOW
// ══════════════════════════════════════════════
let activeTaskId = null;

function showTaskDetail(id) {
  activeTaskId = id;
  const t = DB.getTasks().find(x=>x.id===id); if (!t) return;
  set('td-emoji',      '🌱');
  set('td-title',      t.title);
  set('td-desc',       t.description||'Complete this task as instructed by your parent.');
  set('td-reward',     fmtRupee(t.reward));
  set('td-assignedby', 'Parent');
  set('td-due',        t.completedAt ? 'Done '+fmtDate(t.completedAt) : 'Today');
  const stEl = document.getElementById('td-status-wrap');
  if (stEl) stEl.innerHTML = taskTag(t.status);
  const child  = getChildById(t.assignedTo);
  const topW   = child ? DB.getWishes().filter(w=>w.createdBy===child.id&&w.status==='active')[0] : null;
  const twlEl  = document.getElementById('td-wish-link');
  if (twlEl) twlEl.innerHTML = topW ? `
    <span class="twl-label">Contributes to:</span>
    <div class="twl-wish"><span>${topW.emoji||'⭐'} ${esc(topW.title)}</span><span class="accent">${fmtRupee(t.reward)} closer!</span></div>` :
    '<span class="twl-label">No active wish linked yet.</span>';
  const cta = document.getElementById('td-cta');
  if (cta) {
    cta.disabled = false; cta.style.opacity = '1'; cta.style.cursor = 'pointer';
    if (t.status==='pending') {
      cta.textContent='Submit for Review'; cta.onclick=()=>submitTask(t.id);
    } else if (t.status==='submitted') {
      cta.textContent='⏳ Awaiting Parent Approval'; cta.disabled=true; cta.style.opacity='0.6'; cta.onclick=null;
    } else if (t.status==='approved') {
      cta.textContent='✓ Approved — Reward Received!'; cta.disabled=true; cta.style.opacity='0.6'; cta.onclick=null;
    } else if (t.status==='rejected') {
      cta.textContent='✗ Task Rejected'; cta.disabled=true; cta.style.opacity='0.5'; cta.onclick=null;
    }
  }
  switchScreen('screen-task-detail', null);
}

// Child submits task — NO money yet
function submitTask(taskId) {
  const tasks = DB.getTasks();
  const idx   = tasks.findIndex(t=>t.id===taskId); if (idx<0) return;
  if (tasks[idx].status!=='pending') return toast('Task already submitted','error');
  tasks[idx].status='submitted'; tasks[idx].completedAt=ts();
  DB.save.tasks(tasks);
  toast('Task submitted for parent review! ⏳ Waiting for approval.','success');
  setTimeout(()=>switchScreen('screen-tasks', qs('#nav-user [data-screen="screen-tasks"]')), 1200);
}

// Parent approves task → reward child
function approveTask(taskId) {
  const tasks = DB.getTasks();
  const idx   = tasks.findIndex(t=>t.id===taskId); if (idx<0) return;
  const t = tasks[idx];
  if (t.status!=='submitted') return;
  tasks[idx].status='approved'; tasks[idx].completedAt=ts();
  DB.save.tasks(tasks);
  const children = DB.getChildren();
  const cidx = children.findIndex(c=>c.id===t.assignedTo);
  if (cidx>=0) {
    children[cidx].balance     += t.reward;
    children[cidx].totalEarned += t.reward;
    DB.save.children(children);
    distributeToWishes(t.assignedTo, t.reward);
  }
  updateHeader();
  const childName = (getChildById(t.assignedTo)||{}).name || 'child';
  toast('✓ Task approved! '+fmtRupee(t.reward)+' added to '+childName.split(' ')[0]+'\'s balance 💰','success');
  renderParentHome(); renderParentTasks();
}

function rejectTask(taskId) {
  const tasks = DB.getTasks();
  const idx   = tasks.findIndex(t=>t.id===taskId); if (idx<0) return;
  tasks[idx].status='rejected';
  DB.save.tasks(tasks);
  toast('Task rejected.','error');
  renderParentHome(); renderParentTasks();
}

function distributeToWishes(childId, reward) {
  const wishes = DB.getWishes();
  const active  = wishes.filter(w=>w.createdBy===childId&&w.status==='active');
  if (!active.length) return;
  let rem = reward;
  active.forEach(w=>{
    const share = Math.min(rem, w.targetAmount - w.savedAmount);
    w.savedAmount += share; rem -= share;
    if (w.savedAmount >= w.targetAmount) w.status='completed';
  });
  DB.save.wishes(wishes);
}

// ── ADD TASK (PARENT) ──────────────────────────
function showAddTask() {
  const parent = getCurrentUser(); if (!parent) return;
  const children = DB.getChildren().filter(c=>parent.children.includes(c.id));
  const sel = document.getElementById('task-assign-to');
  if (sel) sel.innerHTML = children.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  const f = document.getElementById('add-task-form'); if (f) f.reset();
  switchScreen('screen-add-task', null);
}

function submitNewTask() {
  const parent = getCurrentUser(); if (!parent) return;
  const title   = gv('task-name');
  const childId = gv('task-assign-to');
  const reward  = parseFloat(gv('task-reward'));
  const desc    = gv('task-desc');
  if (!title||!childId||!reward) return toast('Please fill in all required fields','error');
  const tasks = DB.getTasks();
  tasks.push({ id:genId(), title, reward, description:desc,
    assignedBy:parent.id, assignedTo:childId, status:'pending',
    proof:null, createdAt:ts(), completedAt:null });
  DB.save.tasks(tasks);
  toast('Task created! 📋','success');
  setTimeout(()=>switchScreen('screen-parent-tasks', qs('#nav-parent [data-screen="screen-parent-tasks"]')), 1000);
}

// ── FILTERING ──────────────────────────────────
function filterWishes(status, btn) {
  document.querySelectorAll('#screen-wishes .filter-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#wishes-grid .wish-card').forEach(c=>{
    c.style.display = (status==='all'||c.dataset.status===status) ? '' : 'none';
  });
}
function filterTasks(status, btn) {
  document.querySelectorAll('#screen-tasks .filter-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#tasks-list .task-item-full').forEach(c=>{
    c.style.display = (status==='all'||c.dataset.status===status) ? '' : 'none';
  });
}
function filterParentWishes(status, btn) {
  document.querySelectorAll('#screen-parent-wishes .filter-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#parent-wishes-grid .wish-card-parent').forEach(c=>{
    c.style.display = (status==='all'||c.dataset.status===status) ? '' : 'none';
  });
}
function filterParentTasks(status, btn) {
  document.querySelectorAll('#screen-parent-tasks .filter-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#parent-tasks-list .task-item-full').forEach(c=>{
    c.style.display = (status==='all'||c.dataset.status===status) ? '' : 'none';
  });
}

// ── SIDEBAR ─────────────────────────────────────
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  s.classList.toggle('open');
  let ov = document.querySelector('.sidebar-overlay');
  if (!ov) { ov = document.createElement('div'); ov.className='sidebar-overlay'; ov.onclick=closeSidebar; document.body.appendChild(ov); }
  ov.classList.toggle('show', s.classList.contains('open'));
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const ov = document.querySelector('.sidebar-overlay');
  if (ov) ov.classList.remove('show');
}

// ── EMOJI PICKER ────────────────────────────────
function selectEmoji(btn) {
  document.querySelectorAll('.emoji-opt').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ── HELPERS ────────────────────────────────────
function gv(id)    { const e=document.getElementById(id); return e ? e.value.trim() : ''; }
function set(id,v) { const e=document.getElementById(id); if(e) e.textContent=v; }
function qs(s)     { return document.querySelector(s); }
function tog(id,show) { const e=document.getElementById(id); if(e) e.classList.toggle('hidden',!show); }
function esc(s)    { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function pct(s,t)  { return !t ? 0 : Math.min(100, Math.round((s/t)*100)); }
function totalPaidOut() {
  const p = getCurrentUser(); if (!p) return 0;
  return DB.getTasks().filter(t=>t.assignedBy===p.id&&t.status==='approved').reduce((s,t)=>s+t.reward,0);
}

function wishTag(status) {
  const cls = {pending:'tag-pending',approved:'tag-active',active:'tag-active',completed:'tag-done',rejected:'tag-rejected'}[status]||'tag-pending';
  const lbl = {pending:'Pending',approved:'Approved',active:'Active',completed:'Completed',rejected:'Rejected'}[status]||status;
  return `<span class="tag ${cls}">${lbl}</span>`;
}
function taskTag(status) {
  const cls = {pending:'tag-pending',submitted:'tag-submitted',approved:'tag-done',rejected:'tag-rejected',completed:'tag-done'}[status]||'tag-pending';
  const lbl = {pending:'Pending',submitted:'Submitted',approved:'Approved',rejected:'Rejected',completed:'Completed'}[status]||status;
  return `<span class="tag ${cls}">${lbl}</span>`;
}
function wishMiniCard(w) {
  return `<div class="wish-card" onclick="showWishDetail('${w.id}')">
    <div class="wish-card-img">${w.emoji||'⭐'}</div>
    <div class="wish-card-body">
      <span class="wish-card-name">${esc(w.title)}</span>
      <span class="wish-card-price">${fmtRupee(w.targetAmount)}</span>
      <div class="progress-bar-wrap sm"><div class="progress-bar" style="width:${pct(w.savedAmount,w.targetAmount)}%"></div></div>
      ${wishTag(w.status)}
    </div></div>`;
}

// ── TOAST ──────────────────────────────────────
let _tt = null;
function toast(msg, type='default') {
  let el = document.getElementById('app-toast');
  if (!el) { el=document.createElement('div'); el.id='app-toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg;
  el.className='toast '+(type==='success'?'success':type==='error'?'error':'');
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
  if (_tt) clearTimeout(_tt);
  _tt=setTimeout(()=>el.classList.remove('show'),3500);
}

// Keyboard
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeSidebar(); });
