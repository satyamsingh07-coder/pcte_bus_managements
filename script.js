/* =====================================================================
   PCTE BUS MANAGEMENT SYSTEM  –  DSA Project
   PCTE Group of Institutes, Ludhiana
   ---------------------------------------------------------------------
   Data Structures / Algorithms used:
   1. Singly Linked List  -> stops of a bus route
   2. Queue (FIFO)        -> waiting list when a bus is full
   3. Stack (LIFO)        -> Undo history
   4. Merge Sort          -> sorting the bus table
   5. Binary Search       -> exact search by bus number
   6. Hash Map (Map)      -> O(1) lookup of students/buses by id
   7. Array / 2D grid     -> seat allocation
   ===================================================================== */

/* ============================ DATA STRUCTURES ============================ */

class ListNode { constructor(val) { this.val = val; this.next = null; } }

class LinkedList {
  constructor() { this.head = null; this.size = 0; }
  append(val) {
    const n = new ListNode(val);
    if (!this.head) this.head = n;
    else { let c = this.head; while (c.next) c = c.next; c.next = n; }
    this.size++;
  }
  insertAfter(target, val) {
    let c = this.head;
    while (c && c.val !== target) c = c.next;
    if (!c) return false;
    const n = new ListNode(val); n.next = c.next; c.next = n; this.size++;
    return true;
  }
  remove(val) {
    if (!this.head) return false;
    if (this.head.val === val) { this.head = this.head.next; this.size--; return true; }
    let c = this.head;
    while (c.next && c.next.val !== val) c = c.next;
    if (!c.next) return false;
    c.next = c.next.next; this.size--; return true;
  }
  toArray() { const a = []; let c = this.head; while (c) { a.push(c.val); c = c.next; } return a; }
  static from(arr) { const l = new LinkedList(); arr.forEach(v => l.append(v)); return l; }
}

class Queue {                       // works directly on an array so it can be saved
  constructor(arr) { this.items = arr; }
  enqueue(x) { this.items.push(x); }
  dequeue() { return this.items.shift(); }
  removeAt(i) { return this.items.splice(i, 1)[0]; }
  get size() { return this.items.length; }
}

class Stack {
  constructor() { this.items = []; }
  push(x) { this.items.push(x); if (this.items.length > 25) this.items.shift(); }
  pop() { return this.items.pop(); }
  get size() { return this.items.length; }
}

function mergeSort(arr, cmp) {
  if (arr.length <= 1) return arr;
  const mid = arr.length >> 1;
  const L = mergeSort(arr.slice(0, mid), cmp), R = mergeSort(arr.slice(mid), cmp);
  const out = []; let i = 0, j = 0;
  while (i < L.length && j < R.length) out.push(cmp(L[i], R[j]) <= 0 ? L[i++] : R[j++]);
  return out.concat(L.slice(i), R.slice(j));
}

function binarySearch(sortedArr, key, getKey) {
  let lo = 0, hi = sortedArr.length - 1, steps = 0;
  while (lo <= hi) {
    steps++;
    const mid = (lo + hi) >> 1, k = getKey(sortedArr[mid]);
    if (k === key) return { item: sortedArr[mid], steps };
    if (k < key) lo = mid + 1; else hi = mid - 1;
  }
  return { item: null, steps };
}

/* ============================ STATE / STORAGE ============================ */

const KEY = 'pcte_bus_system_v1';
const history = new Stack();
let S = load();
let currentSec = 'dashboard';

function defaultSettings() {
  return {
    inst: 'PCTE Group of Institutes', title: 'Bus Management System', brand: 'PCTE Transport',
    color: '#16245c', accent: '#f57c00',
    currency: '₹', prefix: 'PCTE-',
    defCapacity: 30, defTime: '07:30', defFare: 1500,
    courses: 'BCA, MCA, B.Tech CSE, B.Tech ECE, B.Tech ME, M.Tech, MBA, BBA, Diploma',
    username: 'admin', password: 'admin123'
  };
}
const courseList = () => S.settings.courses.split(',').map(c => c.trim()).filter(Boolean);

