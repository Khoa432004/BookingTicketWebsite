package com.example.bookingTicket.config.state;

import com.example.bookingTicket.enums.ETicketStatus;

/**
 * Factory for creating ticket states
 */
public class TicketStateFactory {
    
    public static TicketState createState(ETicketStatus status) {
        switch (status) {
            case WAITING:
                return new WaitingTicketState();
            case CONFIRMED:
                return new ConfirmedTicketState();
            case CANCELED:
                return new CanceledTicketState();
            default:
                throw new IllegalArgumentException("Unknown ticket status: " + status);
        }
    }
} 