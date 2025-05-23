package com.example.bookingTicket.config.command;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.bookingTicket.dto.BookingRequest;
import com.example.bookingTicket.enums.ESeatStatus;
import com.example.bookingTicket.enums.ETicketStatus;
import com.example.bookingTicket.models.BookingHistory;
import com.example.bookingTicket.models.Customer;
import com.example.bookingTicket.models.Seat;
import com.example.bookingTicket.models.Ticket;
import com.example.bookingTicket.models.Trip;
import com.example.bookingTicket.services.BookingHistoryService;
import com.example.bookingTicket.services.CustomerService;
import com.example.bookingTicket.services.SeatService;
import com.example.bookingTicket.services.TicketService;
import com.example.bookingTicket.services.TripService;

/**
 * Command for creating a new booking
 */
public class CreateBookingCommand implements BookingCommand {
    private final BookingRequest request;
    private final Long customerId;
    private final CustomerService customerService;
    private final SeatService seatService;
    private final TripService tripService;
    private final TicketService ticketService;
    private final BookingHistoryService bookingHistoryService;
    
    private Ticket savedTicket;
    private BookingHistory savedBooking;
    private Seat updatedSeat;
    
    public CreateBookingCommand(
            BookingRequest request, 
            Long customerId,
            CustomerService customerService,
            SeatService seatService,
            TripService tripService,
            TicketService ticketService,
            BookingHistoryService bookingHistoryService) {
        this.request = request;
        this.customerId = customerId;
        this.customerService = customerService;
        this.seatService = seatService;
        this.tripService = tripService;
        this.ticketService = ticketService;
        this.bookingHistoryService = bookingHistoryService;
    }

    @Override
    public void execute() {
        // Get seat and check availability
        Seat seat = seatService.getSeatById(request.getSeatId());
        if (seat == null) {
            throw new RuntimeException("Không tìm thấy ghế với ID: " + request.getSeatId());
        }

        if (seat.getStatus() != ESeatStatus.AVAILABLE) {
            throw new RuntimeException("Ghế này đã được đặt. Vui lòng chọn ghế khác.");
        }

        // Get trip
        Trip trip = tripService.getTripById(request.getTripId());
        if (trip == null) {
            throw new RuntimeException("Không tìm thấy chuyến xe với ID: " + request.getTripId());
        }

        // Get customer
        Customer customer = customerService.findById(customerId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng với ID: " + customerId);
        }
        
        // Update seat status first
        seat.setStatus(ESeatStatus.BOOKED);
        updatedSeat = seatService.updateSeat(seat);
        
        // Create ticket
        Ticket ticket = new Ticket();
        ticket.setBookingCode(UUID.randomUUID().toString());
        ticket.setBookingDateTime(LocalDateTime.now());
        ticket.setCost(trip.getPrice());
        ticket.setSeat(updatedSeat);
        ticket.setCustomer(customer);
        ticket.setTrip(trip);
        ticket.setStatus(ETicketStatus.WAITING);
        savedTicket = ticketService.save(ticket);
        
        // Create booking history
        BookingHistory bookingHistory = new BookingHistory();
        bookingHistory.setCustomer(customer);
        bookingHistory.setSeat(updatedSeat);
        bookingHistory.setTrip(trip);
        bookingHistory.setBookingTime(LocalDateTime.now());
        bookingHistory.setPassengerName(request.getPassengerName());
        bookingHistory.setPassengerPhone(request.getPassengerPhone());
        bookingHistory.setPassengerEmail(request.getPassengerEmail());
        bookingHistory.setStatus(ETicketStatus.WAITING);
        
        savedBooking = bookingHistoryService.save(bookingHistory);
    }

    @Override
    public boolean canUndo() {
        return savedTicket != null && savedBooking != null && updatedSeat != null;
    }

    @Override
    public void undo() {
        if (!canUndo()) {
            throw new RuntimeException("Cannot undo booking that wasn't successfully created");
        }
        
        // Delete booking history
        bookingHistoryService.delete(savedBooking.getId());
        
        // Delete ticket
        ticketService.delete(savedTicket.getId());
        
        // Reset seat status
        updatedSeat.setStatus(ESeatStatus.AVAILABLE);
        seatService.updateSeat(updatedSeat);
    }
    
    public Ticket getSavedTicket() {
        return savedTicket;
    }
    
    public BookingHistory getSavedBooking() {
        return savedBooking;
    }
} 