function seed() {
  return {
    nid: 100,
    buses: [
      { id: 1, no: 'PB10-PC-101', driver: 'Gurmeet Singh',  phone: '9800000001', capacity: 30, time: '07:15', fare: 1800,
        route: 'City Centre → PCTE Campus', stops: ['Clock Tower', 'Ghumar Mandi', 'Model Town', 'Ferozepur Road', 'PCTE Campus'] },
      { id: 2, no: 'PB10-PC-102', driver: 'Harjinder Pal',  phone: '9800000002', capacity: 24, time: '07:30', fare: 1600,
        route: 'Sarabha Nagar → PCTE Campus', stops: ['Sarabha Nagar', 'Pakhowal Road', 'Jamalpur', 'PCTE Campus'] },
      { id: 3, no: 'PB10-PC-103', driver: 'Balwinder Kumar', phone: '9800000003', capacity: 20, time: '07:00', fare: 2000,
        route: 'Jagraon → PCTE Campus', stops: ['Jagraon Bridge', 'Dugri', 'Haibowal', 'PCTE Campus'] }
    ],
    students: [
      { id: 1, name: 'Aman Verma',   roll: 'BCA-2301', course: 'BCA',    phone: '9811111111', busId: 1, stop: 'Model Town', seat: 1,    status: 'Allocated' },
      { id: 2, name: 'Simran Kaur',  roll: 'BTECH-2210', course: 'B.Tech CSE', phone: '9822222222', busId: 1, stop: 'Clock Tower', seat: 2, status: 'Allocated' },
      { id: 3, name: 'Rohit Sharma', roll: 'MBA-2402', course: 'MBA',    phone: '9833333333', busId: 2, stop: 'Jamalpur', seat: 1,    status: 'Allocated' }
    ],
    waitlist: [],        // array of student ids (Queue)
    fees: [],            // {rec, studentId, month, amount, date}
    rec: 1000,
    settings: defaultSettings()
  };
}
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.buses) { d.settings = Object.assign(defaultSettings(), d.settings || {}); return d; } } catch (e) {}
  return seed();
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function snap() { history.push(JSON.stringify(S)); updateUndo(); }
function mutate(fn) { snap(); fn(); save(); renderAll(); }
function updateUndo() { $('#undoCount').textContent = history.size; }

/* ============================ HELPERS ============================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => S.settings.currency + Number(n).toLocaleString('en-IN');
const busMap = () => new Map(S.buses.map(b => [b.id, b]));       // Hash Map
const stuMap = () => new Map(S.students.map(s => [s.id, s]));
const seated = busId => S.students.filter(s => s.busId === busId && s.seat);
const freeSeats = b => b.capacity - seated(b.id).length;
const waitCount = busId => S.waitlist.filter(id => stuMap().get(id)?.busId === busId).length;
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}

function openModal(title, html, onSubmit, saveLabel = 'Save') {
  $('#mTitle').textContent = title;
  $('#mBody').innerHTML = `<form id="mForm">${html}
    <div class="row end"><button type="button" class="btn ghost" onclick="closeModal()">Cancel</button>
    <button class="btn">${saveLabel}</button></div></form>`;
  $('#modal').classList.remove('hidden');
  $('#mForm').onsubmit = e => {
    e.preventDefault();
    if (onSubmit(Object.fromEntries(new FormData(e.target))) !== false) closeModal();
  };
  return $('#mForm');
}
function showHTML(title, html) {
  $('#mTitle').textContent = title;
  $('#mBody').innerHTML = html + `<div class="row end"><button class="btn ghost" onclick="closeModal()">Close</button></div>`;
  $('#modal').classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }

/* ============================ SEAT ALLOCATION ============================ */

function allocate(stu, busId) {
  const bus = busMap().get(busId);
  const taken = new Set(seated(busId).map(s => s.seat));
  for (let i = 1; i <= bus.capacity; i++) {
    if (!taken.has(i)) { stu.busId = busId; stu.seat = i; stu.status = 'Allocated'; return true; }
  }
  return false;
}
function promoteWaiting(busId) {            // Queue dequeue for that bus
  const q = new Queue(S.waitlist), sm = stuMap();
  const idx = q.items.findIndex(id => sm.get(id)?.busId === busId);
  if (idx === -1) return null;
  const id = q.removeAt(idx), stu = sm.get(id);
  if (stu && allocate(stu, busId)) return stu;
  return null;
}
function releaseSeat(stu) {
  const busId = stu.busId;
  const wasSeated = !!stu.seat;
  stu.seat = null; stu.busId = null; stu.stop = ''; stu.status = 'None';
  const wi = S.waitlist.indexOf(stu.id);
  if (wi > -1) new Queue(S.waitlist).removeAt(wi);
  if (wasSeated && busId) return promoteWaiting(busId);
  return null;
}

/* ============================ RENDER: DASHBOARD ============================ */

