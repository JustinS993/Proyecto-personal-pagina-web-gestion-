/**
 * Gestión de citas — Consultorio de Psicología
 * Datos en LocalStorage (pacientes, citas).
 */

const STORAGE_PATIENTS = 'psicologia-pacientes';
const STORAGE_APPOINTMENTS = 'psicologia-citas';

// --- Estado ---
let patients = [];
let appointments = [];

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
  const today = toDateOnly(new Date());
  const todayAppointments = appointments.filter(
    (a) => a.date === today && a.status !== 'cancelled'
  );
  const weekAppointments = appointments.filter(
    (a) => isThisWeek(a.date) && a.status !== 'cancelled'
  );

  document.getElementById('stat-today').textContent = todayAppointments.length;
  document.getElementById('stat-week').textContent = weekAppointments.length;
  document.getElementById('stat-patients').textContent = patients.length;

  const listEl = document.getElementById('dashboard-today-list');
  const emptyEl = document.getElementById('dashboard-empty');
  listEl.innerHTML = '';

  const sorted = todayAppointments.sort((a, b) =>
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
  const first = sel.options[0];
  sel.innerHTML = '';
  sel.appendChild(first);
  patients.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

function initNewAppointmentForm() {
  const form = document.getElementById('form-appointment');
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

  document.getElementById('btn-new-patient').addEventListener('click', () => {
    openPatientModal();
  });
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
  patients.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'patient-card';
    card.innerHTML = `
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="contact">${p.phone || p.email ? [p.phone && `Tel: ${escapeHtml(p.phone)}`, p.email && escapeHtml(p.email)].filter(Boolean).join(' · ') : 'Sin datos de contacto'}</div>
      <div class="actions">
        <button type="button" class="btn btn-outline btn-edit-patient" data-id="${p.id}">Editar</button>
      </div>
    `;
    card.querySelector('.btn-edit-patient').addEventListener('click', (e) => {
      e.stopPropagation();
      openPatientModal(p.id);
    });
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
const modalPatient = document.getElementById('modal-patient');
const formPatient = document.getElementById('form-patient');

function openPatientModal(patientId) {
  const title = document.getElementById('modal-patient-title');
  formPatient.reset();
  document.getElementById('patient-id').value = '';

  if (patientId) {
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    title.textContent = 'Editar paciente';
    document.getElementById('patient-id').value = p.id;
    document.getElementById('patient-name').value = p.name;
    document.getElementById('patient-phone').value = p.phone || '';
    document.getElementById('patient-email').value = p.email || '';
  } else {
    title.textContent = 'Nuevo paciente';
  }
  modalPatient.showModal();
}

function closePatientModal() {
  modalPatient.close();
}

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

document.getElementById('btn-add-patient').addEventListener('click', () => openPatientModal());

// --- Modal cita ---
const modalAppointment = document.getElementById('modal-appointment');
const detailEl = document.getElementById('appointment-detail');

function openAppointmentModal(aptId) {
  const apt = appointments.find((a) => a.id === aptId);
  if (!apt) return;
  const patient = patients.find((p) => p.id === apt.patientId);

  detailEl.innerHTML = `
    <p><strong>Paciente:</strong> ${escapeHtml(patient ? patient.name : '—')}</p>
    <p><strong>Fecha:</strong> ${formatDate(apt.date)}</p>
    <p><strong>Hora:</strong> ${formatTime(apt.time)}</p>
    <p><strong>Tipo:</strong> ${escapeHtml(apt.type || 'Individual')}</p>
    <p><strong>Estado:</strong> ${statusLabel(apt.status)}</p>
    ${apt.notes ? `<p><strong>Notas:</strong> ${escapeHtml(apt.notes)}</p>` : ''}
  `;

  modalAppointment.dataset.appointmentId = aptId;
  modalAppointment.showModal();

  const cancelBtn = document.getElementById('btn-cancel-appointment');
  const editBtn = document.getElementById('btn-edit-appointment');
  cancelBtn.style.display = apt.status === 'cancelled' ? 'none' : 'inline-flex';
  editBtn.style.display = apt.status === 'cancelled' ? 'none' : 'inline-flex';
}

document.getElementById('btn-cancel-appointment').addEventListener('click', () => {
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

document.getElementById('btn-edit-appointment').addEventListener('click', () => {
  const id = modalAppointment.dataset.appointmentId;
  modalAppointment.close();
  // Por simplicidad, podrías abrir un formulario de edición; aquí redirigimos a citas.
  switchToView('appointments');
  renderAppointmentsList();
});

modalAppointment.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => modalAppointment.close());
});

// --- Filtros citas ---
function initFilters() {
  document.getElementById('filter-status').addEventListener('change', renderAppointmentsList);
  document.getElementById('filter-date').addEventListener('change', renderAppointmentsList);
}

// --- Inicio ---
function init() {
  loadPatients();
  loadAppointments();
  initNav();
  initNewAppointmentForm();
  initFilters();
  fillPatientSelect();
  updateDashboard();
}

init();
