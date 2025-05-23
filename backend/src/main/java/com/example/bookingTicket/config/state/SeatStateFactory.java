package com.example.bookingTicket.config.state;

import com.example.bookingTicket.enums.ESeatStatus;

/**
 * Factory for creating seat states
 */
public class SeatStateFactory {
    
    public static SeatState createState(ESeatStatus status) {
        switch (status) {
            case AVAILABLE:
                return new AvailableSeatState();
            case BOOKED:
                return new BookedSeatState();
            default:
                throw new IllegalArgumentException("Unknown seat status: " + status);
        }
    }
} 