function renderDashboard() {
  const totalSeats = S.buses.reduce((a, b) => a + b.capacity, 0);
  const used = S.students.filter(s => s.seat).length;
  const collected = S.fees.reduce((a, f) => a + f.amount, 0);
  const bars = S.buses.map(b => {
    const u = seated(b.id).length, p = Math.round(u / b.capacity * 100);
    return `<div class="bar-row"><div class="nm">${esc(b.no)}</div>
      <div class="bar"><i style="width:${p}%"></i></div><div class="pc">${u}/${b.capacity} (${p}%)</div></div>`;
  }).join('');
  $('#sec-dashboard').innerHTML = `
    <div class="stats">
      <div class="stat"><b>${S.buses.length}</b><span>Total Buses</span></div>
      <div class="stat o"><b>${S.students.length}</b><span>Registered Students</span></div>
      <div class="stat g"><b>${used}/${totalSeats}</b><span>Seats Occupied</span></div>
      <div class="stat r"><b>${S.waitlist.length}</b><span>On Waiting List</span></div>
      <div class="stat g"><b>${money(collected)}</b><span>Fees Collected</span></div>
    </div>
    <div class="card"><h4 style="color:var(--navy);margin-bottom:8px">Bus Occupancy</h4>${bars || '<div class="empty">No buses</div>'}</div>
    <div class="card"><h4 style="color:var(--navy);margin-bottom:8px">Today's Departures</h4>
      <div class="tbl"><table><tr><th>Time</th><th>Bus</th><th>Route</th><th>Driver</th></tr>
      ${mergeSort([...S.buses], (a, b) => a.time.localeCompare(b.time)).map(b =>
        `<tr><td><b>${esc(b.time)}</b></td><td>${esc(b.no)}</td><td>${esc(b.route)}</td><td>${esc(b.driver)}</td></tr>`).join('')}
      </table></div></div>`;
}

/* ============================ RENDER: BUSES ============================ */

let binResult = null;
function renderBuses() {
  const q = $('#busSearch').value.trim().toLowerCase();
  const key = $('#busSort').value;
  const cmp = {
    no: (a, b) => a.no.localeCompare(b.no),
    capacity: (a, b) => a.capacity - b.capacity,
    fare: (a, b) => a.fare - b.fare,
    time: (a, b) => a.time.localeCompare(b.time)
  }[key];
  let list = mergeSort([...S.buses], cmp);
  if (binResult) list = binResult.item ? [binResult.item] : [];
  else if (q) list = list.filter(b => [b.no, b.route, b.driver].join(' ').toLowerCase().includes(q));

  $('#busTable').innerHTML = list.length ? `<table>
    <tr><th>Bus No</th><th>Route</th><th>Driver</th><th>Phone</th><th>Time</th><th>Seats (Free/Total)</th><th>Fare/month</th><th>Actions</th></tr>
    ${list.map(b => `<tr>
      <td><b>${esc(b.no)}</b></td><td>${esc(b.route)}</td><td>${esc(b.driver)}</td><td>${esc(b.phone)}</td>
      <td>${esc(b.time)}</td>
      <td><span class="badge ${freeSeats(b) ? 'b-g' : 'b-r'}">${freeSeats(b)} / ${b.capacity}</span></td>
      <td>${money(b.fare)}</td>
      <td><button class="btn small" onclick="editBus(${b.id})">Edit</button>
          <button class="btn small red" onclick="delBus(${b.id})">Delete</button></td></tr>`).join('')}
    </table>` : '<div class="empty">No buses found.</div>';
}

function busForm(b = {}) {
  return `
    <label>Bus Number</label><input name="no" value="${esc(b.no || '')}" placeholder="PB10-PC-104" required>
    <label>Route Name</label><input name="route" value="${esc(b.route || '')}" placeholder="Area → PCTE Campus" required>
    <label>Driver Name</label><input name="driver" value="${esc(b.driver || '')}" required>
    <label>Driver Phone</label><input name="phone" value="${esc(b.phone || '')}" pattern="[0-9]{10}" title="10 digit number" required>
    <label>Seat Capacity</label><input name="capacity" type="number" min="1" max="60" value="${b.capacity || S.settings.defCapacity}" required>
    <label>Departure Time</label><input name="time" type="time" value="${b.time || S.settings.defTime}" required>
    <label>Monthly Fare (${esc(S.settings.currency)})</label><input name="fare" type="number" min="0" value="${b.fare || S.settings.defFare}" required>`;
}
function addBus() {
  openModal('Add New Bus', busForm(), d => {
    if (S.buses.some(b => b.no.toLowerCase() === d.no.trim().toLowerCase())) { toast('Bus number already exists'); return false; }
    mutate(() => S.buses.push({ id: ++S.nid, no: d.no.trim(), route: d.route.trim(), driver: d.driver.trim(), phone: d.phone,
      capacity: +d.capacity, time: d.time, fare: +d.fare, stops: ['PCTE Campus'] }));
    toast('Bus added');
  });
}
function editBus(id) {
  const b = busMap().get(id);
  openModal('Edit Bus', busForm(b), d => {
    const used = seated(id).length;
    if (+d.capacity < used) { toast(`Capacity cannot be below ${used} (seats already allocated)`); return false; }
    if (S.buses.some(x => x.id !== id && x.no.toLowerCase() === d.no.trim().toLowerCase())) { toast('Bus number already exists'); return false; }
    mutate(() => Object.assign(b, { no: d.no.trim(), route: d.route.trim(), driver: d.driver.trim(), phone: d.phone,
      capacity: +d.capacity, time: d.time, fare: +d.fare }));
    toast('Bus updated');
  });
}
function delBus(id) {
  if (S.students.some(s => s.busId === id)) return toast('Cannot delete: students are assigned to this bus');
  if (!confirm('Delete this bus?')) return;
  mutate(() => { S.buses = S.buses.filter(b => b.id !== id); });
  toast('Bus deleted');
}

