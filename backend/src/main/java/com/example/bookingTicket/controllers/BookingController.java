package com.example.bookingTicket.controllers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookingTicket.config.command.BookingCommandInvoker;
import com.example.bookingTicket.config.command.CancelBookingCommand;
import com.example.bookingTicket.config.command.CreateBookingCommand;
import com.example.bookingTicket.dto.BookingHistoryDTO;
import com.example.bookingTicket.dto.BookingRequest;
import com.example.bookingTicket.dto.BookingResponse;
import com.example.bookingTicket.models.BookingHistory;
import com.example.bookingTicket.models.Customer;
import com.example.bookingTicket.models.Ticket;
import com.example.bookingTicket.responses.ErrorResponse;
import com.example.bookingTicket.responses.SuccessResponse;
import com.example.bookingTicket.services.BookingHistoryService;
import com.example.bookingTicket.services.CustomerService;
import com.example.bookingTicket.services.SeatService;
import com.example.bookingTicket.services.TicketService;
import com.example.bookingTicket.services.TripService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingHistoryService bookingHistoryService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private SeatService seatService;

    @Autowired
    private TripService tripService;

    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private BookingCommandInvoker commandInvoker;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getBookingsByCustomer(
            @PathVariable Long customerId,
            @RequestHeader(value = "X-User-ID", required = false) String userIdHeader) {
        try {
            // Nếu có header X-User-ID, ưu tiên sử dụng nó
            if (userIdHeader != null && !userIdHeader.isEmpty()) {
                try {
                    Long headerUserId = Long.parseLong(userIdHeader);
                    if (!headerUserId.equals(customerId)) {
                        System.out.println("Overriding URL customerId " + customerId + 
                                           " with header X-User-ID: " + headerUserId);
                        customerId = headerUserId;
                    }
                } catch (NumberFormatException e) {
                    System.err.println("Invalid X-User-ID header: " + userIdHeader);
                }
            }
            
            System.out.println("Fetching bookings for customer ID: " + customerId);
            
            // Validate customer exists
            Customer customer = customerService.findById(customerId);
            if (customer == null) {
                System.err.println("Customer not found with ID: " + customerId);
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Not Found", "Không tìm thấy thông tin khách hàng"));
            }
            
            // Get bookings and convert to DTOs
            List<BookingHistory> bookings = bookingHistoryService.findByCustomerId(customerId);
            System.out.println("Found " + bookings.size() + " bookings for customer");
            
            List<BookingHistoryDTO> bookingDTOs = bookings.stream()
                .map(booking -> {
                    try {
                        return new BookingHistoryDTO(booking);
                    } catch (Exception e) {
                        System.err.println("Error converting booking to DTO: " + e.getMessage());
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
            
            System.out.println("Converted " + bookingDTOs.size() + " bookings to DTOs");
            return ResponseEntity.ok(bookingDTOs);
            
        } catch (Exception e) {
            System.err.println("Error fetching bookings: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(new ErrorResponse("Error", "Không thể lấy lịch sử đặt vé: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody BookingRequest request, 
            HttpServletRequest servletRequest,
            @RequestHeader(value = "X-User-ID", required = false) String userIdHeader) {
        try {
            System.out.println("Received booking request: " + request);
            
            // Lấy userId từ session
            HttpSession session = servletRequest.getSession(false);
            Long customerId = 3L; // Mặc định là 3 nếu không có session
            
            // Thử lấy userId từ session
            if (session != null && session.getAttribute("userId") != null) {
                try {
                    customerId = Long.parseLong(session.getAttribute("userId").toString());
                    System.out.println("Using customerId from session: " + customerId);
                } catch (NumberFormatException e) {
                    System.err.println("Error parsing customerId from session: " + e.getMessage());
                }
            } else {
                System.out.println("No session found or userId not in session, checking header");
                
                // Nếu không có session, thử lấy từ header
                if (userIdHeader != null && !userIdHeader.isEmpty()) {
                    try {
                        customerId = Long.parseLong(userIdHeader);
                        System.out.println("Using customerId from header: " + customerId);
                    } catch (NumberFormatException e) {
                        System.err.println("Error parsing customerId from header: " + e.getMessage());
                        System.out.println("Using default customerId: " + customerId);
                    }
                } else {
                    System.out.println("No userId header found, using default customerId: " + customerId);
                }
            }

            // Validate request
            if (request.getSeatId() == null || request.getTripId() == null) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Validation Error", "Thiếu thông tin ghế hoặc chuyến xe"));
            }

            // Create and execute booking command
            CreateBookingCommand command = new CreateBookingCommand(
                request,
                customerId,
                customerService,
                seatService,
                tripService,
                ticketService,
                bookingHistoryService
            );
            
            commandInvoker.execute(command);
            
            // Get results
            BookingHistory savedBooking = command.getSavedBooking();
            Ticket savedTicket = command.getSavedTicket();
            
            // Create response DTO
            BookingResponse response = new BookingResponse(
                savedBooking.getId(),
                savedBooking.getPassengerName(),
                savedBooking.getPassengerPhone(),
                savedBooking.getPassengerEmail(),
                savedTicket.getSeat().getSeatNumber(),
                String.format("%s - %s (%s)", 
                    savedTicket.getTrip().getOrigin(), 
                    savedTicket.getTrip().getDestination(),
                    savedTicket.getTrip().getDepartureTime().format(formatter)),
                savedBooking.getBookingTime().format(formatter)
            );
            
            return ResponseEntity.ok(new SuccessResponse("Đặt vé thành công", response));
        } catch (Exception e) {
            System.err.println("Error creating booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("System Error", "Không thể đặt vé: " + e.getMessage()));
        }
    }

    /**
     * Cancel a booking and its related ticket and seat
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-ID", required = false) String userIdHeader,
            HttpServletRequest servletRequest) {
        try {
            System.out.println("Cancelling booking with ID: " + id);
            
            // Lấy userId từ session hoặc header
            HttpSession session = servletRequest.getSession(false);
            Long userId = null;
            
            if (session != null && session.getAttribute("userId") != null) {
                try {
                    userId = Long.parseLong(session.getAttribute("userId").toString());
                    System.out.println("Using userId from session: " + userId);
                } catch (NumberFormatException e) {
                    System.err.println("Error parsing userId from session: " + e.getMessage());
                }
            } else if (userIdHeader != null && !userIdHeader.isEmpty()) {
                try {
                    userId = Long.parseLong(userIdHeader);
                    System.out.println("Using userId from header: " + userId);
                } catch (NumberFormatException e) {
                    System.err.println("Error parsing userId from header: " + e.getMessage());
                }
            }
            
            // Create and execute cancel booking command
            CancelBookingCommand command = new CancelBookingCommand(
                id,
                userId,
                bookingHistoryService,
                seatService,
                ticketService
            );
            
            commandInvoker.execute(command);
            
            System.out.println("Booking cancelled successfully");
            return ResponseEntity.ok(new SuccessResponse("Success", "Hủy đặt vé thành công"));
        } catch (Exception e) {
            System.err.println("Error cancelling booking: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(new ErrorResponse("Error", "Lỗi khi hủy đặt vé: " + e.getMessage()));
        }
    }
}