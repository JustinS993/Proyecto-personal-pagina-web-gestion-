/**
 * Gestión de citas — Consultorio de Psicología
 * Datos en LocalStorage (pacientes, citas).
 */

const STORAGE_PATIENTS = 'psicologia-pacientes';
const STORAGE_APPOINTMENTS = 'psicologia-citas';
const STORAGE_USERS = 'psicologia-usuarios';
const STORAGE_PSYCHOLOGISTS = 'psicologia-psicologos';
const STORAGE_AUDIT = 'psicologia-audits';

// --- Estado ---
let patients = [];
let appointments = [];
let users = [];
let psychologists = [];
let auditLogs = [];
let currentUser = null;
let calendarCurrentDate = new Date();

// --- Utilidades ---
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadPatients() {
  try {
    const raw = localStorage.getItem(STORAGE_PATIENTS);
    patients = raw ? JSON.parse(raw) : [];
  } catch {
    patients = [];
  }
  return patients;
}

function savePatients() {
  localStorage.setItem(STORAGE_PATIENTS, JSON.stringify(patients));
}

function loadAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_APPOINTMENTS);
    appointments = raw ? JSON.parse(raw) : [];
  } catch {
    appointments = [];
  }
  return appointments;
}

function saveAppointments() {
  localStorage.setItem(STORAGE_APPOINTMENTS, JSON.stringify(appointments));
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    users = raw ? JSON.parse(raw) : [];
  } catch {
    users = [];
  }
  return users;
}

function saveUsers() {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function loadPsychologists() {
  try {
    const raw = localStorage.getItem(STORAGE_PSYCHOLOGISTS);
    psychologists = raw ? JSON.parse(raw) : [];
  } catch {
    psychologists = [];
  }
  return psychologists;
}

function savePsychologists() {
  localStorage.setItem(STORAGE_PSYCHOLOGISTS, JSON.stringify(psychologists));
}

function loadAuditLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT);
    auditLogs = raw ? JSON.parse(raw) : [];
  } catch {
    auditLogs = [];
  }
  return auditLogs;
}

function saveAuditLogs() {
  localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLogs));
}

function addAuditEntry(entry) {
  const base = {
    id: uid(),
    timestamp: new Date().toISOString(),
  };
  auditLogs.unshift(Object.assign(base, entry));
  saveAuditLogs();
}

function initPsychologists() {
  if (psychologists.length === 0) {
    psychologists.push(
      { id: uid(), name: 'Dr. Ana López', specialty: 'Adultos', createdAt: new Date().toISOString() },
      { id: uid(), name: 'Dr. Carlos Ruiz', specialty: 'Infantil y adolescentes', createdAt: new Date().toISOString() }
    );
    savePsychologists();
  }
}

function initUsers() {
  if (users.length === 0) {
    users.push(
      { id: uid(), username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
      { id: uid(), username: 'empleado', password: 'empleado123', role: 'employee', createdAt: new Date().toISOString() }
    );
    saveUsers();
  } else {
    if (!users.some((u) => u.username === 'admin')) {
      users.unshift({ id: uid(), username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() });
      saveUsers();
    }
    if (!users.some((u) => u.username === 'empleado')) {
      users.push({ id: uid(), username: 'empleado', password: 'empleado123', role: 'employee', createdAt: new Date().toISOString() });
      saveUsers();
    }
  }
}

// --- Autenticación ---
const SESSION_KEY = 'psicologia-session';

function initAuth() {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const user = users.find((u) => u.id === parsed.id);
      if (user) {
        currentUser = user;
        showApp();
        return;
      }
    } catch (_) {}
    sessionStorage.removeItem(SESSION_KEY);
  }
  currentUser = null;
  showLogin();
}

function showLogin() {
  const loginEl = document.getElementById('view-login');
  const appEl = document.getElementById('app-main');
  if (loginEl) loginEl.classList.remove('hidden');
  if (appEl) appEl.classList.add('hidden');
}

function showApp() {
  const loginEl = document.getElementById('view-login');
  const appEl = document.getElementById('app-main');
  if (loginEl) loginEl.classList.add('hidden');
  if (appEl) appEl.classList.remove('hidden');
  const userNameEl = document.getElementById('current-user-name');
  const roleEl = document.getElementById('current-user-role');
  if (userNameEl) userNameEl.textContent = currentUser ? currentUser.username : '';
  if (roleEl) {
    roleEl.textContent = currentUser && currentUser.role === 'admin' ? 'Administrador' : 'Empleado';
  }
  document.querySelectorAll('.nav-admin').forEach((el) => {
    el.classList.toggle('hidden', !(currentUser && currentUser.role === 'admin'));
  });
  updateDashboard();
}

function initLoginHandlers() {
  const formLogin = document.getElementById('form-login');
  const btnLogout = document.getElementById('btn-logout');
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      const user = users.find((u) => u.username === username && u.password === password);
      if (!user) {
        if (errorEl) {
          errorEl.textContent = 'Usuario o contraseña incorrectos.';
          errorEl.classList.remove('hidden');
        }
        return;
      }
      if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.textContent = '';
      }
      currentUser = user;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
      showApp();
    });
  }
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      currentUser = null;
      sessionStorage.removeItem(SESSION_KEY);
      showLogin();
    });
  }
}

