/**
 * RailTrack - Railway Ticket Reservation & Management System
 * Core Architecture: Dynamic Linked Records, FIFO Standby Queue, LIFO Audit Stack
 */

// --- Model Class & State ---
class Passenger {
  constructor(ticketId, name, age, gender, travelClass, seatNumber = 0) {
    this.ticketId = ticketId;
    this.name = name;
    this.age = age;
    this.gender = gender;
    this.travelClass = travelClass;
    this.seatNumber = seatNumber; // 0 means Waiting List
    this.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

const MAX_SEATS = 5;
let ticketCounter = 1001;

// Core Engine Data
const confirmedList = [];     // Linked List of confirmed bookings
const waitingQueue = [];      // Queue of standby passengers
const cancellationStack = []; // Stack of cancelled records (Audit trail)

// --- DOM Elements ---
const bookingForm = document.getElementById('booking-form');
const cancelForm = document.getElementById('cancel-form');
const coachSeatsGrid = document.getElementById('coach-seats-grid');
const linkedListView = document.getElementById('linked-list-view');
const queueView = document.getElementById('queue-view');
const stackView = document.getElementById('stack-view');
const toastContainer = document.getElementById('toast-container');

// Stats Elements
const statConfirmedCount = document.getElementById('stat-confirmed-count');
const confirmedProgress = document.getElementById('confirmed-progress');
const statWaitingCount = document.getElementById('stat-waiting-count');
const queueStatusText = document.getElementById('queue-status-text');
const statCancelledCount = document.getElementById('stat-cancelled-count');
const stackTopText = document.getElementById('stack-top-text');
const badgeConfirmedCount = document.getElementById('badge-confirmed-count');
const badgeWaitingCount = document.getElementById('badge-waiting-count');
const badgeCancelledCount = document.getElementById('badge-cancelled-count');

const btnResetDemo = document.getElementById('btn-reset-demo');

// --- Helper Functions ---
function getNextAvailableSeat() {
  const occupied = new Set(confirmedList.map(p => p.seatNumber));
  for (let seat = 1; seat <= MAX_SEATS; seat++) {
    if (!occupied.has(seat)) return seat;
  }
  return 0;
}

function showToast(message, type = 'primary') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;cursor:pointer;color:inherit;font-weight:700;" onclick="this.parentElement.remove()">✕</button>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Render Functions ---

// 1. Render Coach Seat Matrix (1 to 5)
function renderCoach() {
  coachSeatsGrid.innerHTML = '';
  const seatMap = new Map();
  confirmedList.forEach(p => seatMap.set(p.seatNumber, p));

  for (let seatNum = 1; seatNum <= MAX_SEATS; seatNum++) {
    const isBooked = seatMap.has(seatNum);
    const passenger = seatMap.get(seatNum);
    const seatCard = document.createElement('div');
    seatCard.className = `seat-card ${isBooked ? 'seat-confirmed' : 'seat-available'}`;
    
    seatCard.innerHTML = `
      <div class="seat-number">
        <span>Berth #${seatNum}</span>
        <span class="seat-tag-status ${isBooked ? 'status-booked' : 'status-empty'}">
          ${isBooked ? 'Occupied' : 'Vacant'}
        </span>
      </div>
      ${isBooked ? `
        <div class="seat-passenger-name" title="${passenger.name}">${passenger.name}</div>
        <div class="seat-passenger-meta">ID: ${passenger.ticketId} &bull; ${passenger.age} yrs (${passenger.gender[0]})</div>
      ` : `
        <div class="seat-passenger-name" style="color:var(--text-subtle);">Available</div>
        <div class="seat-passenger-meta">Ready for reservation</div>
      `}
    `;
    coachSeatsGrid.appendChild(seatCard);
  }
}

// 2. Render Confirmed Passenger Linked Records
function renderLinkedList() {
  linkedListView.innerHTML = '';
  
  if (confirmedList.length === 0) {
    linkedListView.innerHTML = `
      <div class="ll-head-label">MANIFEST START</div>
      <div class="node-arrow">➔</div>
      <div class="ll-null-label">NO ACTIVE PASSENGERS</div>
    `;
    return;
  }

  // Head pointer
  const headLabel = document.createElement('div');
  headLabel.className = 'll-head-label';
  headLabel.textContent = 'START';
  linkedListView.appendChild(headLabel);

  const headArrow = document.createElement('div');
  headArrow.className = 'node-arrow';
  headArrow.textContent = '➔';
  linkedListView.appendChild(headArrow);

  // Nodes
  confirmedList.forEach((passenger) => {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'll-node-wrapper';

    nodeWrapper.innerHTML = `
      <div class="ll-node">
        <div class="node-data">
          <div class="node-id">TICKET #${passenger.ticketId}</div>
          <div class="node-name">${passenger.name} (Berth ${passenger.seatNumber})</div>
          <div class="node-meta">${passenger.age}y &bull; ${passenger.travelClass}</div>
          <button class="btn-node-cancel" onclick="cancelByTicketId(${passenger.ticketId})">Release / Cancel</button>
        </div>
        <div class="node-pointer">
          <span>LINK</span>
          <span>●</span>
        </div>
      </div>
      <div class="node-arrow">➔</div>
    `;

    linkedListView.appendChild(nodeWrapper);
  });

  // Tail
  const nullLabel = document.createElement('div');
  nullLabel.className = 'll-null-label';
  nullLabel.textContent = 'END';
  linkedListView.appendChild(nullLabel);
}

// 3. Render Standby / Waiting Queue
function renderQueue() {
  queueView.innerHTML = '';

  if (waitingQueue.length === 0) {
    queueView.innerHTML = '<div class="empty-placeholder">Standby queue is clear. No waiting passengers.</div>';
    return;
  }

  waitingQueue.forEach((passenger, index) => {
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.innerHTML = `
      <span class="queue-pos-badge">Priority #${index + 1}</span>
      <div style="font-weight:700;font-size:0.875rem;">${passenger.name}</div>
      <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);">
        ID: ${passenger.ticketId} &bull; ${passenger.age} yrs (${passenger.gender[0]})
      </div>
    `;
    queueView.appendChild(item);
  });
}

// 4. Render Cancellation & Audit Stack
function renderStack() {
  stackView.innerHTML = '';

  if (cancellationStack.length === 0) {
    stackView.innerHTML = '<div class="empty-placeholder">No cancellations processed yet.</div>';
    return;
  }

  // Iterate top to bottom (most recent first)
  for (let i = cancellationStack.length - 1; i >= 0; i--) {
    const passenger = cancellationStack[i];
    const isTop = (i === cancellationStack.length - 1);
    
    const item = document.createElement('div');
    item.className = `stack-item ${isTop ? 'stack-top' : ''}`;
    item.innerHTML = `
      <div>
        <div style="font-size:0.875rem;font-weight:700;color:var(--text-main);">
          Ticket #${passenger.ticketId} - ${passenger.name}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          Released Berth: ${passenger.seatNumber > 0 ? '#' + passenger.seatNumber : 'Standby'} &bull; Time: ${passenger.timestamp}
        </div>
      </div>
      ${isTop ? '<span class="stack-top-badge">LATEST</span>' : '<span style="font-size:0.75rem;color:var(--text-subtle);">Archived</span>'}
    `;
    stackView.appendChild(item);
  }
}

// Update Dashboard Statistics
function updateStats() {
  const confirmedCount = confirmedList.length;
  const waitingCount = waitingQueue.length;
  const cancelledCount = cancellationStack.length;

  statConfirmedCount.textContent = `${confirmedCount} / ${MAX_SEATS}`;
  confirmedProgress.style.width = `${(confirmedCount / MAX_SEATS) * 100}%`;

  statWaitingCount.textContent = waitingCount;
  queueStatusText.textContent = waitingCount > 0 
    ? `Next in priority: ${waitingQueue[0].name} (ID: ${waitingQueue[0].ticketId})` 
    : 'Standby queue is currently empty';

  statCancelledCount.textContent = cancelledCount;
  stackTopText.textContent = cancelledCount > 0 
    ? `Latest: Ticket #${cancellationStack[cancellationStack.length - 1].ticketId} (${cancellationStack[cancellationStack.length - 1].name})`
    : 'No cancellations logged';

  badgeConfirmedCount.textContent = `${confirmedCount} Active`;
  badgeWaitingCount.textContent = `${waitingCount} Standby`;
  badgeCancelledCount.textContent = `${cancelledCount} Logged`;
}

function updateUI() {
  renderCoach();
  renderLinkedList();
  renderQueue();
  renderStack();
  updateStats();
}

// --- Operations ---

// 1. Book Ticket
bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('passenger-name').value.trim();
  const age = parseInt(document.getElementById('passenger-age').value);
  const gender = document.getElementById('passenger-gender').value;
  const travelClass = document.getElementById('travel-class').value;

  if (!name || isNaN(age) || age <= 0) {
    showToast('Please enter a valid passenger name and age.', 'danger');
    return;
  }

  const ticketId = ticketCounter++;

  if (confirmedList.length < MAX_SEATS) {
    const allocatedSeat = getNextAvailableSeat();
    const newPassenger = new Passenger(ticketId, name, age, gender, travelClass, allocatedSeat);
    confirmedList.push(newPassenger);
    showToast(`Berth #${allocatedSeat} Confirmed for ${name}! (Ticket ID: ${ticketId})`, 'success');
  } else {
    const newPassenger = new Passenger(ticketId, name, age, gender, travelClass, 0);
    waitingQueue.push(newPassenger);
    showToast(`Coach full. ${name} placed on Standby (Priority #${waitingQueue.length})`, 'warning');
  }

  bookingForm.reset();
  updateUI();
});

