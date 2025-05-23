package com.example.bookingTicket.config.state;

import com.example.bookingTicket.models.Ticket;

/**
 * Interface for ticket state
 */
public interface TicketState {
    void handlePayment(Ticket ticket);
    void handleCancel(Ticket ticket);
    void handleConfirm(Ticket ticket);
    String getStateName();
} 