// --- Gestión de usuarios (Admin) ---
function initUserManagement() {
  const btnAddUser = document.getElementById('btn-add-user');
  const formUser = document.getElementById('form-user');
  const modalUser = document.getElementById('modal-user');
  if (!btnAddUser || !formUser || !modalUser) return;

  btnAddUser.addEventListener('click', () => {
    formUser.reset();
    modalUser.showModal();
  });

  formUser.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    if (users.some((u) => u.username === username)) {
      alert('Ya existe un usuario con ese nombre.');
      return;
    }
    users.push({
      id: uid(),
      username,
      password,
      role,
      createdAt: new Date().toISOString()
    });
    saveUsers();
    modalUser.close();
    renderUsersList();
  });

  modalUser.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => modalUser.close());
  });
}

function renderUsersList() {
  const listEl = document.getElementById('users-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  users.forEach((u) => {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.innerHTML = `
      <div class="user-info">
        <span class="user-name">${escapeHtml(u.username)}</span>
        <span class="user-role">${u.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
      </div>
    `;
    listEl.appendChild(card);
  });
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T12:00:00');
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(str) {
  if (!str || typeof str !== 'string') return '';
  const [h, m] = str.split(':');
  if (!h) return '';
  return `${String(h).padStart(2, '0')}:${m || '00'}`;
}

function toDateOnly(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isToday(dateStr) {
  return dateStr === toDateOnly(new Date());
}

function isThisWeek(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

// --- Navegación ---
function initNav() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const viewId = btn.dataset.view;
      navBtns.forEach((b) => b.classList.remove('active'));
      views.forEach((v) => v.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(`view-${viewId}`);
      if (target) target.classList.add('active');

      if (viewId === 'appointments') renderAppointmentsList();
      if (viewId === 'patients') renderPatientsList();
      if (viewId === 'users') renderUsersList();
      if (viewId === 'psychologists') renderPsychologistsList();
      if (viewId === 'calendar') renderCalendar();
      if (viewId === 'new-appointment') {
        fillPatientSelect();
        fillPsychologistSelect();
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) dateInput.min = toDateOnly(new Date());
      }
      if (viewId === 'my-schedule') {
        fillMyPsychologistSelect();
        renderMyScheduleList();
      }
          if (viewId === 'audit') {
            populateAuditActorOptions();
            renderAuditList();
          }
      if (viewId === 'dashboard') updateDashboard();
    });
  });
}

// --- Dashboard ---
function updateDashboard() {
  const statToday = document.getElementById('stat-today');
  const statWeek = document.getElementById('stat-week');
  const statPatients = document.getElementById('stat-patients');
  const listEl = document.getElementById('dashboard-today-list');
  const emptyEl = document.getElementById('dashboard-empty');
  if (!listEl || !emptyEl) return;

  const today = toDateOnly(new Date());
  const todayAppointments = appointments.filter(
    (a) => a.date && a.date === today && a.status !== 'cancelled'
  );
  const weekAppointments = appointments.filter(
    (a) => a.date && isThisWeek(a.date) && a.status !== 'cancelled'
  );

  if (statToday) statToday.textContent = todayAppointments.length;
  if (statWeek) statWeek.textContent = weekAppointments.length;
  if (statPatients) statPatients.textContent = patients.length;

  listEl.innerHTML = '';

  const sorted = [...todayAppointments].sort((a, b) =>
    (a.time || '00:00').localeCompare(b.time || '00:00')
  );

  if (sorted.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  sorted.forEach((apt) => {
    const card = createAppointmentCard(apt);
    listEl.appendChild(card);
  });
}

function getPsychologistName(psychologistId) {
  if (!psychologistId) return '';
  const p = psychologists.find((x) => x.id === psychologistId);
  return p ? p.name : '';
}

function createAppointmentCard(apt) {
  const patient = patients.find((p) => p.id === apt.patientId);
  const name = patient ? patient.name : 'Paciente desconocido';
  const psychName = getPsychologistName(apt.psychologistId);
  const div = document.createElement('div');
  div.className = 'appointment-card';
  div.dataset.id = apt.id;
  div.innerHTML = `
    <div class="top">
      <div>
        <span class="patient-name">${escapeHtml(name)}</span>
        <div class="meta">${formatDate(apt.date)} · ${formatTime(apt.time)} · ${escapeHtml(apt.type || 'Individual')}${psychName ? ' · ' + escapeHtml(psychName) : ''}</div>
      </div>
      <span class="badge badge-${apt.status || 'pending'}">${statusLabel(apt.status)}</span>
    </div>
  `;
  div.addEventListener('click', () => openAppointmentModal(apt.id));
  return div;
}

function statusLabel(s) {
  const map = { pending: 'Pendiente', completed: 'Completada', cancelled: 'Cancelada' };
  return map[s] || 'Pendiente';
}

function escapeHtml(text) {
  if (!text) return '';
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

// --- Listado de citas ---
function renderAppointmentsList() {
  const listEl = document.getElementById('appointments-list');
  const emptyEl = document.getElementById('appointments-empty');
  if (!listEl || !emptyEl) return;
  const statusFilter = document.getElementById('filter-status').value;
  const dateFilter = document.getElementById('filter-date').value;

  let filtered = [...appointments].filter((a) => a && a.id);
  if (statusFilter !== 'all') filtered = filtered.filter((a) => a.status === statusFilter);
  if (dateFilter) filtered = filtered.filter((a) => a.date === dateFilter);
  filtered.sort((a, b) => {
    const d = (a.date || '').localeCompare(b.date || '');
    return d !== 0 ? d : (a.time || '').localeCompare(b.time || '');
  });

  listEl.innerHTML = '';
  if (filtered.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  filtered.forEach((apt) => listEl.appendChild(createAppointmentCard(apt)));
}

// --- Nueva cita ---
function fillPatientSelect() {
  const sel = document.getElementById('patient-select');
  if (!sel) return;
  const first = sel.options[0];
  sel.innerHTML = '';
  if (first) sel.appendChild(first);
  patients.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

function fillPsychologistSelect(selectedId) {
  const sel = document.getElementById('appointment-psychologist');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Sin asignar —</option>';
  psychologists.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.specialty ? `${p.name} (${p.specialty})` : p.name;
    if (selectedId && p.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

// --- Mi agenda (para psicólogos) ---
function fillMyPsychologistSelect() {
  const sel = document.getElementById('select-my-psychologist');
  if (!sel) return;
  sel.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '— Seleccionar psicólogo —';
  sel.appendChild(defaultOpt);
  psychologists.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.specialty ? `${p.name} (${p.specialty})` : p.name;
    sel.appendChild(opt);
  });
  // if only one psychologist exists, select it by default
  if (psychologists.length === 1) {
    sel.value = psychologists[0].id;
    renderMyScheduleList();
  }
}

function renderMyScheduleList() {
  const listEl = document.getElementById('my-schedule-list');
  const emptyEl = document.getElementById('my-schedule-empty');
  if (!listEl || !emptyEl) return;

  const psychId = document.getElementById('select-my-psychologist').value;
  const dateFilter = document.getElementById('filter-my-date').value;

  if (!psychId) {
    listEl.innerHTML = '<p class="section-hint">Selecciona un psicólogo para ver su agenda.</p>';
    emptyEl.classList.add('hidden');
    return;
  }

  let filtered = appointments.filter((a) => a.psychologistId === psychId);
  if (dateFilter) filtered = filtered.filter((a) => a.date === dateFilter);
  filtered.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));

  listEl.innerHTML = '';
  if (filtered.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  filtered.forEach((apt) => {
    const card = document.createElement('div');
    card.className = 'appointment-card';
    const patient = patients.find((p) => p.id === apt.patientId);
    const name = patient ? patient.name : 'Paciente desconocido';
    card.innerHTML = `
      <div class="top">
        <div>
          <span class="patient-name">${escapeHtml(name)}</span>
          <div class="meta">${formatDate(apt.date)} · ${formatTime(apt.time)} · ${escapeHtml(apt.type || 'Individual')}</div>
        </div>
        <span class="badge badge-${apt.status || 'pending'}">${statusLabel(apt.status)}</span>
      </div>
      <div class="actions">
        ${apt.status !== 'cancelled' ? `<button type="button" class="btn btn-danger btn-cancel-from-my" data-id="${apt.id}">Cancelar</button>` : ''}
        <button type="button" class="btn btn-outline btn-view-apt" data-id="${apt.id}">Ver</button>
      </div>
    `;
    listEl.appendChild(card);
  });

  // attach handlers
  listEl.querySelectorAll('.btn-cancel-from-my').forEach((b) => {
    b.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      openCancelDialogForAppointment(id, {psychologistId: document.getElementById('select-my-psychologist').value});
    });
  });
  listEl.querySelectorAll('.btn-view-apt').forEach((b) => {
    b.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      openAppointmentModal(id);
    });
  });
}

function fillEditPsychologistSelect(selectedId) {
  const sel = document.getElementById('edit-appointment-psychologist');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Sin asignar —</option>';
  psychologists.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.specialty ? `${p.name} (${p.specialty})` : p.name;
    if (selectedId && p.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function initNewAppointmentForm() {
  const form = document.getElementById('form-appointment');
  const btnNewPatient = document.getElementById('btn-new-patient');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const patientId = document.getElementById('patient-select').value;
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const type = document.getElementById('appointment-type').value;
    const notes = document.getElementById('appointment-notes').value.trim();

    if (!patientId || !date || !time) return;

    const psychologistId = document.getElementById('appointment-psychologist').value || undefined;
    const apt = {
      id: uid(),
      patientId,
      date,
      time,
      type,
      notes,
      psychologistId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    appointments.push(apt);
    saveAppointments();
    form.reset();
    switchToView('appointments');
    renderAppointmentsList();
  });

  if (btnNewPatient) btnNewPatient.addEventListener('click', () => openPatientModal());
}

// --- Pacientes ---
function renderPatientsList() {
  const grid = document.getElementById('patients-list');
  const emptyEl = document.getElementById('patients-empty');
  grid.innerHTML = '';

  if (patients.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  const isAdmin = currentUser && currentUser.role === 'admin';
  patients.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'patient-card';
    card.innerHTML = `
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="contact">${p.phone || p.email ? [p.phone && `Tel: ${escapeHtml(p.phone)}`, p.email && escapeHtml(p.email)].filter(Boolean).join(' · ') : 'Sin datos de contacto'}</div>
      <div class="actions">
        <button type="button" class="btn btn-outline btn-edit-patient" data-id="${p.id}">Editar</button>
        ${isAdmin ? `<button type="button" class="btn btn-outline btn-delete-patient" data-id="${p.id}">Eliminar</button>` : ''}
      </div>
    `;
    card.querySelector('.btn-edit-patient').addEventListener('click', (e) => {
      e.stopPropagation();
      openPatientModal(p.id);
    });
    const btnDelete = card.querySelector('.btn-delete-patient');
    if (btnDelete) {
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) {
          patients = patients.filter((x) => x.id !== p.id);
          savePatients();
          appointments = appointments.filter((a) => a.patientId !== p.id);
          saveAppointments();
          renderPatientsList();
          updateDashboard();
        }
      });
    }
    grid.appendChild(card);
  });
}

function switchToView(viewId) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const btn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
  const view = document.getElementById(`view-${viewId}`);
  if (btn) btn.classList.add('active');
  if (view) view.classList.add('active');
}

// --- Modal paciente ---
function openPatientModal(patientId) {
  const modalPatient = document.getElementById('modal-patient');
  const formPatient = document.getElementById('form-patient');
  if (!modalPatient || !formPatient) return;

  const title = document.getElementById('modal-patient-title');
  formPatient.reset();
  const patientIdEl = document.getElementById('patient-id');
  if (patientIdEl) patientIdEl.value = '';

  if (patientId) {
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    title.textContent = 'Editar paciente';
    document.getElementById('patient-id').value = p.id;
    document.getElementById('patient-name').value = p.name;
    document.getElementById('patient-phone').value = p.phone || '';
    document.getElementById('patient-email').value = p.email || '';

    const btnDelete = document.getElementById('btn-delete-patient');
    if (currentUser && currentUser.role === 'admin') {
      btnDelete.classList.remove('hidden');
      btnDelete.dataset.id = p.id;
    } else {
      btnDelete.classList.add('hidden');
    }
  } else {
    if (title) title.textContent = 'Nuevo paciente';
    const btnDel = document.getElementById('btn-delete-patient');
    if (btnDel) btnDel.classList.add('hidden');
  }
  modalPatient.showModal();
}

function closePatientModal() {
  const modalPatient = document.getElementById('modal-patient');
  if (modalPatient) modalPatient.close();
}

function initPatientModal() {
  const formPatient = document.getElementById('form-patient');
  const modalPatient = document.getElementById('modal-patient');
  const btnAddPatient = document.getElementById('btn-add-patient');
  if (!formPatient || !modalPatient) return;

  formPatient.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('patient-id').value;
    const name = document.getElementById('patient-name').value.trim();
    const phone = document.getElementById('patient-phone').value.trim();
    const email = document.getElementById('patient-email').value.trim();

    if (!name) return;

    let savedId = id;
    if (id) {
      const p = patients.find((x) => x.id === id);
      if (p) {
        p.name = name;
        p.phone = phone || undefined;
        p.email = email || undefined;
      }
    } else {
      savedId = uid();
      patients.push({ id: savedId, name, phone: phone || undefined, email: email || undefined });
    }
    savePatients();
    closePatientModal();
    fillPatientSelect();
    const sel = document.getElementById('patient-select');
    if (sel) sel.value = savedId;
    renderPatientsList();
    updateDashboard();
  });

  modalPatient.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closePatientModal);
  });

  const btnDelete = document.getElementById('btn-delete-patient');
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      const id = btnDelete.dataset.id;
      if (!id) return;
      if (confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) {
        patients = patients.filter((x) => x.id !== id);
        savePatients();
        appointments = appointments.filter((a) => a.patientId !== id);
        saveAppointments();
        closePatientModal();
        renderPatientsList();
        updateDashboard();
      }
    });
  }

  if (btnAddPatient) btnAddPatient.addEventListener('click', () => openPatientModal());
}

// --- Modal cita ---
function showAppointmentDetail(apt) {
  const detailEl = document.getElementById('appointment-detail');
  const detailActions = document.getElementById('appointment-detail-actions');
  const formEdit = document.getElementById('form-edit-appointment');
  const titleEl = document.getElementById('modal-appointment-title');
  if (!detailEl || !detailActions || !formEdit) return;

  const patient = patients.find((p) => p.id === apt.patientId);
  const psychName = getPsychologistName(apt.psychologistId);
  detailEl.innerHTML = `
    <p><strong>Paciente:</strong> ${escapeHtml(patient ? patient.name : '—')}</p>
    <p><strong>Fecha:</strong> ${formatDate(apt.date)}</p>
    <p><strong>Hora:</strong> ${formatTime(apt.time)}</p>
    <p><strong>Psicólogo:</strong> ${escapeHtml(psychName || '—')}</p>
    <p><strong>Tipo:</strong> ${escapeHtml(apt.type || 'Individual')}</p>
    <p><strong>Estado:</strong> ${statusLabel(apt.status)}</p>
    ${apt.notes ? `<p><strong>Notas:</strong> ${escapeHtml(apt.notes)}</p>` : ''}
    ${apt.status === 'cancelled' ? renderCancelInfoForAppointment(apt.id) : ''}
  `;
  detailEl.classList.remove('hidden');
  detailActions.classList.remove('hidden');
  formEdit.classList.add('hidden');
  if (titleEl) titleEl.textContent = 'Detalle de cita';

  const cancelBtn = document.getElementById('btn-cancel-appointment');
  const editBtn = document.getElementById('btn-edit-appointment');
  if (cancelBtn) cancelBtn.style.display = apt.status === 'cancelled' ? 'none' : 'inline-flex';
  if (editBtn) editBtn.style.display = apt.status === 'cancelled' ? 'none' : 'inline-flex';
}

function showAppointmentEditForm(apt) {
  const detailEl = document.getElementById('appointment-detail');
  const detailActions = document.getElementById('appointment-detail-actions');
  const formEdit = document.getElementById('form-edit-appointment');
  const titleEl = document.getElementById('modal-appointment-title');
  if (!detailEl || !detailActions || !formEdit) return;

  detailEl.classList.add('hidden');
  detailActions.classList.add('hidden');
  formEdit.classList.remove('hidden');
  if (titleEl) titleEl.textContent = 'Editar cita';

  document.getElementById('edit-appointment-id').value = apt.id;
  fillEditPatientSelect(apt.patientId);
  fillEditPsychologistSelect(apt.psychologistId);
  document.getElementById('edit-appointment-date').value = apt.date || '';
  document.getElementById('edit-appointment-time').value = apt.time || '';
  document.getElementById('edit-appointment-type').value = apt.type || 'individual';
  document.getElementById('edit-appointment-status').value = apt.status || 'pending';
  document.getElementById('edit-appointment-notes').value = apt.notes || '';
}

function fillEditPatientSelect(selectedId) {
  const sel = document.getElementById('edit-patient-select');
  if (!sel) return;
  sel.innerHTML = '';
  sel.required = patients.length > 0;
  if (patients.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '— No hay pacientes —';
    sel.appendChild(opt);
    return;
  }
  patients.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function openAppointmentModal(aptId) {
  const modalAppointment = document.getElementById('modal-appointment');
  if (!modalAppointment) return;

  const apt = appointments.find((a) => a.id === aptId);
  if (!apt) return;

  modalAppointment.dataset.appointmentId = aptId;
  showAppointmentDetail(apt);
  modalAppointment.showModal();
}

function initAppointmentModal() {
  const modalAppointment = document.getElementById('modal-appointment');
  const btnCancel = document.getElementById('btn-cancel-appointment');
  const btnEdit = document.getElementById('btn-edit-appointment');
  const formEdit = document.getElementById('form-edit-appointment');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  if (!modalAppointment) return;

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      const id = modalAppointment.dataset.appointmentId;
      const apt = appointments.find((a) => a.id === id);
      if (apt && apt.status !== 'cancelled') {
        // open cancel reason dialog
        openCancelDialogForAppointment(id, {});
      }
    });
  }

  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      const id = modalAppointment.dataset.appointmentId;
      const apt = appointments.find((a) => a.id === id);
      if (apt) showAppointmentEditForm(apt);
    });
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      const id = modalAppointment.dataset.appointmentId;
      const apt = appointments.find((a) => a.id === id);
      if (apt) showAppointmentDetail(apt);
    });
  }

  if (formEdit) {
    formEdit.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-appointment-id').value;
      const apt = appointments.find((a) => a.id === id);
      const patientId = document.getElementById('edit-patient-select').value;
      if (!apt || !patientId) {
        if (!patientId) alert('Debes seleccionar un paciente. Crea uno si no hay ninguno.');
        return;
      }

      apt.patientId = patientId;
      apt.psychologistId = document.getElementById('edit-appointment-psychologist').value || undefined;
      apt.date = document.getElementById('edit-appointment-date').value;
      apt.time = document.getElementById('edit-appointment-time').value;
      apt.type = document.getElementById('edit-appointment-type').value;
      const prevStatus = apt.status;
      const newStatus = document.getElementById('edit-appointment-status').value;
      // if status is being set to cancelled via edit form, ask for reason
      if (newStatus === 'cancelled' && prevStatus !== 'cancelled') {
        const reason = prompt('Motivo de cancelación (obligatorio):');
        if (!reason || !reason.trim()) return alert('Se requiere un motivo para cancelar la cita.');
        apt.status = 'cancelled';
        addAuditEntry({
          action: 'cancel',
          appointmentId: apt.id,
          appointmentSnapshot: { date: apt.date, time: apt.time, patientId: apt.patientId },
          actorId: currentUser ? currentUser.id : undefined,
          actorName: currentUser ? currentUser.username : 'Sistema',
          actorRole: currentUser ? currentUser.role : 'system',
          reason: reason.trim(),
        });
      } else {
        apt.status = newStatus;
      }
      apt.notes = document.getElementById('edit-appointment-notes').value.trim();

      saveAppointments();
      modalAppointment.close();
      renderAppointmentsList();
      updateDashboard();
      renderCalendar();
    });
  }

  modalAppointment.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => modalAppointment.close());
  });

  // Cancel reason dialog handlers
  const modalCancel = document.getElementById('modal-cancel-reason');
  const formCancel = document.getElementById('form-cancel-reason');
  if (formCancel) {
    formCancel.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('cancel-appointment-id').value;
      const reason = document.getElementById('cancel-reason').value.trim();
      if (!id || !reason) return alert('Se requiere un motivo para cancelar.');
      const apt = appointments.find((a) => a.id === id);
      if (!apt) return;

      apt.status = 'cancelled';
      saveAppointments();

      // determine actor info
      let actorId = currentUser ? currentUser.id : undefined;
      let actorName = currentUser ? currentUser.username : 'Sistema';
      let actorRole = currentUser ? currentUser.role : 'system';

      // if we set psychologist context when opening (e.g., from My Agenda) prefer that
      const psychContext = modalCancel.dataset.psychologistId;
      if (psychContext) {
        const psych = psychologists.find((p) => p.id === psychContext);
        if (psych) {
          actorId = psych.id;
          actorName = psych.name;
          actorRole = 'psychologist';
        }
      }

      addAuditEntry({
        action: 'cancel',
        appointmentId: apt.id,
        appointmentSnapshot: { date: apt.date, time: apt.time, patientId: apt.patientId },
        actorId,
        actorName,
        actorRole,
        reason,
      });

      // close dialogs and refresh
      modalCancel.close();
      document.getElementById('cancel-reason').value = '';
      const parentModal = document.getElementById('modal-appointment');
      if (parentModal) parentModal.close();
      renderAppointmentsList();
      renderMyScheduleList();
      renderCalendar();
      updateDashboard();
    });
  }

  if (modalCancel) {
    modalCancel.querySelectorAll('[data-close-modal]').forEach((btn) => btn.addEventListener('click', () => {
      modalCancel.dataset.psychologistId = '';
      modalCancel.close();
    }));
  }

  function openCancelDialogForAppointment(appointmentId, opts) {
    const modalCancel = document.getElementById('modal-cancel-reason');
    if (!modalCancel) return;
    document.getElementById('cancel-appointment-id').value = appointmentId;
    modalCancel.dataset.psychologistId = opts && opts.psychologistId ? opts.psychologistId : '';
    modalCancel.showModal();
  }
}

// --- Calendario (Admin) ---
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  const monthYearEl = document.getElementById('calendar-month-year');
  if (!container || !monthYearEl) return;

  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();
  monthYearEl.textContent = `${MONTHS_ES[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonthLast = new Date(year, month, 0);
  const prevMonthDays = prevMonthLast.getDate();
  let html = '<div class="calendar-grid">';

  WEEKDAYS.forEach((d) => { html += `<div class="calendar-weekday">${d}</div>`; });

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = 0; i < startOffset; i++) {
    const d = prevMonthDays - startOffset + i + 1;
    const realDateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayApts = appointments.filter((a) => a.date === realDateStr);
    html += buildDayCell(d, realDateStr, dayApts, true);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayApts = appointments.filter((a) => a.date === dateStr);
    html += buildDayCell(d, dateStr, dayApts, false);
  }

  const totalCells = startOffset + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 0; i < remaining; i++) {
    const d = i + 1;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayApts = appointments.filter((a) => a.date === dateStr);
    html += buildDayCell(d, dateStr, dayApts, true);
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.calendar-apt').forEach((el) => {
    el.addEventListener('click', () => {
      const aptId = el.dataset.aptId;
      if (aptId) openAppointmentModal(aptId);
    });
  });
}

function buildDayCell(dayNum, dateStr, dayApts, otherMonth) {
  const today = toDateOnly(new Date());
  const isToday = dateStr === today;
  let cell = `<div class="calendar-day ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">`;
  cell += `<div class="calendar-day-number">${dayNum}</div>`;
  cell += '<div class="calendar-appointments">';
  dayApts.forEach((apt) => {
    const patient = patients.find((p) => p.id === apt.patientId);
    const name = patient ? patient.name : '—';
    const time = formatTime(apt.time);
    const status = apt.status || 'pending';
    cell += `<div class="calendar-apt ${status}" data-apt-id="${apt.id}" title="${escapeHtml(name)} · ${time}">${time} ${escapeHtml(name)}</div>`;
  });
  cell += '</div></div>';
  return cell;
}

function initCalendar() {
  document.getElementById('calendar-prev')?.addEventListener('click', () => {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('calendar-next')?.addEventListener('click', () => {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
    renderCalendar();
  });
}

// --- Psicólogos (Admin) ---
function renderPsychologistsList() {
  const listEl = document.getElementById('psychologists-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  psychologists.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'psychologist-card';
    card.innerHTML = `
      <div class="psychologist-info">
        <div class="psychologist-name">${escapeHtml(p.name)}</div>
        <div class="psychologist-specialty">${escapeHtml(p.specialty || '')}</div>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-outline btn-edit-psychologist" data-id="${p.id}">Editar</button>
      </div>
    `;
    card.querySelector('.btn-edit-psychologist').addEventListener('click', (e) => {
      e.stopPropagation();
      openPsychologistModal(p.id);
    });
    listEl.appendChild(card);
  });
}

function openPsychologistModal(psychologistId) {
  const modal = document.getElementById('modal-psychologist');
  const form = document.getElementById('form-psychologist');
  const title = document.getElementById('modal-psychologist-title');
  const idEl = document.getElementById('psychologist-id');
  const btnDelete = document.getElementById('btn-delete-psychologist');
  if (!modal || !form) return;

  form.reset();
  if (idEl) idEl.value = '';

  if (psychologistId) {
    const p = psychologists.find((x) => x.id === psychologistId);
    if (!p) return;
    title.textContent = 'Editar psicólogo';
    idEl.value = p.id;
    document.getElementById('psychologist-name').value = p.name;
    document.getElementById('psychologist-specialty').value = p.specialty || '';
    if (btnDelete) {
      btnDelete.classList.remove('hidden');
      btnDelete.dataset.id = p.id;
    }
  } else {
    title.textContent = 'Nuevo psicólogo';
    if (btnDelete) btnDelete.classList.add('hidden');
  }
  modal.showModal();
}

function closePsychologistModal() {
  document.getElementById('modal-psychologist')?.close();
}

function initPsychologistModal() {
  const btnAdd = document.getElementById('btn-add-psychologist');
  const form = document.getElementById('form-psychologist');
  const modal = document.getElementById('modal-psychologist');
  const btnDelete = document.getElementById('btn-delete-psychologist');

  btnAdd?.addEventListener('click', () => openPsychologistModal());

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('psychologist-id').value;
    const name = document.getElementById('psychologist-name').value.trim();
    const specialty = document.getElementById('psychologist-specialty').value.trim() || undefined;

    if (!name) return;

    if (id) {
      const p = psychologists.find((x) => x.id === id);
      if (p) {
        p.name = name;
        p.specialty = specialty;
      }
    } else {
      psychologists.push({
        id: uid(),
        name,
        specialty,
        createdAt: new Date().toISOString()
      });
    }
    savePsychologists();
    closePsychologistModal();
    renderPsychologistsList();
  });

  modal?.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closePsychologistModal);
  });

  btnDelete?.addEventListener('click', () => {
    const id = btnDelete.dataset.id;
    if (!id) return;
    if (confirm('¿Eliminar este psicólogo? Las citas asignadas quedarán sin psicólogo.')) {
      psychologists = psychologists.filter((x) => x.id !== id);
      appointments.forEach((a) => { if (a.psychologistId === id) a.psychologistId = undefined; });
      savePsychologists();
      saveAppointments();
      closePsychologistModal();
      renderPsychologistsList();
      renderAppointmentsList();
      renderCalendar();
    }
  });
}

