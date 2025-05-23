package com.example.bookingTicket.config.state;

import com.example.bookingTicket.models.Ticket;

/**
 * State for tickets in CANCELED status
 */
public class CanceledTicketState implements TicketState {
    
    @Override
    public void handlePayment(Ticket ticket) {
        // Cannot pay for canceled ticket
        throw new IllegalStateException("Cannot pay for a canceled ticket");
    }
    
    @Override
    public void handleCancel(Ticket ticket) {
        // Already canceled, do nothing
    }
    
    @Override
    public void handleConfirm(Ticket ticket) {
        // Cannot confirm a canceled ticket
        throw new IllegalStateException("Cannot confirm a canceled ticket");
    }
    
    @Override
    public String getStateName() {
        return "CANCELED";
    }
} 