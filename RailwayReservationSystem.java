import java.util.LinkedList;
import java.util.Queue;
import java.util.Scanner;
import java.util.Stack;

/**
 * Railway Ticket Reservation & Management System
 * Production-ready console application featuring Dynamic Linked Lists, 
 * FIFO Standby Queue, and LIFO Audit Stack.
 */
public class RailwayReservationSystem {

    // Model class representing a Ticket / Passenger
    static class Passenger {
        int ticketId;
        String name;
        int age;
        int seatNumber; // 0 indicates waiting list

        public Passenger(int ticketId, String name, int age, int seatNumber) {
            this.ticketId = ticketId;
            this.name = name;
            this.age = age;
            this.seatNumber = seatNumber;
        }

        @Override
        public String toString() {
            if (seatNumber > 0) {
                return String.format("Ticket ID: %d | Name: %-12s | Age: %2d | Seat No: %d [CONFIRMED]",
                        ticketId, name, age, seatNumber);
            } else {
                return String.format("Ticket ID: %d | Name: %-12s | Age: %2d | [WAITING LIST]",
                        ticketId, name, age);
            }
        }
    }

    // System Configuration
    private static final int MAX_CONFIRMED_SEATS = 5;
    private static int ticketCounter = 1001;

    // Core Data Structures
    // 1. Linked List: Stores confirmed passenger records
    private static final LinkedList<Passenger> confirmedList = new LinkedList<>();

    // 2. Queue (FIFO): Stores passengers on the waiting list
    private static final Queue<Passenger> waitingQueue = new LinkedList<>();

    // 3. Stack (LIFO): Stores recently cancelled tickets for history/undo
    private static final Stack<Passenger> cancellationStack = new Stack<>();

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int choice;

        System.out.println("==================================================");
        System.out.println("    WELCOME TO RAILWAY TICKET RESERVATION SYSTEM  ");
        System.out.println("==================================================");

        do {
            System.out.println("\n----------------- MAIN MENU -----------------");
            System.out.println("1. Book Ticket");
            System.out.println("2. Cancel Ticket");
            System.out.println("3. Display Confirmed Passengers (Linked List)");
            System.out.println("4. Display Waiting List (Queue)");
            System.out.println("5. View Cancellation History (Stack)");
            System.out.println("6. Exit");
            System.out.print("Enter your choice (1-6): ");

            while (!scanner.hasNextInt()) {
                System.out.print("Invalid input! Please enter a number (1-6): ");
                scanner.next();
            }
            choice = scanner.nextInt();
            scanner.nextLine(); // Consume newline

            switch (choice) {
                case 1:
                    bookTicket(scanner);
                    break;
                case 2:
                    cancelTicket(scanner);
                    break;
                case 3:
                    displayConfirmedPassengers();
                    break;
                case 4:
                    displayWaitingList();
                    break;
                case 5:
                    displayCancellationHistory();
                    break;
                case 6:
                    System.out.println("\nThank you for using the Railway Reservation System. Goodbye!");
                    break;
                default:
                    System.out.println("Invalid choice! Please select an option between 1 and 6.");
            }
        } while (choice != 6);