// --- Filtros citas ---
function initFilters() {
  const filterStatus = document.getElementById('filter-status');
  const filterDate = document.getElementById('filter-date');
  if (filterStatus) filterStatus.addEventListener('change', renderAppointmentsList);
  if (filterDate) filterDate.addEventListener('change', renderAppointmentsList);

  // my schedule filters
  const mySel = document.getElementById('select-my-psychologist');
  const myDate = document.getElementById('filter-my-date');
  if (mySel) mySel.addEventListener('change', renderMyScheduleList);
  if (myDate) myDate.addEventListener('change', renderMyScheduleList);

  // audit filters
  const auditPatient = document.getElementById('audit-filter-patient');
  const auditAction = document.getElementById('audit-filter-action');
  const auditActor = document.getElementById('audit-filter-actor');
  const auditFrom = document.getElementById('audit-filter-date-from');
  const auditTo = document.getElementById('audit-filter-date-to');
  const auditClear = document.getElementById('audit-filter-clear');
  if (auditPatient) auditPatient.addEventListener('input', renderAuditList);
  if (auditAction) auditAction.addEventListener('change', renderAuditList);
  if (auditActor) auditActor.addEventListener('change', renderAuditList);
  if (auditFrom) auditFrom.addEventListener('change', renderAuditList);
  if (auditTo) auditTo.addEventListener('change', renderAuditList);
  if (auditClear) auditClear.addEventListener('click', () => { clearAuditFilters(); renderAuditList(); populateAuditActorOptions(); });
}

