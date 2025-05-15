package com.example.bookingTicket.controllers.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookingTicket.services.NotificationService;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "https://booking-ticket-website-8ybe.vercel.app", allowCredentials = "true")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // Lấy danh sách thông báo (không cần session)
    @GetMapping("")
    public ResponseEntity<List<Map<String, Object>>> getNotifications() {
        try {
            System.out.println("Handling GET request for /api/notifications at " + new java.util.Date());
            List<Map<String, Object>> notifications = notificationService.getAllNotifications(); // Lấy tất cả thông báo
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of(Map.of("error", "Lỗi khi lấy danh sách thông báo: " + e.getMessage())));
        }
    }

    // Tạo thông báo mới 
    @PostMapping("")
    public ResponseEntity<Map<String, Object>> createNotification(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> notification = notificationService.createNotification(
                (String) request.get("title"),
                (String) request.get("content"),
                (String) request.get("target"),
                2L 
            );
            return ResponseEntity.ok(notification);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Cập nhật thông báo
    @PutMapping("/{notificationId}")
    public ResponseEntity<Map<String, Object>> updateNotification(
            @PathVariable String notificationId,
            @RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> updatedNotification = notificationService.updateNotification(
                notificationId,
                (String) request.get("title"),
                (String) request.get("content"),
                (String) request.get("target")
            );
            return ResponseEntity.ok(updatedNotification);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi cập nhật thông báo: " + e.getMessage()));
        }
    }

    // Xóa thông báo
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Map<String, Object>> deleteNotification(@PathVariable String notificationId) {
        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(Map.of("message", "Xóa thông báo thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi xóa thông báo: " + e.getMessage()));
        }
    }
}