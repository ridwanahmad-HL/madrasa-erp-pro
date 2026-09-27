/* ============================================================
   API CONNECTION
   ব্যাকএন্ড সার্ভার অন্য পোর্টে (5000) চলে, তাই পুরো ঠিকানা লিখতে হয়।
   হোস্টিং করার সময় শুধু এই লাইনটা বদলালেই হবে।
   ============================================================ */
const API_BASE = 'http://localhost:5000/api';

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'অজানা সমস্যা' }));
    throw new Error(err.message || 'সার্ভার ত্রুটি');
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ============================================================
   IN-MEMORY DATA (সার্ভার থেকে লোড হওয়ার পর এখানে থাকে)
   ============================================================ */
let db = {
  settings: { name: 'আমার মাদ্রাসা / স্কুল', address: '', phone: '' },
  students: [], teachers: [], attendance: [], fees: [], exams: [], marks: [], notices: []
};

async function loadAll() {
  const [settings, students, teachers, attendance, fees, exams, notices] = await Promise.all([
    api('/settings'),
    api('/students'),
    api('/teachers'),
    api('/attendance'),
    api('/fees'),
    api('/exams'),
    api('/notices'),
  ]);
  db.settings = settings;
  db.students = students.map(normalize);
  db.teachers = teachers.map(normalize);
  db.attendance = attendance.map(normalize);
  db.fees = fees.map(normalize);
  db.exams = exams.map(normalize);
  db.notices = notices.map(normalize);
}
// MongoDB থেকে আসা প্রতিটি রেকর্ডে _id থাকে, আগের কোডের সাথে মিলিয়ে id নামেও রাখা হলো
function normalize(item) {
  item.id = item._id;
  return item;
}

/* ============================================================
   LOGIN
   ============================================================ */
let currentUser = null;
async function doLogin() {
  const role = document.getElementById('roleSelect').value;
  const name = document.getElementById('loginName').value.trim() || 'অতিথি';
  currentUser = { role, name };

  try {
    await loadAll();
  } catch (err) {
    document.getElementById('serverStatus').innerText = '';
    alert('ব্যাকএন্ড সার্ভারের সাথে সংযোগ করা যায়নি।\n\nনিশ্চিত করুন:\n1) backend ফোল্ডারে "npm run dev" চালু আছে\n2) MongoDB সার্ভিস চালু আছে\n\nত্রুটি: ' + err.message);
    return;
  }

  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('whoName').innerText = name;
  document.getElementById('whoRole').innerText = role === 'admin' ? 'অ্যাডমিন' : (role === 'teacher' ? 'শিক্ষক' : 'অভিভাবক');
  buildMenu();
  goPage('dashboard');
  refreshAllDropdowns();
  renderAll();

  document.getElementById('setName').value = db.settings.name;
  document.getElementById('setAddress').value = db.settings.address;
  document.getElementById('setPhone').value = db.settings.phone;
  document.getElementById('serverStatus').innerText = '🟢 সার্ভারের সাথে সংযুক্ত (' + API_BASE + ')';
}
function logout() {
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const MENU_ALL = [
  { id: 'dashboard', label: '📊 ড্যাশবোর্ড', roles: ['admin', 'teacher', 'parent'] },
  { id: 'students', label: '🎓 শিক্ষার্থী', roles: ['admin', 'teacher'] },
  { id: 'teachers', label: '👨‍🏫 শিক্ষক', roles: ['admin'] },
  { id: 'attendance', label: '🗓️ উপস্থিতি', roles: ['admin', 'teacher'] },
  { id: 'fees', label: '💰 ফি ব্যবস্থাপনা', roles: ['admin'] },
  { id: 'exams', label: '📝 পরীক্ষা ও ফলাফল', roles: ['admin', 'teacher'] },
  { id: 'notices', label: '📢 নোটিশ বোর্ড', roles: ['admin', 'teacher', 'parent'] },
  { id: 'documents', label: '🖨️ ডকুমেন্ট', roles: ['admin'] },
  { id: 'settings', label: '⚙️ সেটিংস', roles: ['admin'] },
];
function buildMenu() {
  const nav = document.getElementById('navMenu');
  nav.innerHTML = '';
  MENU_ALL.filter(m => m.roles.includes(currentUser.role)).forEach(m => {
    const a = document.createElement('a');
    a.innerText = m.label; a.dataset.page = m.id;
    a.onclick = () => goPage(m.id);
    nav.appendChild(a);
  });
}
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('#navMenu a').forEach(a => a.classList.toggle('active', a.dataset.page === id));
  renderAll();
}

