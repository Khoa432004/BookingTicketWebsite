package com.example.bookingTicket.config.state;

import com.example.bookingTicket.models.Seat;

/**
 * Interface for seat state
 */
public interface SeatState {
    void handleBook(Seat seat);
    void handleRelease(Seat seat);
    boolean isAvailable();
    String getStateName();
} 