/* ============================ RENDER: ROUTES (Linked List) ============================ */

function renderRoutes() {
  $('#routeList').innerHTML = S.buses.map(b => {
    const ll = LinkedList.from(b.stops), arr = ll.toArray();
    const chain = arr.map((s, i) => `
      <div class="node ${i === 0 ? 'head' : ''}">${i === 0 ? 'HEAD: ' : ''}${esc(s)}
        <button title="Remove stop" onclick="removeStop(${b.id},'${esc(s).replace(/'/g, "\\'")}')">✕</button></div>
      ${i < arr.length - 1 ? '<span class="arrow">→</span>' : '<span class="arrow">→ NULL</span>'}`).join('');
    return `<div class="card route-card">
      <h4>${esc(b.no)} — ${esc(b.route)}</h4>
      <small class="muted">Departs ${esc(b.time)} · ${ll.size} stops (list size)</small>
      <div class="chain">${chain || '<span class="muted">Empty list</span>'}</div>
      <div class="toolbar" style="margin:0">
        <button class="btn small green" onclick="addStop(${b.id})">+ Append Stop</button>
        <button class="btn small orange" onclick="insertStop(${b.id})">Insert After…</button>
      </div></div>`;
  }).join('') || '<div class="empty">No buses.</div>';
}
function addStop(id) {
  openModal('Append Stop', `<label>Stop Name</label><input name="s" required>`, d => {
    const b = busMap().get(id), name = d.s.trim();
    if (b.stops.includes(name)) { toast('Stop already in route'); return false; }
    mutate(() => { const l = LinkedList.from(b.stops); l.append(name); b.stops = l.toArray(); });
    toast('Stop appended');
  });
}
function insertStop(id) {
  const b = busMap().get(id);
  openModal('Insert Stop After…', `<label>Insert after</label><select name="after">${b.stops.map(s => `<option>${esc(s)}</option>`).join('')}</select>
    <label>New Stop Name</label><input name="s" required>`, d => {
    const name = d.s.trim();
    if (b.stops.includes(name)) { toast('Stop already in route'); return false; }
    mutate(() => { const l = LinkedList.from(b.stops); l.insertAfter(d.after, name); b.stops = l.toArray(); });
    toast('Stop inserted');
  });
}
function removeStop(id, name) {
  const b = busMap().get(id);
  if (S.students.some(s => s.busId === id && s.stop === name)) return toast('Students board at this stop – reassign them first');
  if (b.stops.length <= 1) return toast('A route needs at least one stop');
  mutate(() => { const l = LinkedList.from(b.stops); l.remove(name); b.stops = l.toArray(); });
  toast('Stop removed');
}

/* ============================ RENDER: STUDENTS ============================ */

function renderStudents() {
  const q = $('#stuSearch').value.trim().toLowerCase(), bm = busMap();
  const list = S.students.filter(s => !q || [s.name, s.roll, s.course].join(' ').toLowerCase().includes(q));
  $('#stuTable').innerHTML = list.length ? `<table>
    <tr><th>Roll No</th><th>Name</th><th>Course</th><th>Phone</th><th>Bus</th><th>Stop</th><th>Seat</th><th>Status</th><th>Actions</th></tr>
    ${list.map(s => {
      const b = bm.get(s.busId);
      const cls = s.status === 'Allocated' ? 'b-g' : s.status === 'Waitlisted' ? 'b-o' : 'b-b';
      return `<tr><td>${esc(s.roll)}</td><td><b>${esc(s.name)}</b></td><td>${esc(s.course)}</td><td>${esc(s.phone)}</td>
        <td>${b ? esc(b.no) : '—'}</td><td>${esc(s.stop || '—')}</td><td>${s.seat || '—'}</td>
        <td><span class="badge ${cls}">${s.status}</span></td>
        <td>${s.status === 'None' ? `<button class="btn small" onclick="assignBus(${s.id})">Assign Bus</button>` :
              `<button class="btn small orange" onclick="cancelBus(${s.id})">Cancel Bus</button>`}
            ${s.seat ? `<button class="btn small green" onclick="payFee(${s.id})">Pay Fee</button>` : ''}
            <button class="btn small red" onclick="delStudent(${s.id})">Delete</button></td></tr>`;
    }).join('')}</table>` : '<div class="empty">No students found.</div>';
}