/* ============================================================
   HELPERS
   ============================================================ */
function getClasses() {
  return [...new Set(db.students.map(s => s.classs).filter(Boolean))];
}
function refreshAllDropdowns() {
  const classes = getClasses();
  ['attClass', 'examClass'].forEach(id => {
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = classes.map(c => `<option value="${c}">${c}</option>`).join('') || '<option value="">শ্রেণি নেই</option>';
    if (classes.includes(cur)) sel.value = cur;
  });
  const clsFilter = document.getElementById('stuClassFilter');
  clsFilter.innerHTML = '<option value="">সকল শ্রেণি</option>' + classes.map(c => `<option value="${c}">${c}</option>`).join('');

  const stuOpts = db.students.map(s => `<option value="${s.id}">${s.roll ? ('[' + s.roll + '] ') : ''}${s.name} (${s.classs || ''})</option>`).join('');
  ['feeStudent', 'idCardStudent', 'marksheetStudent'].forEach(id => {
    document.getElementById(id).innerHTML = stuOpts || '<option value="">কোনো শিক্ষার্থী নেই</option>';
  });

  const examOpts = db.exams.map(e => `<option value="${e.id}">${e.name} (${e.classs})</option>`).join('');
  ['marksExam', 'resultExam', 'marksheetExam'].forEach(id => {
    document.getElementById(id).innerHTML = examOpts || '<option value="">কোনো পরীক্ষা নেই</option>';
  });

  const feeOpts = db.fees.map(f => {
    const s = db.students.find(x => x.id === f.studentId);
    return `<option value="${f.id}">${s ? s.name : '?'} - ${f.type} - ৳${f.amount}</option>`;
  }).join('');
  document.getElementById('receiptFee').innerHTML = feeOpts || '<option value="">কোনো ফি এন্ট্রি নেই</option>';
}
function renderAll() {
  renderDashboard();
  renderStudents();
  renderTeachers();
  loadAttendanceTable();
  renderFees();
  renderNotices();
  renderResultSheet();
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = db.attendance.filter(a => a.date === today);
  const present = todayAtt.filter(a => a.status === 'present').length;
  const due = db.fees.filter(f => f.status === 'বকেয়া').reduce((s, f) => s + Number(f.amount), 0);
  const paid = db.fees.filter(f => f.status === 'পরিশোধিত').reduce((s, f) => s + Number(f.amount), 0);

  document.getElementById('dashStats').innerHTML = `
    <div class="stat"><div class="num">${db.students.length}</div><div class="lbl">মোট শিক্ষার্থী</div></div>
    <div class="stat"><div class="num">${db.teachers.length}</div><div class="lbl">মোট শিক্ষক</div></div>
    <div class="stat"><div class="num">${present}</div><div class="lbl">আজকের উপস্থিতি (এন্ট্রি হয়েছে)</div></div>
    <div class="stat"><div class="num">৳${due}</div><div class="lbl">মোট বকেয়া ফি</div></div>
    <div class="stat"><div class="num">৳${paid}</div><div class="lbl">মোট আদায়কৃত ফি</div></div>
    <div class="stat"><div class="num">${db.notices.length}</div><div class="lbl">মোট নোটিশ</div></div>
  `;

  let bars = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const recs = db.attendance.filter(a => a.date === ds);
    const pct = recs.length ? Math.round(recs.filter(a => a.status === 'present').length / recs.length * 100) : 0;
    bars += `<div class="bar" style="height:${Math.max(pct, 2)}%"><span>${pct ? pct + '%' : ''}</span><em>${d.getDate()}/${d.getMonth() + 1}</em></div>`;
  }
  document.getElementById('attChart').innerHTML = bars;

  const dn = db.notices.slice(-3).reverse().map(n => `<div style="padding:8px 0; border-bottom:1px solid var(--border);"><b>${n.title}</b> <span class="tag-note">(${n.date})</span><br><span style="font-size:13px;">${n.body}</span></div>`).join('');
  document.getElementById('dashNotices').innerHTML = dn || '<div class="empty">কোনো নোটিশ নেই</div>';
}

