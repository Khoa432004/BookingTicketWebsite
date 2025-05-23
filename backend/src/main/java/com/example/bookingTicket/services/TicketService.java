package com.example.bookingTicket.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.bookingTicket.dto.TicketInfoProjection;
import com.example.bookingTicket.enums.EPaymentMethod;
import com.example.bookingTicket.enums.EPaymentStatus;
import com.example.bookingTicket.enums.ESeatStatus;
import com.example.bookingTicket.enums.ETicketStatus;
import com.example.bookingTicket.models.BookingHistory;
import com.example.bookingTicket.models.Customer;
import com.example.bookingTicket.models.Payment;
import com.example.bookingTicket.models.Seat;
import com.example.bookingTicket.models.Ticket;
import com.example.bookingTicket.repositories.PaymentRepository;
import com.example.bookingTicket.repositories.SeatRepository;
import com.example.bookingTicket.repositories.TicketRepository;
import com.example.bookingTicket.strategy.SearchStrategyFactory;

@Service
public class TicketService {
    @Autowired
    public TicketRepository ticketRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingHistoryService bookingHistoryService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private SearchStrategyFactory searchStrategyFactory;

    // Lấy danh sách ghế khả dụng
    public List<Seat> getAvailableSeats() {
        return seatRepository.findByStatus(ESeatStatus.AVAILABLE);
    }

    // Kiểm tra ghế có khả dụng không
    public boolean checkSeatAvailability(Long seatId) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new RuntimeException("Seat not found"));
        // Ghế chỉ khả dụng khi có trạng thái là AVAILABLE
        return seat.getStatus() == ESeatStatus.AVAILABLE;
    }

    // Đặt vé
    public Ticket bookTicket(Long seatId, String customerId, double cost) {
        if (!checkSeatAvailability(seatId)) {
            throw new RuntimeException("Seat is not available");
        }

        // Lấy thông tin ghế và kiểm tra lại một lần nữa để đảm bảo
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new RuntimeException("Seat not found"));

        if (seat.getStatus() != ESeatStatus.AVAILABLE) {
            throw new RuntimeException("Seat is not available");
        }

        Customer customer = customerService.findById(Long.parseLong(customerId));

        Ticket ticket = new Ticket();
        ticket.setBookingCode(UUID.randomUUID().toString());
        ticket.setBookingDateTime(LocalDateTime.now());
        ticket.setCost(cost);
        ticket.setSeat(seat);
        ticket.setCustomer(customer);
        ticket.setStatus(ETicketStatus.WAITING);

        return ticketRepository.save(ticket);
    }

    // Save ticket
    public Ticket save(Ticket ticket) {
        return ticketRepository.save(ticket);
    }

    // Delete ticket
    public void delete(Long id) {
        ticketRepository.deleteById(id);
    }

    // Chuẩn bị thông tin thanh toán
    public Payment preparePayment(Ticket ticket, EPaymentMethod paymentMethod) {
        // Create new booking history
        BookingHistory bookingHistory = new BookingHistory();
        bookingHistory.setSeat(ticket.getSeat());
        bookingHistory.setCustomer(ticket.getCustomer());
        bookingHistory.setBookingTime(ticket.getBookingDateTime());
        BookingHistory savedHistory = bookingHistoryService.save(bookingHistory);

        // Create payment
        Payment payment = new Payment();
        payment.setAmount(Long.valueOf((long) ticket.getCost()));
        payment.setPaymentTime(LocalDateTime.now());
        payment.setStatus(paymentMethod == EPaymentMethod.BY_CASH ? EPaymentStatus.WAITING_CASH
                : EPaymentStatus.WAITING_TRANSFER);
        payment.setMethod(paymentMethod);
        payment.setBookingHistory(savedHistory);
        return paymentRepository.save(payment);
    }

    // Xử lý thanh toán
    public Payment processPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Xử lý theo phương thức thanh toán
        if (payment.getMethod() == EPaymentMethod.BY_CASH) {
            // Thanh toán tiền mặt: chuyển sang trạng thái chờ
            payment.setStatus(EPaymentStatus.WAITING_CASH);

            // Cập nhật trạng thái ticket và booking history sang CONFIRMED
            BookingHistory bookingHistory = payment.getBookingHistory();
            bookingHistory.setStatus(ETicketStatus.CONFIRMED);
            bookingHistoryService.save(bookingHistory);

            // Cập nhật ticket status
            Ticket ticket = ticketRepository.findBySeat(bookingHistory.getSeat());
            if (ticket != null) {
                ticket.setStatus(ETicketStatus.CONFIRMED);
                ticketRepository.save(ticket);
            }

        } else {
            // Chuyển khoản: chuyển sang trạng thái thành công và cập nhật ghế
            payment.setStatus(EPaymentStatus.SUCCEEDED);

            // Cập nhật trạng thái ticket và booking history sang CONFIRMED
            BookingHistory bookingHistory = payment.getBookingHistory();
            bookingHistory.setStatus(ETicketStatus.CONFIRMED);
            bookingHistoryService.save(bookingHistory);

            // Cập nhật ticket status
            Ticket ticket = ticketRepository.findBySeat(bookingHistory.getSeat());
            if (ticket != null) {
                ticket.setStatus(ETicketStatus.CONFIRMED);
                ticketRepository.save(ticket);
            }

            // Chỉ cập nhật trạng thái ghế khi thanh toán chuyển khoản thành công
            Seat seat = bookingHistory.getSeat();
            seat.setStatus(ESeatStatus.BOOKED);
            seatRepository.save(seat);
        }

        return paymentRepository.save(payment);
    }

    // Hủy vé
    public void cancelTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Cập nhật trạng thái ticket
        ticket.setStatus(ETicketStatus.CANCELED);
        ticketRepository.save(ticket);

        // Cập nhật booking history
        BookingHistory bookingHistory = bookingHistoryService.findByTicket(ticket);
        if (bookingHistory != null) {
            bookingHistory.setStatus(ETicketStatus.CANCELED);
            bookingHistoryService.save(bookingHistory);
        }

        // Cập nhật trạng thái ghế về AVAILABLE
        Seat seat = ticket.getSeat();
        seat.setStatus(ESeatStatus.AVAILABLE);
        seatRepository.save(seat);
    }

    /**
     * Find a ticket by seat
     */
    public Ticket findBySeat(Seat seat) {
        if (seat == null)
            return null;
        return ticketRepository.findBySeat(seat);
    }

    // Get Ticket List available for Staff
    public List<TicketInfoProjection> getTicketList() {
        List<TicketInfoProjection> tickets = ticketRepository.getAllTicketInfo();
        System.out.println(">>> Số lượng vé lấy được: " + tickets.size());
        return tickets;
    }

    public List<TicketInfoProjection> searchTickets(String keyword, String searchType) {
        return searchStrategyFactory.getStrategy(searchType).search(keyword);
    }

    // Service
    public TicketInfoProjection getTicketDetail(String bookingCode) {
        return ticketRepository.getTicketDetailByBookingCode(bookingCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vé"));
    }

    // Get Canceled Ticket List for Staff

}