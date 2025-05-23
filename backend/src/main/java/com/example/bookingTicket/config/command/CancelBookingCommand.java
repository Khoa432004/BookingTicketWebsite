package com.example.bookingTicket.config.command;

import com.example.bookingTicket.enums.ESeatStatus;
import com.example.bookingTicket.enums.ETicketStatus;
import com.example.bookingTicket.models.BookingHistory;
import com.example.bookingTicket.models.Seat;
import com.example.bookingTicket.models.Ticket;
import com.example.bookingTicket.services.BookingHistoryService;
import com.example.bookingTicket.services.SeatService;
import com.example.bookingTicket.services.TicketService;

/**
 * Command for canceling a booking
 */
public class CancelBookingCommand implements BookingCommand {
    private final Long bookingId;
    private final Long userId;
    private final BookingHistoryService bookingHistoryService;
    private final SeatService seatService;
    private final TicketService ticketService;
    
    private BookingHistory bookingHistory;
    private ETicketStatus originalBookingStatus;
    private Seat seat;
    private ESeatStatus originalSeatStatus;
    private Ticket ticket;
    private ETicketStatus originalTicketStatus;
    
    public CancelBookingCommand(
            Long bookingId,
            Long userId,
            BookingHistoryService bookingHistoryService,
            SeatService seatService,
            TicketService ticketService) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.bookingHistoryService = bookingHistoryService;
        this.seatService = seatService;
        this.ticketService = ticketService;
    }
    
    @Override
    public void execute() {
        // Find booking history
        bookingHistory = bookingHistoryService.findById(bookingId);
        if (bookingHistory == null) {
            throw new RuntimeException("Không tìm thấy đặt vé với ID: " + bookingId);
        }
        
        // Check if booking belongs to user
        if (userId != null && !bookingHistory.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy vé này");
        }
        
        // Save original states for potential undo
        originalBookingStatus = bookingHistory.getStatus();
        
        // Update booking status to CANCELED
        bookingHistory.setStatus(ETicketStatus.CANCELED);
        bookingHistoryService.save(bookingHistory);
        
        // Update seat status to AVAILABLE
        seat = bookingHistory.getSeat();
        if (seat != null) {
            originalSeatStatus = seat.getStatus();
            seat.setStatus(ESeatStatus.AVAILABLE);
            seatService.updateSeat(seat);
        }
        
        // Find and update ticket status if exists
        ticket = ticketService.findBySeat(seat);
        if (ticket != null) {
            originalTicketStatus = ticket.getStatus();
            ticket.setStatus(ETicketStatus.CANCELED);
            ticketService.save(ticket);
        }
    }

    @Override
    public boolean canUndo() {
        return bookingHistory != null;
    }

    @Override
    public void undo() {
        if (!canUndo()) {
            throw new RuntimeException("Cannot undo cancellation that wasn't successful");
        }
        
        // Restore booking status
        bookingHistory.setStatus(originalBookingStatus);
        bookingHistoryService.save(bookingHistory);
        
        // Restore seat status
        if (seat != null) {
            seat.setStatus(originalSeatStatus);
            seatService.updateSeat(seat);
        }
        
        // Restore ticket status
        if (ticket != null) {
            ticket.setStatus(originalTicketStatus);
            ticketService.save(ticket);
        }
    }
} 