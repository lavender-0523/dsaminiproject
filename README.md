# 🚆 RailTrack - Railway Ticket Reservation & Management System

A full-stack, modular Railway Ticket Reservation System demonstrating core Computer Science Data Structures (Dynamic Linked Lists, FIFO Waiting Queue, and LIFO Cancellation Stack) with a Java console engine and an interactive web portal.

---

## 🌟 Key Features

1. **Berth Allocation Matrix (Capacity: 5 Berths)**
   * Visual representation of seat occupancy in real-time.
   * Auto-assigns the lowest available berth number.

2. **Sequential Standby Queue (FIFO - First-In First-Out)**
   * When coach berths are full, new booking requests are automatically routed to the waiting queue.
   * Preserves fair priority dispatching without starvation.

3. **Instant Cancellation & Auto-Promotion Engine**
   * Releases occupied berths upon ticket cancellation.
   * Immediately dequeues and promotes the highest priority standby passenger to the newly freed berth.

4. **Audit & Cancellation History (LIFO - Last-In First-Out)**
   * Every cancelled ticket is pushed to an audit stack.
   * Provides reverse chronological transaction tracking.

---

## 🏗️ Data Structure Architecture

| Module | Data Structure | Principle | Operation & Efficiency |
| :--- | :--- | :--- | :--- |
| **Confirmed Bookings** | Singly Linked List | Dynamic Linear Links | $O(1)$ Append, $O(N)$ Deletion without contiguous shifting |
| **Standby / Waiting List** | Queue | First-In First-Out (FIFO) | $O(1)$ Enqueue (`offer`), $O(1)$ Dequeue (`poll`) |
| **Audit Log / History** | Stack | Last-In First-Out (LIFO) | $O(1)$ Push (`push`), $O(1)$ Top Inspection (`peek`) |

---

## 🚀 Getting Started

### 1. Web Application (Interactive Light-Theme Portal)
Simply open `index.html` in any modern web browser or serve it locally:

```bash
# Using Python
python -m http.server 3000

# Open http://localhost:3000 in your browser
```

### 2. Java Application (Console Version)
```bash
# Compile
javac RailwayReservationSystem.java

# Run
java RailwayReservationSystem
```

---

## 📁 Repository Structure

```
├── index.html                  # Responsive Web Dashboard
├── style.css                   # Modern Light-Theme Stylesheet
├── app.js                      # Core Web Application Logic
├── RailwayReservationSystem.java # Pure Java Console Implementation
└── README.md                   # Documentation
```
