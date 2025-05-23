package com.example.bookingTicket.config.state;

import com.example.bookingTicket.enums.ESeatStatus;
import com.example.bookingTicket.models.Seat;

/**
 * State for seats in AVAILABLE status
 */
public class AvailableSeatState implements SeatState {
    
    @Override
    public void handleBook(Seat seat) {
        // Transition to booked state
        seat.setStatus(ESeatStatus.BOOKED);
        seat.setState(new BookedSeatState());
    }
    
    @Override
    public void handleRelease(Seat seat) {
        // Already available, do nothing
    }
    
    @Override
    public boolean isAvailable() {
        return true;
    }
    
    @Override
    public String getStateName() {
        return "AVAILABLE";
    }
} 