package com.example.bookingTicket.controllers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookingTicket.dto.PaymentRequest;
import com.example.bookingTicket.enums.EPaymentMethod;
import com.example.bookingTicket.enums.EPaymentStatus;
import com.example.bookingTicket.enums.ESeatStatus;
import com.example.bookingTicket.models.BookingHistory;
import com.example.bookingTicket.models.Customer;
import com.example.bookingTicket.models.Payment;
import com.example.bookingTicket.models.Seat;
import com.example.bookingTicket.models.Trip;
import com.example.bookingTicket.responses.ErrorResponse;
import com.example.bookingTicket.responses.SuccessResponse;
import com.example.bookingTicket.services.BookingHistoryService;
import com.example.bookingTicket.services.CustomerService;
import com.example.bookingTicket.services.PaymentService;
import com.example.bookingTicket.services.SeatService;
import com.example.bookingTicket.services.TripService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Value("${vnpay.vnp_TmnCode}")
    private String vnp_TmnCode;

    @Value("${vnpay.vnp_HashSecret}")
    private String vnp_HashSecret;

    @Value("${vnpay.vnp_PayUrl}")
    private String vnp_PayUrl;

    @Value("${vnpay.vnp_ReturnUrl}")
    private String vnp_ReturnUrl;

    @Autowired
    private SeatService seatService;
    
    @Autowired
    private BookingHistoryService bookingHistoryService;
    
    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerService customerService;
    
    @Autowired
    private TripService tripService;

    @PostMapping("/prepare")
    public ResponseEntity<?> preparePayment(@RequestBody PaymentRequest request) throws Exception {
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(request.getAmount() * 100));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", String.valueOf(System.currentTimeMillis()));
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang " + request.getBookingId());
        vnp_Params.put("vnp_OrderType", "250000");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", "127.0.0.1");
        vnp_Params.put("vnp_CreateDate", String.valueOf(System.currentTimeMillis()));

        String hashData = String.join("&", vnp_Params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .toArray(String[]::new));

        String vnp_SecureHash = hmacSHA512(vnp_HashSecret, hashData);
        vnp_Params.put("vnp_SecureHash", vnp_SecureHash);

        String paymentUrl = vnp_PayUrl + "?" + hashData + "&vnp_SecureHash=" + vnp_SecureHash;
        return ResponseEntity.ok(new SuccessResponse("Success", Map.of("data", paymentUrl)));
    }

    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequest request) {
        try {
            if (request.getBookingId() == null || request.getAmount() == null || 
                request.getMethod() == null) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error", "Thiếu thông tin thanh toán"));
            }

            BookingHistory booking = bookingHistoryService.findById(request.getBookingId());
            if (booking == null) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error", "Không tìm thấy thông tin đặt vé"));
            }

            Payment payment = new Payment();
            payment.setBookingHistory(booking);
            payment.setAmount(request.getAmount().longValue());
            payment.setMethod(EPaymentMethod.valueOf(request.getMethod()));
            payment.setStatus(request.getStatus() != null ? 
                EPaymentStatus.valueOf(request.getStatus()) : 
                EPaymentStatus.WAITING_TRANSFER);
            payment.setPaymentTime(LocalDateTime.now());

            Payment savedPayment = paymentService.save(payment);

            return ResponseEntity.ok(new SuccessResponse("Success", savedPayment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Error", "Không thể tạo thanh toán: " + e.getMessage()));
        }
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<?> vnpayReturn(@RequestParam Map<String, String> queryParams) {
        String vnp_SecureHash = queryParams.get("vnp_SecureHash");
        String signValue = "";
        if (queryParams.containsKey("vnp_SecureHashType")) {
            queryParams.remove("vnp_SecureHashType");
        }
        if (queryParams.containsKey("vnp_SecureHash")) {
            queryParams.remove("vnp_SecureHash");
        }

        List<String> fieldNames = new ArrayList<>(queryParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = queryParams.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append("=");
                hashData.append(fieldValue);
                if (itr.hasNext()) {
                    hashData.append("&");
                }
            }
        }

        signValue = hmacSHA512(vnp_HashSecret, hashData.toString());
        if (signValue.equals(vnp_SecureHash)) {
            String vnp_ResponseCode = queryParams.get("vnp_ResponseCode");
            if ("00".equals(vnp_ResponseCode)) {
                return ResponseEntity.ok(new SuccessResponse("Success", "Thanh toán thành công"));
            } else {
                return ResponseEntity.badRequest().body(new ErrorResponse("Error", "Thanh toán thất bại"));
            }
        } else {
            return ResponseEntity.badRequest().body(new ErrorResponse("Error", "Invalid signature"));
        }
    }

    @PostMapping("/complete")
    public ResponseEntity<?> completePayment(@RequestBody PaymentRequest request) {
        try {
            // Cập nhật trạng thái ghế thành BOOKED
            Seat seat = seatService.getSeatById(Long.parseLong(request.getSeatId()));
            seat.setStatus(ESeatStatus.BOOKED);
            seatService.updateSeat(seat);

            // Tìm customer và trip
            Customer customer = customerService.findById(Long.parseLong(request.getUserId()));
            Trip trip = tripService.findById(Long.parseLong(request.getTripId()));

            // Tạo bản ghi booking history
            BookingHistory bookingHistory = new BookingHistory();
            bookingHistory.setCustomer(customer);
            bookingHistory.setBookingTime(LocalDateTime.now());
            bookingHistory.setSeat(seat);
            bookingHistory.setTrip(trip);
            BookingHistory savedBooking = bookingHistoryService.save(bookingHistory);

            // Tạo bản ghi payment
            Payment payment = new Payment();
            payment.setAmount(request.getAmount().longValue());
            payment.setStatus(EPaymentStatus.SUCCEEDED);
            payment.setMethod(EPaymentMethod.TRANSFER);
            payment.setBookingHistory(savedBooking);
            payment.setPaymentTime(LocalDateTime.now());
            paymentService.save(payment);

            return ResponseEntity.ok(new SuccessResponse("Payment completed successfully", savedBooking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Payment completion failed", e.getMessage()));
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac sha512_HMAC = Mac.getInstance("HmacSHA512");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes("UTF-8"), "HmacSHA512");
            sha512_HMAC.init(secret_key);
            byte[] hash = sha512_HMAC.doFinal(data.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
} 