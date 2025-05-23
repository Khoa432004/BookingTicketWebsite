package com.example.bookingTicket.config.state;

import com.example.bookingTicket.enums.ESeatStatus;
import com.example.bookingTicket.models.Seat;

/**
 * State for seats in BOOKED status
 */
public class BookedSeatState implements SeatState {
    
    @Override
    public void handleBook(Seat seat) {
        // Already booked, throw exception
        throw new IllegalStateException("Seat is already booked");
    }
    
    @Override
    public void handleRelease(Seat seat) {
        // Transition to available state
        seat.setStatus(ESeatStatus.AVAILABLE);
        seat.setState(new AvailableSeatState());
    }
    
    @Override
    public boolean isAvailable() {
        return false;
    }
    
    @Override
    public String getStateName() {
        return "BOOKED";
    }
} 