function busSelectHTML() {
  return S.buses.map(b => `<option value="${b.id}">${esc(b.no)} – ${esc(b.route)} (${freeSeats(b)} free)</option>`).join('');
}
function wireStops(form) {
  const bs = form.querySelector('[name=busId]'), st = form.querySelector('[name=stop]');
  const fill = () => { const b = busMap().get(+bs.value); st.innerHTML = b ? b.stops.map(s => `<option>${esc(s)}</option>`).join('') : ''; };
  bs.onchange = fill; fill();
}
function finishAssign(stu, busId, stop) {
  stu.stop = stop; stu.busId = busId;
  if (allocate(stu, busId)) toast(`Seat ${stu.seat} allocated`);
  else { stu.status = 'Waitlisted'; stu.seat = null; new Queue(S.waitlist).enqueue(stu.id); toast('Bus full – added to waiting list'); }
}
function addStudent() {
  if (!S.buses.length) return toast('Add a bus first');
  const f = openModal('Register Student', `
    <label>Full Name</label><input name="name" required>
    <label>Roll Number</label><input name="roll" required>
    <label>Course</label><select name="course">${courseList().map(c => `<option>${esc(c)}</option>`).join('')}</select>
    <label>Phone</label><input name="phone" pattern="[0-9]{10}" title="10 digit number" required>
    <label>Bus</label><select name="busId">${busSelectHTML()}</select>
    <label>Boarding Stop</label><select name="stop"></select>`, d => {
    if (S.students.some(s => s.roll.toLowerCase() === d.roll.trim().toLowerCase())) { toast('Roll number already registered'); return false; }
    mutate(() => {
      const stu = { id: ++S.nid, name: d.name.trim(), roll: d.roll.trim(), course: d.course, phone: d.phone, busId: null, stop: '', seat: null, status: 'None' };
      S.students.push(stu); finishAssign(stu, +d.busId, d.stop);
    });
  }, 'Register');
  wireStops(f);
}
function assignBus(id) {
  const stu = stuMap().get(id);
  const f = openModal('Assign Bus – ' + stu.name, `
    <label>Bus</label><select name="busId">${busSelectHTML()}</select>
    <label>Boarding Stop</label><select name="stop"></select>`, d => {
    mutate(() => finishAssign(stu, +d.busId, d.stop));
  }, 'Assign');
  wireStops(f);
}
function cancelBus(id) {
  if (!confirm('Cancel this bus allocation?')) return;
  mutate(() => {
    const promoted = releaseSeat(stuMap().get(id));
    if (promoted) toast(`Seat given to ${promoted.name} from waiting list`); else toast('Allocation cancelled');
  });
}
function delStudent(id) {
  if (!confirm('Delete this student?')) return;
  mutate(() => {
    const stu = stuMap().get(id); releaseSeat(stu);
    S.students = S.students.filter(s => s.id !== id);
  });
  toast('Student deleted');
}

/* ============================ RENDER: SEAT MAP ============================ */

function renderSeats() {
  const sel = $('#seatBus'), cur = sel.value;
  sel.innerHTML = S.buses.map(b => `<option value="${b.id}">${esc(b.no)} – ${esc(b.route)}</option>`).join('');
  if (cur && S.buses.some(b => b.id == cur)) sel.value = cur;
  const b = busMap().get(+sel.value);
  if (!b) { $('#seatMap').innerHTML = '<div class="empty">No buses.</div>'; return; }
  const taken = new Map(seated(b.id).map(s => [s.seat, s]));
  let cells = '';
  for (let i = 1; i <= b.capacity; i++) {
    const s = taken.get(i);
    if (i % 4 === 3 || (i - 1) % 4 === 0 && i !== 1) { /* aisle handled below */ }
    if ((i - 1) % 4 === 2) cells += '<div class="aisle"></div>';
    cells += s ? `<div class="seat taken" title="${esc(s.name)} – ${esc(s.stop)}" onclick="seatInfo(${s.id})">${i}</div>`
               : `<div class="seat free">${i}</div>`;
  }
  $('#seatMap').innerHTML = `
    <h4 style="text-align:center;color:var(--navy)">${esc(b.no)} · ${esc(b.route)}</h4>
    <p class="muted" style="text-align:center">Driver: ${esc(b.driver)} (${esc(b.phone)}) · ${freeSeats(b)} free of ${b.capacity} · ${waitCount(b.id)} waiting</p>
    <div class="bus-shell"><div class="driver">🧑‍✈️ Driver</div><div class="seat-grid">${cells}</div></div>
    <div class="legend"><span><span class="badge b-g">&nbsp;&nbsp;</span> Free</span><span><span class="badge b-r">&nbsp;&nbsp;</span> Occupied (click for details)</span></div>`;
}
function seatInfo(id) {
  const s = stuMap().get(id), b = busMap().get(s.busId);
  showHTML('Seat ' + s.seat, `<p><b>${esc(s.name)}</b> (${esc(s.roll)})</p><p>${esc(s.course)} · ${esc(s.phone)}</p><p>Boards at: ${esc(s.stop)}</p><p>Bus: ${esc(b.no)}</p>`);
}

/* ============================ RENDER: WAITLIST (Queue) ============================ */

