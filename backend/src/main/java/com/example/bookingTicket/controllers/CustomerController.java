package com.example.bookingTicket.controllers;

import com.example.bookingTicket.dto.CustomerProjection;
import com.example.bookingTicket.services.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = {"http://localhost:3000", "https://booking-ticket-website-8ybe.vercel.app", "https://booking-ticket-website-tyxb.vercel.app"})
public class CustomerController {

    private final CustomerService customerService;

    @Autowired // Constructor Injection (best practice)
    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerProjection>> getAllCustomers() {
        List<CustomerProjection> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/customers/search")
    public ResponseEntity<List<CustomerProjection>> searchCustomers(@RequestParam String keyword) {
        return ResponseEntity.ok(customerService.searchCustomers(keyword));
    }

    @PutMapping("/customers/{id}/toggle-status")
    public ResponseEntity<String> toggleCustomerStatus(@PathVariable Long id) {
        customerService.toggleCustomerStatus(id);
        return ResponseEntity.ok("Cập nhật trạng thái thành công");
    }    
}