        scanner.close();
    }

    /**
     * Operation 1: Book Ticket
     * - If confirmed seats < MAX_CONFIRMED_SEATS, adds to LinkedList with an allocated seat.
     * - If confirmed seats are full, enqueues passenger into Queue (Waiting List).
     */
    private static void bookTicket(Scanner scanner) {
        System.out.print("\nEnter Passenger Name: ");
        String name = scanner.nextLine().trim();
        if (name.isEmpty()) {
            System.out.println("Name cannot be empty. Booking aborted.");
            return;
        }

        System.out.print("Enter Passenger Age: ");
        while (!scanner.hasNextInt()) {
            System.out.print("Invalid age! Please enter a valid number: ");
            scanner.next();
        }
        int age = scanner.nextInt();
        scanner.nextLine(); // Consume newline

        if (age <= 0 || age > 120) {
            System.out.println("Invalid age entered. Booking aborted.");
            return;
        }

        int ticketId = ticketCounter++;

        // Case A: Confirmed Seats Available -> Add to Linked List
        if (confirmedList.size() < MAX_CONFIRMED_SEATS) {
            int allocatedSeat = getNextAvailableSeatNumber();
            Passenger passenger = new Passenger(ticketId, name, age, allocatedSeat);
            confirmedList.add(passenger); // Linked list insertion at end

            System.out.println("\n[SUCCESS] Ticket Confirmed!");
            System.out.println("Details: " + passenger);
        } 
        // Case B: Confirmed Seats Full -> Enqueue to Waiting List (Queue)
        else {
            Passenger passenger = new Passenger(ticketId, name, age, 0);
            waitingQueue.offer(passenger); // Queue enqueue operation

            System.out.println("\n[NOTICE] Confirmed seats full (Max: " + MAX_CONFIRMED_SEATS + ").");
            System.out.println("[ENQUEUED] Added to Waiting List at position #" + waitingQueue.size());
            System.out.println("Details: " + passenger);
        }
    }

    /**
     * Operation 2: Cancel Ticket
     * - Searches and deletes ticket from Confirmed Linked List.
     * - Pushes cancelled ticket onto the Stack (Cancellation History).
     * - If Waiting List is not empty, dequeues next passenger and confirms their seat.
     */
    private static void cancelTicket(Scanner scanner) {
        if (confirmedList.isEmpty() && waitingQueue.isEmpty()) {
            System.out.println("\n[INFO] No active bookings found to cancel.");
            return;
        }

        System.out.print("\nEnter Ticket ID to cancel: ");
        while (!scanner.hasNextInt()) {
            System.out.print("Invalid Ticket ID! Please enter numbers only: ");
            scanner.next();
        }
        int targetId = scanner.nextInt();
        scanner.nextLine();

        // 1. Search in Confirmed List
        Passenger targetPassenger = null;
        int index = -1;
        for (int i = 0; i < confirmedList.size(); i++) {
            if (confirmedList.get(i).ticketId == targetId) {
                targetPassenger = confirmedList.get(i);
                index = i;
                break;
            }
        }

        if (targetPassenger != null) {
            int freedSeatNumber = targetPassenger.seatNumber;

            // Delete from Linked List
            confirmedList.remove(index);

            // Push to Cancellation Stack
            cancellationStack.push(targetPassenger);

            System.out.println("\n[SUCCESS] Confirmed Ticket ID " + targetId + " cancelled successfully.");
            System.out.println("Pushed to Cancellation History Stack.");

            // Automatic Promotion from Waiting List Queue (FIFO)
            if (!waitingQueue.isEmpty()) {
                Passenger promotedPassenger = waitingQueue.poll(); // Dequeue
                promotedPassenger.seatNumber = freedSeatNumber;     // Assign freed seat
                confirmedList.add(promotedPassenger);               // Insert into Linked List

                System.out.println("\n[AUTO-PROMOTION] Waiting list passenger promoted to Confirmed!");
                System.out.println("Promoted Passenger: " + promotedPassenger);
            }
            return;
        }

        // 2. If not found in confirmed list, check Waiting List Queue
        boolean removedFromWL = false;
        // Search & remove from queue using an iterator/loop
        for (Passenger p : waitingQueue) {
            if (p.ticketId == targetId) {
                waitingQueue.remove(p);
                cancellationStack.push(p);
                removedFromWL = true;
                System.out.println("\n[SUCCESS] Waiting list Ticket ID " + targetId + " cancelled and removed from Queue.");
                break;
            }
        }

        if (!removedFromWL) {
            System.out.println("\n[ERROR] Ticket ID " + targetId + " not found in system.");
        }
    }

    /**
     * Operation 3: Display Confirmed Passengers
     * - Traverses the Singly Linked List from head to tail.
     */
    private static void displayConfirmedPassengers() {
        System.out.println("\n============== CONFIRMED PASSENGERS (LINKED LIST) ==============");
        if (confirmedList.isEmpty()) {
            System.out.println("No confirmed passengers at the moment.");
        } else {
            int count = 1;
            for (Passenger p : confirmedList) {
                System.out.println(count++ + ". " + p);
            }
            System.out.println("Total Confirmed: " + confirmedList.size() + "/" + MAX_CONFIRMED_SEATS);
        }
        System.out.println("================================================================");
    }

    /**
     * Operation 4: Display Waiting List
     * - Traverses the Waiting Queue in FIFO order.
     */
    private static void displayWaitingList() {
        System.out.println("\n================= WAITING LIST (QUEUE - FIFO) =================");
        if (waitingQueue.isEmpty()) {
            System.out.println("Waiting list is currently empty.");
        } else {
            int position = 1;
            for (Passenger p : waitingQueue) {
                System.out.println("WL Position #" + position++ + " -> " + p);
            }
            System.out.println("Total in Waiting List: " + waitingQueue.size());
        }
        System.out.println("================================================================");
    }

    /**
     * Operation 5: View Cancellation History
     * - Displays the Stack (LIFO order: most recent cancellation first).
     */
    private static void displayCancellationHistory() {
        System.out.println("\n============= CANCELLATION HISTORY (STACK - LIFO) =============");
        if (cancellationStack.isEmpty()) {
            System.out.println("No cancellations recorded yet.");
        } else {
            System.out.println("Top of Stack (Most Recent Cancellation First):");
            // Iterate from top of stack (last element) down to bottom
            for (int i = cancellationStack.size() - 1; i >= 0; i--) {
                Passenger p = cancellationStack.get(i);
                System.out.println(" [Undo/Audit Log] " + p);
            }
            System.out.println("Recent Most Cancelled Ticket (Peek): " + cancellationStack.peek().name + 
                               " (Ticket ID: " + cancellationStack.peek().ticketId + ")");
        }
        System.out.println("================================================================");
    }

    /**
     * Helper to allocate lowest available seat number (1 to MAX_CONFIRMED_SEATS).
     */
    private static int getNextAvailableSeatNumber() {
        boolean[] occupied = new boolean[MAX_CONFIRMED_SEATS + 1];
        for (Passenger p : confirmedList) {
            if (p.seatNumber >= 1 && p.seatNumber <= MAX_CONFIRMED_SEATS) {
                occupied[p.seatNumber] = true;
            }
        }
        for (int seat = 1; seat <= MAX_CONFIRMED_SEATS; seat++) {
            if (!occupied[seat]) {
                return seat;
            }
        }
        return confirmedList.size() + 1;
    }
}
