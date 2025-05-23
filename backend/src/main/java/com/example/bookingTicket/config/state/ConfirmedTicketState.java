package com.example.bookingTicket.config.state;

import com.example.bookingTicket.enums.ETicketStatus;
import com.example.bookingTicket.models.Ticket;

/**
 * State for tickets in CONFIRMED status
 */
public class ConfirmedTicketState implements TicketState {
    
    @Override
    public void handlePayment(Ticket ticket) {
        // Already paid, do nothing
    }
    
    @Override
    public void handleCancel(Ticket ticket) {
        // Transition to canceled state
        ticket.setStatus(ETicketStatus.CANCELED);
        ticket.setState(new CanceledTicketState());
    }
    
    @Override
    public void handleConfirm(Ticket ticket) {
        // Already confirmed, do nothing
    }
    
    @Override
    public String getStateName() {
        return "CONFIRMED";
    }
} 