function renderWait() {
  const sm = stuMap(), bm = busMap();
  $('#waitTable').innerHTML = S.waitlist.length ? `<table>
    <tr><th>Queue Position</th><th>Student</th><th>Roll No</th><th>Bus Requested</th><th>Stop</th><th>Action</th></tr>
    ${S.waitlist.map((id, i) => { const s = sm.get(id), b = bm.get(s.busId);
      return `<tr><td><span class="badge b-o">#${i + 1}${i === 0 ? ' (front)' : ''}</span></td><td><b>${esc(s.name)}</b></td><td>${esc(s.roll)}</td>
        <td>${esc(b.no)}</td><td>${esc(s.stop)}</td>
        <td><button class="btn small" onclick="tryPromote(${s.id})">Try Allocate</button>
            <button class="btn small red" onclick="cancelBus(${s.id})">Remove</button></td></tr>`; }).join('')}
    </table>` : '<div class="empty">Waiting list is empty 🎉</div>';
}
function tryPromote(id) {
  const stu = stuMap().get(id);
  if (freeSeats(busMap().get(stu.busId)) <= 0) return toast('Still no free seat on this bus');
  mutate(() => { const p = promoteWaiting(stu.busId); if (p) toast(`Seat ${p.seat} allotted to ${p.name}`); });
}

/* ============================ RENDER: FEES ============================ */

function payFee(id) {
  const s = stuMap().get(id), b = busMap().get(s.busId), now = new Date();
  openModal('Collect Fee – ' + s.name, `
    <p class="muted">Bus ${esc(b.no)} · Monthly fare <b>${money(b.fare)}</b></p>
    <label>Month</label><select name="m">${months.map((m, i) => `<option value="${m} ${now.getFullYear()}" ${i === now.getMonth() ? 'selected' : ''}>${m} ${now.getFullYear()}</option>`).join('')}</select>`, d => {
    if (S.fees.some(f => f.studentId === id && f.month === d.m)) { toast('Fee already paid for ' + d.m); return false; }
    mutate(() => S.fees.push({ rec: ++S.rec, studentId: id, month: d.m, amount: b.fare, date: now.toLocaleDateString('en-IN') }));
    toast('Payment recorded');
    setTimeout(() => receipt(S.rec), 50);
  }, 'Collect');
}
function receipt(rec) {
  const f = S.fees.find(x => x.rec === rec), s = stuMap().get(f.studentId), b = busMap().get(s?.busId);
  showHTML('Fee Receipt', `<div class="receipt"><h4>${esc(S.settings.inst)}</h4><p style="justify-content:center;border:0"><small>Transport Fee Receipt</small></p>
    <p><span>Receipt No</span><b>${esc(S.settings.prefix)}${f.rec}</b></p><p><span>Date</span><b>${esc(f.date)}</b></p>
    <p><span>Student</span><b>${esc(s?.name)}</b></p><p><span>Roll No</span><b>${esc(s?.roll)}</b></p>
    <p><span>Bus</span><b>${esc(b?.no || '—')}</b></p><p><span>Month</span><b>${esc(f.month)}</b></p>
    <p><span>Amount Paid</span><b>${money(f.amount)}</b></p></div>
    <div class="row end"><button class="btn orange" onclick="window.print()">🖨 Print</button></div>`);
}
function renderFees() {
  const sm = stuMap(), bm = busMap();
  const total = S.fees.reduce((a, f) => a + f.amount, 0);
  const m = months[new Date().getMonth()] + ' ' + new Date().getFullYear();
  const due = S.students.filter(s => s.seat && !S.fees.some(f => f.studentId === s.id && f.month === m));
  const dueAmt = due.reduce((a, s) => a + bm.get(s.busId).fare, 0);
  $('#feeStats').innerHTML = `
    <div class="stat g"><b>${money(total)}</b><span>Total Collected</span></div>
    <div class="stat"><b>${S.fees.length}</b><span>Receipts Issued</span></div>
    <div class="stat r"><b>${due.length}</b><span>Pending for ${m}</span></div>
    <div class="stat o"><b>${money(dueAmt)}</b><span>Pending Amount</span></div>`;
  $('#feeTable').innerHTML = S.fees.length ? `<table>
    <tr><th>Receipt</th><th>Date</th><th>Student</th><th>Month</th><th>Amount</th><th></th></tr>
    ${[...S.fees].reverse().map(f => `<tr><td>${esc(S.settings.prefix)}${f.rec}</td><td>${esc(f.date)}</td><td>${esc(sm.get(f.studentId)?.name || 'Deleted')}</td>
      <td>${esc(f.month)}</td><td>${money(f.amount)}</td><td><button class="btn small" onclick="receipt(${f.rec})">View</button></td></tr>`).join('')}
    </table>` : '<div class="empty">No payments yet. Use “Pay Fee” on the Students page.</div>';
}

/* ============================ RENDER: DSA PAGE ============================ */