function renderAuditList() {
  const listEl = document.getElementById('audit-list');
  const emptyEl = document.getElementById('audit-empty');
  if (!listEl || !emptyEl) return;
  // aplicar filtros de UI
  const patientFilter = document.getElementById('audit-filter-patient') ? document.getElementById('audit-filter-patient').value.toLowerCase().trim() : '';
  const actionFilter = document.getElementById('audit-filter-action') ? document.getElementById('audit-filter-action').value : 'all';
  const actorFilter = document.getElementById('audit-filter-actor') ? document.getElementById('audit-filter-actor').value : 'all';
  const dateFrom = document.getElementById('audit-filter-date-from') ? document.getElementById('audit-filter-date-from').value : '';
  const dateTo = document.getElementById('audit-filter-date-to') ? document.getElementById('audit-filter-date-to').value : '';

  listEl.innerHTML = '';
  const logs = (auditLogs || []).filter((log) => {
    if (!log) return false;
    if (patientFilter) {
      const patient = patients.find((p) => p.id === (log.appointmentSnapshot && log.appointmentSnapshot.patientId));
      const patientName = patient ? patient.name.toLowerCase() : '';
      if (!patientName.includes(patientFilter)) return false;
    }
    if (actionFilter && actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (actorFilter && actorFilter !== 'all' && log.actorId !== actorFilter && log.actorRole !== actorFilter) return false;
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00');
      if (new Date(log.timestamp) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      if (new Date(log.timestamp) > to) return false;
    }
    return true;
  });

  if (!logs || logs.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  logs.forEach((log) => {
    const div = document.createElement('div');
    div.className = 'audit-item';
    const patient = patients.find((p) => p.id === (log.appointmentSnapshot && log.appointmentSnapshot.patientId));
    const patientName = patient ? patient.name : '—';
    div.innerHTML = `
      <div class="audit-meta">
        <div><strong>${escapeHtml(log.actorName || '—')}</strong> — <em>${escapeHtml(log.actorRole || '')}</em></div>
        <div><span class="muted">${new Date(log.timestamp).toLocaleString()}</span></div>
      </div>
      <div class="audit-body">
        <div><strong>Acción:</strong> ${escapeHtml(log.action)}</div>
        <div><strong>Cita:</strong> ${formatDate(log.appointmentSnapshot && log.appointmentSnapshot.date)} · ${formatTime(log.appointmentSnapshot && log.appointmentSnapshot.time)} · ${escapeHtml(patientName)}</div>
        ${log.reason ? `<div><strong>Motivo:</strong> ${escapeHtml(log.reason)}</div>` : ''}
      </div>
    `;
    listEl.appendChild(div);
  });
}

function populateAuditActorOptions() {
  const sel = document.getElementById('audit-filter-actor');
  if (!sel) return;
  // mantener la opción 'all'
  const current = sel.value;
  sel.innerHTML = '<option value="all">Todos los actores</option>';
  // agregar roles fijos
  const roles = [{ id: 'admin', name: 'Administrador' }, { id: 'employee', name: 'Empleado' }, { id: 'psychologist', name: 'Psicólogo' }, { id: 'system', name: 'Sistema' }];
  roles.forEach((r) => {
    const o = document.createElement('option');
    o.value = r.id;
    o.textContent = r.name;
    sel.appendChild(o);
  });
  // agregar usuarios (login names)
  users.forEach((u) => {
    const o = document.createElement('option');
    o.value = u.id;
    o.textContent = `${u.username} (${u.role})`;
    sel.appendChild(o);
  });
  // agregar psicólogos por nombre
  psychologists.forEach((p) => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name + ' (Psicólogo)';
    sel.appendChild(o);
  });
  if (current) sel.value = current;
}

function clearAuditFilters() {
  const fp = document.getElementById('audit-filter-patient'); if (fp) fp.value = '';
  const fa = document.getElementById('audit-filter-action'); if (fa) fa.value = 'all';
  const fc = document.getElementById('audit-filter-actor'); if (fc) fc.value = 'all';
  const fd = document.getElementById('audit-filter-date-from'); if (fd) fd.value = '';
  const ft = document.getElementById('audit-filter-date-to'); if (ft) ft.value = '';
}

function renderCancelInfoForAppointment(appointmentId) {
  const log = (auditLogs || []).find((l) => l.action === 'cancel' && l.appointmentId === appointmentId);
  if (!log) return '';
  const ts = new Date(log.timestamp).toLocaleString();
  return `<p class="cancel-info"><strong>Cancelado por:</strong> ${escapeHtml(log.actorName || '—')} <em>(${escapeHtml(log.actorRole || '')})</em> — <span class="muted">${ts}</span></p>${log.reason ? `<p><strong>Motivo:</strong> ${escapeHtml(log.reason)}</p>` : ''}`;
}

// --- Inicio ---
function init() {
  loadUsers();
  initUsers();
  loadPsychologists();
  initPsychologists();
  loadPatients();
  loadAppointments();
  loadAuditLogs();
  initAuth();
  initLoginHandlers();
  initPatientModal();
  initAppointmentModal();
  initUserManagement();
  initPsychologistModal();
  initCalendar();
  initNav();
  initNewAppointmentForm();
  initFilters();
  fillPatientSelect();
  fillPsychologistSelect();
  fillMyPsychologistSelect();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