/* ============================================================
   STUDENTS
   ============================================================ */
function resetStudentForm() {
  document.getElementById('stuEditId').value = '';
  ['stuName', 'stuFather', 'stuMother', 'stuClass', 'stuRoll', 'stuPhone', 'stuDate'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('stuStatus').value = 'সক্রিয়';
  document.getElementById('studentFormTitle').innerText = 'নতুন শিক্ষার্থী ভর্তি';
}
async function saveStudent() {
  const name = document.getElementById('stuName').value.trim();
  if (!name) { alert('নাম আবশ্যক'); return; }
  const editId = document.getElementById('stuEditId').value;
  const obj = {
    name,
    father: document.getElementById('stuFather').value,
    mother: document.getElementById('stuMother').value,
    classs: document.getElementById('stuClass').value,
    roll: document.getElementById('stuRoll').value,
    phone: document.getElementById('stuPhone').value,
    admissionDate: document.getElementById('stuDate').value,
    status: document.getElementById('stuStatus').value,
  };
  try {
    if (editId) await api('/students/' + editId, 'PUT', obj);
    else await api('/students', 'POST', obj);
    db.students = (await api('/students')).map(normalize);
    resetStudentForm();
    refreshAllDropdowns();
    renderAll();
  } catch (err) { alert('সংরক্ষণ ব্যর্থ: ' + err.message); }
}
function editStudent(id) {
  const s = db.students.find(x => x.id === id);
  if (!s) return;
  document.getElementById('stuEditId').value = s.id;
  document.getElementById('stuName').value = s.name;
  document.getElementById('stuFather').value = s.father;
  document.getElementById('stuMother').value = s.mother;
  document.getElementById('stuClass').value = s.classs;
  document.getElementById('stuRoll').value = s.roll;
  document.getElementById('stuPhone').value = s.phone;
  document.getElementById('stuDate').value = s.admissionDate;
  document.getElementById('stuStatus').value = s.status;
  document.getElementById('studentFormTitle').innerText = 'শিক্ষার্থীর তথ্য সম্পাদনা';
  window.scrollTo(0, 0);
}
async function deleteStudent(id) {
  if (!confirm('আপনি কি নিশ্চিত এই শিক্ষার্থীর তথ্য মুছে ফেলতে চান?')) return;
  try {
    await api('/students/' + id, 'DELETE');
    db.students = (await api('/students')).map(normalize);
    refreshAllDropdowns(); renderAll();
  } catch (err) { alert('মুছে ফেলা যায়নি: ' + err.message); }
}
function renderStudents() {
  const q = (document.getElementById('stuSearch').value || '').toLowerCase();
  const cf = document.getElementById('stuClassFilter').value;
  let list = db.students.filter(s =>
    (s.name.toLowerCase().includes(q) || (s.roll || '').toLowerCase().includes(q)) &&
    (!cf || s.classs === cf)
  );
  document.getElementById('studentsTbody').innerHTML = list.length ? list.map(s => `
    <tr>
      <td>${s.roll || '-'}</td><td>${s.name}</td><td>${s.classs || '-'}</td><td>${s.father || '-'}</td><td>${s.phone || '-'}</td>
      <td><span class="badge ${s.status === 'সক্রিয়' ? 'green' : 'amber'}">${s.status}</span></td>
      <td><button class="btn small secondary" onclick="editStudent('${s.id}')">সম্পাদনা</button>
          <button class="btn small danger" onclick="deleteStudent('${s.id}')">মুছুন</button></td>
    </tr>`).join('') : `<tr><td colspan="7" class="empty">কোনো শিক্ষার্থী পাওয়া যায়নি</td></tr>`;
}
document.getElementById('stuSearch') && document.getElementById('stuSearch').addEventListener('input', renderStudents);

/* ============================================================
   TEACHERS
   ============================================================ */
function resetTeacherForm() {
  document.getElementById('teaEditId').value = '';
  ['teaName', 'teaSubject', 'teaPhone', 'teaJoin', 'teaSalary'].forEach(id => document.getElementById(id).value = '');
}
async function saveTeacher() {
  const name = document.getElementById('teaName').value.trim();
  if (!name) { alert('নাম আবশ্যক'); return; }
  const editId = document.getElementById('teaEditId').value;
  const obj = {
    name,
    subject: document.getElementById('teaSubject').value,
    phone: document.getElementById('teaPhone').value,
    join: document.getElementById('teaJoin').value,
    salary: document.getElementById('teaSalary').value,
  };
  try {
    if (editId) await api('/teachers/' + editId, 'PUT', obj);
    else await api('/teachers', 'POST', obj);
    db.teachers = (await api('/teachers')).map(normalize);
    resetTeacherForm(); renderAll();
  } catch (err) { alert('সংরক্ষণ ব্যর্থ: ' + err.message); }
}
function editTeacher(id) {
  const t = db.teachers.find(x => x.id === id); if (!t) return;
  document.getElementById('teaEditId').value = t.id;
  document.getElementById('teaName').value = t.name;
  document.getElementById('teaSubject').value = t.subject;
  document.getElementById('teaPhone').value = t.phone;
  document.getElementById('teaJoin').value = t.join;
  document.getElementById('teaSalary').value = t.salary;
}
async function deleteTeacher(id) {
  if (!confirm('মুছে ফেলতে চান?')) return;
  try {
    await api('/teachers/' + id, 'DELETE');
    db.teachers = (await api('/teachers')).map(normalize);
    renderAll();
  } catch (err) { alert('মুছে ফেলা যায়নি: ' + err.message); }
}
function renderTeachers() {
  document.getElementById('teachersTbody').innerHTML = db.teachers.length ? db.teachers.map(t => `
    <tr><td>${t.name}</td><td>${t.subject || '-'}</td><td>${t.phone || '-'}</td><td>${t.join || '-'}</td><td>৳${t.salary || 0}</td>
    <td><button class="btn small secondary" onclick="editTeacher('${t.id}')">সম্পাদনা</button>
        <button class="btn small danger" onclick="deleteTeacher('${t.id}')">মুছুন</button></td></tr>
  `).join('') : `<tr><td colspan="6" class="empty">কোনো শিক্ষক নেই</td></tr>`;
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('attDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('noticeDate').value = new Date().toISOString().slice(0, 10);
});
function loadAttendanceTable() {
  const cls = document.getElementById('attClass').value;
  const date = document.getElementById('attDate').value;
  const students = db.students.filter(s => s.classs === cls);
  const existing = {};
  db.attendance.filter(a => a.date === date && a.classs === cls).forEach(a => existing[a.studentId] = a.status);
  document.getElementById('attTbody').innerHTML = students.length ? students.map(s => `
    <tr><td>${s.roll || '-'}</td><td>${s.name}</td>
      <td>
        <select id="att_${s.id}">
          <option value="present" ${existing[s.id] === 'present' ? 'selected' : ''}>উপস্থিত</option>
          <option value="absent" ${existing[s.id] === 'absent' ? 'selected' : ''}>অনুপস্থিত</option>
          <option value="leave" ${existing[s.id] === 'leave' ? 'selected' : ''}>ছুটি</option>
        </select>
      </td></tr>
  `).join('') : `<tr><td colspan="3" class="empty">এই শ্রেণিতে কোনো শিক্ষার্থী নেই</td></tr>`;
}
document.getElementById('attDate') && document.getElementById('attDate').addEventListener('change', loadAttendanceTable);
async function saveAttendance() {
  const cls = document.getElementById('attClass').value;
  const date = document.getElementById('attDate').value;
  if (!cls || !date) { alert('তারিখ ও শ্রেণি নির্বাচন করুন'); return; }
  const students = db.students.filter(s => s.classs === cls);
  const records = students.map(s => ({ studentId: s.id, status: document.getElementById('att_' + s.id).value }));
  try {
    await api('/attendance', 'POST', { date, classs: cls, records });
    db.attendance = (await api('/attendance')).map(normalize);
    alert('উপস্থিতি সংরক্ষণ করা হয়েছে');
    renderDashboard();
  } catch (err) { alert('সংরক্ষণ ব্যর্থ: ' + err.message); }
}

/* ============================================================
   FEES
   ============================================================ */
async function saveFee() {
  const studentId = document.getElementById('feeStudent').value;
  if (!studentId) { alert('শিক্ষার্থী নির্বাচন করুন'); return; }
  const obj = {
    studentId,
    type: document.getElementById('feeType').value,
    amount: document.getElementById('feeAmount').value || 0,
    month: document.getElementById('feeMonth').value,
    method: document.getElementById('feeMethod').value,
    status: document.getElementById('feeStatus').value,
    date: new Date().toISOString().slice(0, 10),
  };
  try {
    await api('/fees', 'POST', obj);
    db.fees = (await api('/fees')).map(normalize);
    ['feeAmount', 'feeMonth'].forEach(id => document.getElementById(id).value = '');
    refreshAllDropdowns(); renderAll();
  } catch (err) { alert('সংরক্ষণ ব্যর্থ: ' + err.message); }
}
async function toggleFeeStatus(id) {
  const f = db.fees.find(x => x.id === id);
  const newStatus = f.status === 'পরিশোধিত' ? 'বকেয়া' : 'পরিশোধিত';
  try {
    await api('/fees/' + id, 'PUT', { status: newStatus });
    db.fees = (await api('/fees')).map(normalize);
    renderAll();
  } catch (err) { alert('আপডেট ব্যর্থ: ' + err.message); }
}
async function deleteFee(id) {
  if (!confirm('মুছে ফেলতে চান?')) return;
  try {
    await api('/fees/' + id, 'DELETE');
    db.fees = (await api('/fees')).map(normalize);
    refreshAllDropdowns(); renderAll();
  } catch (err) { alert('মুছে ফেলা যায়নি: ' + err.message); }
}
function renderFees() {
  const filt = document.getElementById('feeFilterStatus').value;
  let list = db.fees.filter(f => !filt || f.status === filt);
  document.getElementById('feesTbody').innerHTML = list.length ? list.slice().reverse().map(f => {
    const s = db.students.find(x => x.id === f.studentId);
    return `<tr><td>${s ? s.name : '?'}</td><td>${f.type}</td><td>${f.month || '-'}</td><td>৳${f.amount}</td><td>${f.method}</td>
    <td><span class="badge ${f.status === 'পরিশোধিত' ? 'green' : 'red'}">${f.status}</span></td>
    <td><button class="btn small secondary" onclick="toggleFeeStatus('${f.id}')">স্ট্যাটাস পরিবর্তন</button>
        <button class="btn small danger" onclick="deleteFee('${f.id}')">মুছুন</button></td></tr>`;
  }).join('') : `<tr><td colspan="7" class="empty">কোনো ফি এন্ট্রি নেই</td></tr>`;
}

/* ============================================================
   EXAMS & MARKS
   ============================================================ */
async function saveExam() {
  const name = document.getElementById('examName').value.trim();
  const classs = document.getElementById('examClass').value;
  const date = document.getElementById('examDate').value;
  if (!name || !classs) { alert('পরীক্ষার নাম ও শ্রেণি আবশ্যক'); return; }
  try {
    await api('/exams', 'POST', { name, classs, date });
    db.exams = (await api('/exams')).map(normalize);
    document.getElementById('examName').value = ''; document.getElementById('examDate').value = '';
    refreshAllDropdowns(); renderAll();
  } catch (err) { alert('সংরক্ষণ ব্যর্থ: ' + err.message); }
}
async function loadMarksTable() {
  const examId = document.getElementById('marksExam').value;
  const exam = db.exams.find(e => e.id === examId);
  if (!exam) { document.getElementById('marksTbody').innerHTML = ''; return; }
  const students = db.students.filter(s => s.classs === exam.classs);
  document.getElementById('marksTbody').innerHTML = students.length ? students.map(s => `
    <tr><td>${s.roll || '-'}</td><td>${s.name}</td><td><input type="number" id="mk_${s.id}" style="width:90px"></td></tr>
  `).join('') : `<tr><td colspan="3" class="empty">এই শ্রেণিতে শিক্ষার্থী নেই</td></tr>`;
}
async function saveMarks() {
  const examId = document.getElementById('marksExam').value;
  const subject = document.getElementById('marksSubject').value.trim();
  const full = document.getElementById('marksFull').value || 100;
  const exam = db.exams.find(e => e.id === examId);
  if (!exam || !subject) { alert('পরীক্ষা ও বিষয় নির্বাচন করুন'); return; }
  const students = db.students.filter(s => s.classs === exam.classs);
  const records = students
    .filter(s => document.getElementById('mk_' + s.id).value !== '')
    .map(s => ({ studentId: s.id, obtained: Number(document.getElementById('mk_' + s.id).value) }));
  try {
    await api('/marks', 'POST', { examId, subject, full: Number(full), records });
    alert('নম্বর সংরক্ষণ করা হয়েছে');
    renderResultSheet();
  } catch (err) { alert('সংরক্ষণ ব্যর্থ: ' + err.message); }
}
function gradeOf(pct) {
  if (pct >= 80) return 'A+'; if (pct >= 70) return 'A'; if (pct >= 60) return 'A-';
  if (pct >= 50) return 'B'; if (pct >= 40) return 'C'; if (pct >= 33) return 'D'; return 'F';
}
async function renderResultSheet() {
  const examId = document.getElementById('resultExam').value;
  const exam = db.exams.find(e => e.id === examId);
  const wrap = document.getElementById('resultSheetWrap');
  if (!exam) { wrap.innerHTML = '<div class="empty">পরীক্ষা নির্বাচন করুন</div>'; return; }

  let marks;
  try { marks = (await api('/marks?examId=' + examId)).map(normalize); }
  catch (err) { wrap.innerHTML = '<div class="empty">নম্বর লোড করা যায়নি</div>'; return; }

  const students = db.students.filter(s => s.classs === exam.classs);
  const subjects = [...new Set(marks.map(m => m.subject))];
  if (!subjects.length) { wrap.innerHTML = '<div class="empty">এই পরীক্ষার কোনো নম্বর এন্ট্রি করা হয়নি</div>'; return; }
  let rows = students.map(s => {
    let total = 0, fullTotal = 0, cells = '';
    subjects.forEach(sub => {
      const m = marks.find(x => x.subject === sub && x.studentId === s.id);
      cells += `<td>${m ? m.obtained : '-'}</td>`;
      if (m) { total += m.obtained; fullTotal += m.full; }
    });
    const pct = fullTotal ? Math.round(total / fullTotal * 100) : 0;
    return { s, cells, total, pct };
  }).sort((a, b) => b.total - a.total);
  let html = `<table><thead><tr><th>মেধাক্রম</th><th>রোল</th><th>নাম</th>${subjects.map(s => `<th>${s}</th>`).join('')}<th>মোট</th><th>%</th><th>গ্রেড</th></tr></thead><tbody>`;
  rows.forEach((r, i) => {
    html += `<tr><td>${i + 1}</td><td>${r.s.roll || '-'}</td><td>${r.s.name}</td>${r.cells}<td>${r.total}</td><td>${r.pct}%</td><td><b>${gradeOf(r.pct)}</b></td></tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

/* ============================================================
   NOTICES
   ============================================================ */
async function saveNotice() {
  const title = document.getElementById('noticeTitle').value.trim();
  const body = document.getElementById('noticeBody').value.trim();
  const date = document.getElementById('noticeDate').value;
  const urgent = document.getElementById('noticeUrgent').value;
  if (!title) { alert('শিরোনাম আবশ্যক'); return; }
  try {
    await api('/notices', 'POST', { title, body, date, urgent });
    db.notices = (await api('/notices')).map(normalize);
    document.getElementById('noticeTitle').value = ''; document.getElementById('noticeBody').value = '';
    renderAll();
  } catch (err) { alert('প্রকাশ ব্যর্থ: ' + err.message); }
}
async function deleteNotice(id) {
  if (!confirm('মুছে ফেলতে চান?')) return;
  try {
    await api('/notices/' + id, 'DELETE');
    db.notices = (await api('/notices')).map(normalize);
    renderAll();
  } catch (err) { alert('মুছে ফেলা যায়নি: ' + err.message); }
}
function renderNotices() {
  const list = document.getElementById('noticesList');
  list.innerHTML = db.notices.length ? db.notices.slice().reverse().map(n => `
    <div style="padding:10px 0; border-bottom:1px solid var(--border);">
      <div style="display:flex; justify-content:space-between;">
        <b>${n.urgent === 'yes' ? '🔴 ' : ''}${n.title}</b>
        <span class="tag-note">${n.date}</span>
      </div>
      <div style="font-size:13.5px; margin-top:4px;">${n.body}</div>
      ${currentUser && currentUser.role === 'admin' ? `<button class="btn small danger" style="margin-top:6px;" onclick="deleteNotice('${n.id}')">মুছুন</button>` : ''}
    </div>
  `).join('') : '<div class="empty">কোনো নোটিশ নেই</div>';
}

/* ============================================================
   DOCUMENT PRINTING
   ============================================================ */
function printIdCard() {
  const id = document.getElementById('idCardStudent').value;
  const s = db.students.find(x => x.id === id);
  if (!s) { alert('শিক্ষার্থী নির্বাচন করুন'); return; }
  document.getElementById('printArea').innerHTML = `
    <div class="idcard">
      <h4>${db.settings.name}</h4>
      <div class="tag-note">শিক্ষার্থী পরিচয়পত্র</div>
      <table>
        <tr><td><b>নাম</b></td><td>: ${s.name}</td></tr>
        <tr><td><b>পিতার নাম</b></td><td>: ${s.father || '-'}</td></tr>
        <tr><td><b>শ্রেণি</b></td><td>: ${s.classs || '-'}</td></tr>
        <tr><td><b>রোল</b></td><td>: ${s.roll || '-'}</td></tr>
        <tr><td><b>মোবাইল</b></td><td>: ${s.phone || '-'}</td></tr>
        <tr><td><b>ভর্তির তারিখ</b></td><td>: ${s.admissionDate || '-'}</td></tr>
      </table>
    </div>`;
  window.print();
}
function printReceipt() {
  const id = document.getElementById('receiptFee').value;
  const f = db.fees.find(x => x.id === id);
  if (!f) { alert('ফি এন্ট্রি নির্বাচন করুন'); return; }
  const s = db.students.find(x => x.id === f.studentId);
  document.getElementById('printArea').innerHTML = `
    <div class="receipt">
      <h4 style="text-align:center; margin:0;">${db.settings.name}</h4>
      <p style="text-align:center; margin:2px 0 12px; font-size:12px;">${db.settings.address || ''}</p>
      <p style="text-align:center; font-weight:700;">বেতন/ফি রশিদ</p>
      <table>
        <tr><td>শিক্ষার্থীর নাম</td><td>: ${s ? s.name : '?'}</td></tr>
        <tr><td>শ্রেণি</td><td>: ${s ? s.classs : '-'}</td></tr>
        <tr><td>ফি এর ধরন</td><td>: ${f.type}</td></tr>
        <tr><td>বিবরণ</td><td>: ${f.month || '-'}</td></tr>
        <tr><td>পরিমাণ</td><td>: ৳${f.amount}</td></tr>
        <tr><td>মাধ্যম</td><td>: ${f.method}</td></tr>
        <tr><td>তারিখ</td><td>: ${f.date}</td></tr>
        <tr><td>অবস্থা</td><td>: ${f.status}</td></tr>
      </table>
    </div>`;
  window.print();
}
async function printMarksheet() {
  const examId = document.getElementById('marksheetExam').value;
  const studentId = document.getElementById('marksheetStudent').value;
  const exam = db.exams.find(e => e.id === examId);
  const s = db.students.find(x => x.id === studentId);
  if (!exam || !s) { alert('পরীক্ষা ও শিক্ষার্থী নির্বাচন করুন'); return; }
  const allMarks = (await api('/marks?examId=' + examId)).map(normalize);
  const marks = allMarks.filter(m => m.studentId === studentId);
  let total = 0, fullTotal = 0;
  let rows = marks.map(m => { total += m.obtained; fullTotal += m.full; return `<tr><td>${m.subject}</td><td>${m.full}</td><td>${m.obtained}</td></tr>`; }).join('');
  const pct = fullTotal ? Math.round(total / fullTotal * 100) : 0;
  document.getElementById('printArea').innerHTML = `
    <div class="marksheet">
      <h4 style="text-align:center;">${db.settings.name}</h4>
      <p style="text-align:center; font-weight:700;">মার্কশিট — ${exam.name}</p>
      <table>
        <tr><td><b>নাম</b></td><td>: ${s.name}</td></tr>
        <tr><td><b>শ্রেণি</b></td><td>: ${s.classs || '-'}</td></tr>
        <tr><td><b>রোল</b></td><td>: ${s.roll || '-'}</td></tr>
      </table>
      <table style="margin-top:10px;">
        <thead><tr><th>বিষয়</th><th>পূর্ণমান</th><th>প্রাপ্ত নম্বর</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3">কোনো নম্বর নেই</td></tr>'}</tbody>
      </table>
      <p style="margin-top:10px;"><b>মোট: ${total} / ${fullTotal} (${pct}%) — গ্রেড: ${gradeOf(pct)}</b></p>
    </div>`;
  window.print();
}

/* ============================================================
   SETTINGS / BACKUP
   ============================================================ */
async function saveSettings() {
  const obj = {
    name: document.getElementById('setName').value || db.settings.name,
    address: document.getElementById('setAddress').value,
    phone: document.getElementById('setPhone').value,
  };
  try {
    db.settings = await api('/settings', 'PUT', obj);
    alert('সংরক্ষণ করা হয়েছে');
  } catch (err) { alert('সংরক্ষণ ব্যর্থ: ' + err.message); }
}
async function exportData() {
  try {
    const [settings, students, teachers, attendance, fees, exams, notices] = await Promise.all([
      api('/settings'), api('/students'), api('/teachers'), api('/attendance'),
      api('/fees'), api('/exams'), api('/notices'),
    ]);
    const backup = { settings, students, teachers, attendance, fees, exams, notices };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'madrasa_erp_backup_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
  } catch (err) { alert('ব্যাকআপ তৈরি ব্যর্থ: ' + err.message); }
}