function renderDSA() {
  const items = [
    ['Singly Linked List', 'Route stops are stored as nodes (<code>val → next</code>). Append is O(n), insertAfter O(n), remove O(n). Seen on the <b>Routes &amp; Stops</b> page.'],
    ['Queue (FIFO)', 'Waiting list. <code>enqueue</code> when a bus is full; <code>dequeue</code> (first student for that bus) when a seat frees up. Enqueue O(1).'],
    ['Stack (LIFO)', 'Undo history. Before every change a snapshot is pushed; the <b>Undo</b> button pops the latest. Push/Pop O(1).'],
    ['Merge Sort', 'Sorts the bus table by number, capacity, fare or time. Stable, O(n log n) time, O(n) space.'],
    ['Binary Search', 'Exact bus-number lookup on the sorted list. O(log n). The result shows how many comparisons were needed.'],
    ['Hash Map', 'JavaScript <code>Map</code> used for O(1) average lookup of buses and students by id.'],
    ['Array / Grid', 'Seat allocation scans seat numbers 1…capacity for the first free seat; seat map is rendered as a 2+2 grid.'],
    ['Persistence', 'All data is saved in the browser <code>localStorage</code>, so it stays after refresh. No server needed.']
  ];
  $('#sec-dsa').innerHTML = `<div class="dsa-grid">${items.map(i => `<div class="card"><h4>${i[0]}</h4><p>${i[1]}</p></div>`).join('')}</div>`;
}

/* ============================ SETTINGS ============================ */

function applySettings() {
  const s = S.settings, r = document.documentElement.style;
  document.title = s.title + ' – ' + s.inst;
  $('#loginInst').textContent = s.inst;
  $('#loginTitle').textContent = s.title;
  $('#brandName').textContent = s.brand;
  r.setProperty('--navy', s.color);
  r.setProperty('--navy2', `color-mix(in srgb, ${s.color} 78%, white)`);
  r.setProperty('--orange', s.accent);
  $('#loginHint').innerHTML = (s.username === 'admin' && s.password === 'admin123')
    ? 'Demo login: <b>admin</b> / <b>admin123</b>' : '';
}

function renderSettings() {
  const s = S.settings;
  const f = (k, label, type = 'text', extra = '') =>
    `<div><label>${label}</label><input name="${k}" type="${type}" value="${esc(s[k])}" ${extra}></div>`;
  $('#sec-settings').innerHTML = `
    <form id="setForm">
      <div class="card">
        <h4 class="sh">🏫 Institute &amp; Branding</h4>
        <div class="grid2">
          ${f('inst', 'Institute Name', 'text', 'required')}
          ${f('title', 'System Title', 'text', 'required')}
          ${f('brand', 'Sidebar Name', 'text', 'required')}
          ${f('color', 'Main Colour', 'color')}
          ${f('accent', 'Accent Colour', 'color')}
        </div>
      </div>
      <div class="card">
        <h4 class="sh">🚌 Defaults &amp; Fees</h4>
        <div class="grid2">
          ${f('currency', 'Currency Symbol', 'text', 'required maxlength="4"')}
          ${f('prefix', 'Receipt Prefix', 'text')}
          ${f('defCapacity', 'Default Bus Capacity', 'number', 'min="1" max="60" required')}
          ${f('defTime', 'Default Departure Time', 'time', 'required')}
          ${f('defFare', 'Default Monthly Fare', 'number', 'min="0" required')}
        </div>
        <label>Courses (comma separated)</label>
        <input name="courses" value="${esc(s.courses)}" required>
        <small>These appear in the course drop-down when registering students.</small>
      </div>
      <div class="card">
        <h4 class="sh">🔐 Admin Login</h4>
        <div class="grid2">
          ${f('username', 'Username', 'text', 'required')}
          <div><label>New Password</label><input name="newpass" type="password" placeholder="Leave blank to keep current"></div>
        </div>
      </div>
      <div class="btn-row" style="margin-bottom:22px">
        <button class="btn green">💾 Save Settings</button>
        <button type="button" class="btn ghost" id="defSetBtn">Restore Default Settings</button>
      </div>
    </form>

    <div class="card">
      <h4 class="sh">🗄️ Data Management</h4>
      <p class="muted" style="margin-bottom:0">Back up all buses, students, fees and settings, or restore them on another computer.</p>
      <div class="btn-row">
        <button class="btn" onclick="exportData()">⬇ Export Backup (JSON)</button>
        <button class="btn ghost" onclick="$('#importFile').click()">⬆ Import Backup</button>
        <input type="file" id="importFile" accept=".json,application/json" class="hidden">
        <button class="btn orange" onclick="clearPeople()">Clear Students &amp; Fees</button>
        <button class="btn red" onclick="$('#resetBtn').click()">Reset Everything</button>
      </div>
    </div>`;

  $('#setForm').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (+d.defCapacity < 1) return toast('Default capacity must be at least 1');
    if (!d.courses.split(',').some(c => c.trim())) return toast('Add at least one course');
    mutate(() => {
      Object.assign(S.settings, d, { defCapacity: +d.defCapacity, defFare: +d.defFare, username: d.username.trim() });
      delete S.settings.newpass;
      if (d.newpass) S.settings.password = d.newpass;
    });
    toast('Settings saved');
  };
  $('#defSetBtn').onclick = () => {
    if (!confirm('Restore default settings? Your data stays untouched.')) return;
    mutate(() => { S.settings = defaultSettings(); });
    toast('Default settings restored');
  };
  $('#importFile').onchange = e => importData(e.target.files[0]);
}

