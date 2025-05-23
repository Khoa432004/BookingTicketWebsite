package com.example.bookingTicket.config.state;

import com.example.bookingTicket.enums.ETicketStatus;
import com.example.bookingTicket.models.Ticket;

/**
 * State for tickets in WAITING status
 */
public class WaitingTicketState implements TicketState {
    
    @Override
    public void handlePayment(Ticket ticket) {
        // Transition to confirmed state
        ticket.setStatus(ETicketStatus.CONFIRMED);
        ticket.setState(new ConfirmedTicketState());
    }
    
    @Override
    public void handleCancel(Ticket ticket) {
        // Transition to canceled state
        ticket.setStatus(ETicketStatus.CANCELED);
        ticket.setState(new CanceledTicketState());
    }
    
    @Override
    public void handleConfirm(Ticket ticket) {
        // Transition to confirmed state
        ticket.setStatus(ETicketStatus.CONFIRMED);
        ticket.setState(new ConfirmedTicketState());
    }
    
    @Override
    public String getStateName() {
        return "WAITING";
    }
} 