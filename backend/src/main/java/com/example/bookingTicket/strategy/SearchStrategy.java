package com.example.bookingTicket.strategy;

import java.util.List;
import com.example.bookingTicket.dto.TicketInfoProjection;

public interface SearchStrategy {
    List<TicketInfoProjection> search(String keyword);
} 