function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pcte-bus-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('Backup downloaded');
}
function importData(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!Array.isArray(d.buses) || !Array.isArray(d.students)) throw 0;
      if (!confirm('Replace all current data with this backup?')) return;
      snap();
      d.waitlist = d.waitlist || []; d.fees = d.fees || [];
      d.settings = Object.assign(defaultSettings(), d.settings || {});
      S = d; save(); renderAll(); toast('Backup restored');
    } catch (e) { toast('Invalid backup file'); }
  };
  rd.readAsText(file);
}
function clearPeople() {
  if (!confirm('Delete ALL students, waiting list and fee records? Buses and routes are kept.')) return;
  mutate(() => { S.students = []; S.waitlist = []; S.fees = []; });
  toast('Students and fees cleared');
}

/* ============================ NAVIGATION / INIT ============================ */

const titles = { dashboard: 'Dashboard', buses: 'Bus Management', routes: 'Routes & Stops (Linked List)', students: 'Student Management',
  seats: 'Seat Map', waitlist: 'Waiting List (Queue)', fees: 'Fee Management', dsa: 'DSA Concepts Used', settings: 'Settings' };

function renderAll() {
  applySettings();
  ({ dashboard: renderDashboard, buses: renderBuses, routes: renderRoutes, students: renderStudents,
     seats: renderSeats, waitlist: renderWait, fees: renderFees, dsa: renderDSA, settings: renderSettings })[currentSec]();
  updateUndo();
}
function go(sec) {
  currentSec = sec;
  $$('.sec').forEach(s => s.classList.add('hidden'));
  $('#sec-' + sec).classList.remove('hidden');
  $$('nav a').forEach(a => a.classList.toggle('active', a.dataset.sec === sec));
  $('#pageTitle').textContent = titles[sec];
  $('#sidebar').classList.remove('open');
  renderAll();
}

function startApp() {
  $('#login').classList.add('hidden'); $('#app').classList.remove('hidden'); go('dashboard');
}

$('#loginForm').onsubmit = e => {
  e.preventDefault();
  if ($('#lu').value.trim() === S.settings.username && $('#lp').value === S.settings.password) { sessionStorage.setItem('pcte_login', '1'); startApp(); }
  else toast('Invalid username or password');
};
$('#logoutBtn').onclick = () => { sessionStorage.removeItem('pcte_login'); location.reload(); };
$$('nav a').forEach(a => a.onclick = () => go(a.dataset.sec));
$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
$('#addBusBtn').onclick = addBus;
$('#addStuBtn').onclick = addStudent;
$('#busSearch').oninput = () => { binResult = null; $('#binInfo').classList.add('hidden'); renderBuses(); };
$('#busSort').onchange = () => { binResult = null; $('#binInfo').classList.add('hidden'); renderBuses(); };
$('#stuSearch').oninput = renderStudents;
$('#seatBus').onchange = renderSeats;
$('#binBtn').onclick = () => {
  const key = $('#busSearch').value.trim().toLowerCase();
  if (!key) return toast('Type the exact bus number first');
  const sorted = mergeSort([...S.buses], (a, b) => a.no.toLowerCase().localeCompare(b.no.toLowerCase()));
  binResult = binarySearch(sorted, key, b => b.no.toLowerCase());
  const info = $('#binInfo'); info.classList.remove('hidden');
  info.innerHTML = binResult.item
    ? `✅ Found <b>${esc(binResult.item.no)}</b> using Binary Search in <b>${binResult.steps}</b> comparison(s) (list size ${sorted.length}).`
    : `❌ Not found after <b>${binResult.steps}</b> comparison(s). Edit the box to clear.`;
  renderBuses();
};
$('#undoBtn').onclick = () => {
  if (!history.size) return toast('Nothing to undo');
  S = JSON.parse(history.pop()); save(); renderAll(); toast('Last action undone');
};
$('#resetBtn').onclick = () => {
  if (!confirm('Reset everything to demo data?')) return;
  S = seed(); save(); history.items = []; renderAll(); toast('Demo data restored');
};
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };

applySettings();
$('#lu').value = S.settings.username;
if (sessionStorage.getItem('pcte_login')) startApp();
