package com.example.bookingTicket.strategy;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.example.bookingTicket.dto.TicketInfoProjection;
import com.example.bookingTicket.repositories.TicketRepository;

@Component
public class BookingCodeSearchStrategy implements SearchStrategy {
    @Autowired
    private TicketRepository ticketRepository;

    @Override
    public List<TicketInfoProjection> search(String keyword) {
        return ticketRepository.findByBookingCodeContaining(keyword);
    }
} 