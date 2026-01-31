/**
 * Gestión de citas — Consultorio de Psicología
 * Datos en LocalStorage (pacientes, citas).
 */

const STORAGE_PATIENTS = 'psicologia-pacientes';
const STORAGE_APPOINTMENTS = 'psicologia-citas';
const STORAGE_USERS = 'psicologia-usuarios';

// --- Estado ---
let patients = [];
let appointments = [];
let users = [];
let currentUser = null;

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

function initUsers() {
  if (users.length === 0) {
    users.push(
      { id: uid(), username: 'admin', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
      { id: uid(), username: 'empleado', password: 'empleado123', role: 'employee', createdAt: new Date().toISOString() }
    );
    saveUsers();
  } else if (!users.some((u) => u.username === 'empleado')) {
    users.push({ id: uid(), username: 'empleado', password: 'empleado123', role: 'employee', createdAt: new Date().toISOString() });
    saveUsers();
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
  const adminNav = document.querySelector('.nav-admin');
  if (adminNav) {
    adminNav.classList.toggle('hidden', !(currentUser && currentUser.role === 'admin'));
  }
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
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(str) {
  if (!str) return '';
  const [h, m] = str.split(':');
  return `${h.padStart(2, '0')}:${m || '00'}`;
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
  const d = new Date(dateStr + 'T12:00:00');
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
      if (viewId === 'new-appointment') {
        fillPatientSelect();
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) dateInput.min = toDateOnly(new Date());
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
    (a) => a.date === today && a.status !== 'cancelled'
  );
  const weekAppointments = appointments.filter(
    (a) => isThisWeek(a.date) && a.status !== 'cancelled'
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

function createAppointmentCard(apt) {
  const patient = patients.find((p) => p.id === apt.patientId);
  const name = patient ? patient.name : 'Paciente desconocido';
  const div = document.createElement('div');
  div.className = 'appointment-card';
  div.dataset.id = apt.id;
  div.innerHTML = `
    <div class="top">
      <div>
        <span class="patient-name">${escapeHtml(name)}</span>
        <div class="meta">${formatDate(apt.date)} · ${formatTime(apt.time)} · ${escapeHtml(apt.type || 'Individual')}</div>
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
  const statusFilter = document.getElementById('filter-status').value;
  const dateFilter = document.getElementById('filter-date').value;

  let filtered = [...appointments];
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

    const apt = {
      id: uid(),
      patientId,
      date,
      time,
      type,
      notes,
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
  detailEl.innerHTML = `
    <p><strong>Paciente:</strong> ${escapeHtml(patient ? patient.name : '—')}</p>
    <p><strong>Fecha:</strong> ${formatDate(apt.date)}</p>
    <p><strong>Hora:</strong> ${formatTime(apt.time)}</p>
    <p><strong>Tipo:</strong> ${escapeHtml(apt.type || 'Individual')}</p>
    <p><strong>Estado:</strong> ${statusLabel(apt.status)}</p>
    ${apt.notes ? `<p><strong>Notas:</strong> ${escapeHtml(apt.notes)}</p>` : ''}
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
      if (apt && apt.status !== 'cancelled' && confirm('¿Cancelar esta cita?')) {
        apt.status = 'cancelled';
        saveAppointments();
        modalAppointment.close();
        renderAppointmentsList();
        updateDashboard();
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
      if (!apt) return;

      apt.patientId = document.getElementById('edit-patient-select').value;
      apt.date = document.getElementById('edit-appointment-date').value;
      apt.time = document.getElementById('edit-appointment-time').value;
      apt.type = document.getElementById('edit-appointment-type').value;
      apt.status = document.getElementById('edit-appointment-status').value;
      apt.notes = document.getElementById('edit-appointment-notes').value.trim();

      saveAppointments();
      modalAppointment.close();
      renderAppointmentsList();
      updateDashboard();
    });
  }

  modalAppointment.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => modalAppointment.close());
  });
}

// --- Filtros citas ---
function initFilters() {
  const filterStatus = document.getElementById('filter-status');
  const filterDate = document.getElementById('filter-date');
  if (filterStatus) filterStatus.addEventListener('change', renderAppointmentsList);
  if (filterDate) filterDate.addEventListener('change', renderAppointmentsList);
}

// --- Inicio ---
function init() {
  loadUsers();
  initUsers();
  loadPatients();
  loadAppointments();
  initAuth();
  initLoginHandlers();
  initPatientModal();
  initAppointmentModal();
  initUserManagement();
  initNav();
  initNewAppointmentForm();
  initFilters();
  fillPatientSelect();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
