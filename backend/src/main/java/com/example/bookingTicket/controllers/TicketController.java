package com.example.bookingTicket.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookingTicket.dto.BookingRequest;
import com.example.bookingTicket.dto.PaymentRequest;
import com.example.bookingTicket.dto.TicketInfoDTO;
import com.example.bookingTicket.dto.TicketInfoProjection;
import com.example.bookingTicket.enums.EPaymentMethod;
import com.example.bookingTicket.enums.EPaymentStatus;
import com.example.bookingTicket.models.Payment;
import com.example.bookingTicket.models.Seat;
import com.example.bookingTicket.models.Ticket;
import com.example.bookingTicket.responses.ErrorResponse;
import com.example.bookingTicket.responses.SuccessResponse;
import com.example.bookingTicket.services.TicketService;

@RestController
@RequestMapping("/api")
public class TicketController {
    @Autowired
    private TicketService ticketService;

    // GET /api/buy-tickets: Lấy danh sách ghế khả dụng
    @GetMapping("/buy-tickets")
    public ResponseEntity<List<Seat>> getBookingData() {
        List<Seat> availableSeats = ticketService.getAvailableSeats();
        return ResponseEntity.ok(availableSeats);
    }

    // POST /api/buy-tickets: Đặt vé
    @PostMapping("/buy-tickets")
    public ResponseEntity<?> bookTicket(@RequestBody BookingRequest request) {
        try {
            Ticket ticket = ticketService.bookTicket(
                    request.getSeatId(),
                    request.getCustomerId(),
                    request.getCost());
            return ResponseEntity.ok(new SuccessResponse("Success", ticket));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Error", "Seat is not available"));
        }
    }

    // GET /api/payment-details: Chuẩn bị thông tin thanh toán
    @GetMapping("/payment-details")
    public ResponseEntity<Payment> getPaymentDetails(@RequestParam Long ticketId,
            @RequestParam String paymentMethod) {
        Ticket ticket = ticketService.ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        EPaymentMethod method = EPaymentMethod.valueOf(paymentMethod.toUpperCase());
        Payment payment = ticketService.preparePayment(ticket, method);
        return ResponseEntity.ok(payment);
    }

    // POST /api/payment-details: Xử lý thanh toán
    @PostMapping("/payment-details")
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest request) {
        try {
            Payment payment = ticketService.processPayment(Long.parseLong(request.getPaymentId()));
            if (payment.getStatus() == EPaymentStatus.SUCCEEDED) {
                return ResponseEntity.ok(new SuccessResponse("Success", "Payment successful"));
            } else {
                return ResponseEntity.badRequest().body(new ErrorResponse("Error", "Payment failed"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Error", "Payment failed: " + e.getMessage()));
        }
    }

    // GET /api/staff-list-tickets
    @GetMapping("/staff/tickets")
    @CrossOrigin(origins = {"http://localhost:3002", "https://booking-ticket-website-tyxb.vercel.app"})
    public ResponseEntity<List<TicketInfoProjection>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getTicketList());
    }

    @GetMapping("/staff/tickets/search")
    @CrossOrigin(origins = {"http://localhost:3002", "https://booking-ticket-website-tyxb.vercel.app"})
    public ResponseEntity<List<TicketInfoProjection>> searchTickets(@RequestParam String q) {
        return ResponseEntity.ok(ticketService.searchTickets(q));
    }

    @GetMapping("/staff/tickets/{code}")
    public ResponseEntity<TicketInfoProjection> getTicketDetail(@PathVariable String code) {
        return ResponseEntity.ok(ticketService.getTicketDetail(code));
    }

}