package com.example.bookingTicket.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.bookingTicket.models.BookingHistory;
import com.example.bookingTicket.models.Ticket;
import com.example.bookingTicket.repositories.BookingHistoryRepository;

@Service
public class BookingHistoryService {
    @Autowired
    private BookingHistoryRepository bookingHistoryRepository;

    public BookingHistory save(BookingHistory bookingHistory) {
        return bookingHistoryRepository.save(bookingHistory);
    }

    public BookingHistory findById(Long id) {
        return bookingHistoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking history not found with id: " + id));
    }

    public BookingHistory findByTicket(Ticket ticket) {
        return bookingHistoryRepository.findBySeat(ticket.getSeat());
    }

    public List<BookingHistory> findByCustomerId(Long customerId) {
        return bookingHistoryRepository.findByCustomerId(customerId);
    }
    
    public void delete(Long id) {
        bookingHistoryRepository.deleteById(id);
    }
} 