// 2. Cancel Ticket Action
window.cancelByTicketId = function(ticketId) {
  const index = confirmedList.findIndex(p => p.ticketId === ticketId);
  
  if (index !== -1) {
    const [cancelledPassenger] = confirmedList.splice(index, 1);
    const freedSeat = cancelledPassenger.seatNumber;
    cancellationStack.push(cancelledPassenger);

    showToast(`Ticket #${ticketId} (${cancelledPassenger.name}) cancelled successfully.`, 'danger');

    // Automatic Standby Promotion
    if (waitingQueue.length > 0) {
      const promotedPassenger = waitingQueue.shift();
      promotedPassenger.seatNumber = freedSeat;
      confirmedList.push(promotedPassenger);
      
      showToast(`Standby Cleared: ${promotedPassenger.name} allocated Berth #${freedSeat}!`, 'success');
    }

    updateUI();
    return;
  }

  // Check Standby Queue
  const wlIndex = waitingQueue.findIndex(p => p.ticketId === ticketId);
  if (wlIndex !== -1) {
    const [cancelledWl] = waitingQueue.splice(wlIndex, 1);
    cancellationStack.push(cancelledWl);
    showToast(`Standby Ticket #${ticketId} cancelled.`, 'warning');
    updateUI();
    return;
  }

  showToast(`Ticket ID #${ticketId} not found in system.`, 'danger');
};

cancelForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const ticketId = parseInt(document.getElementById('cancel-ticket-id').value);
  if (isNaN(ticketId)) {
    showToast('Please enter a valid numeric Ticket ID.', 'danger');
    return;
  }
  cancelByTicketId(ticketId);
  cancelForm.reset();
});

// Load Operational Demo Data
function loadDemoData() {
  confirmedList.length = 0;
  waitingQueue.length = 0;
  cancellationStack.length = 0;
  ticketCounter = 1001;

  // 5 Confirmed passengers
  confirmedList.push(new Passenger(ticketCounter++, 'Aarav Patel', 28, 'Male', 'Sleeper (SL)', 1));
  confirmedList.push(new Passenger(ticketCounter++, 'Priya Nair', 24, 'Female', 'AC 3 Tier (3A)', 2));
  confirmedList.push(new Passenger(ticketCounter++, 'Rohan Gupta', 32, 'Male', 'Sleeper (SL)', 3));
  confirmedList.push(new Passenger(ticketCounter++, 'Ananya Sen', 21, 'Female', 'AC 2 Tier (2A)', 4));
  confirmedList.push(new Passenger(ticketCounter++, 'Vikram Rao', 45, 'Male', 'Sleeper (SL)', 5));

  // 2 Standby passengers
  waitingQueue.push(new Passenger(ticketCounter++, 'Neha Sharma', 29, 'Female', 'Sleeper (SL)', 0));
  waitingQueue.push(new Passenger(ticketCounter++, 'Karan Verma', 35, 'Male', 'AC 3 Tier (3A)', 0));

  // 1 Prior cancellation
  cancellationStack.push(new Passenger(999, 'Devendra J.', 50, 'Male', 'Sleeper (SL)', 1));

  showToast('Operational records loaded (5 Confirmed, 2 Standby, 1 Logged)', 'primary');
  updateUI();
}

btnResetDemo.addEventListener('click', loadDemoData);

// Initialize on Load
loadDemoData();
