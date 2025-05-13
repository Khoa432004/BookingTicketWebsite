package com.example.bookingTicket.controllers.admin;

import com.example.bookingTicket.services.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/notifications") 
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // Lấy danh sách thông báo
    @GetMapping("")
    public ResponseEntity<List<Map<String, Object>>> getNotifications(HttpServletRequest httpServletRequest) {
        try {
            List<Map<String, Object>> notifications = notificationService.getAllNotifications(httpServletRequest);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of(Map.of("error", "Lỗi khi lấy danh sách thông báo: " + e.getMessage())));
        }
    }

    // Tạo thông báo mới (dành cho Admin)
    @PostMapping("")
    public ResponseEntity<Map<String, Object>> createNotification(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpServletRequest) {
        try {
            // Lấy userId từ session
            HttpSession session = httpServletRequest.getSession(false);
            if (session == null || session.getAttribute("userId") == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Không tìm thấy phiên đăng nhập hoặc userId"));
            }
            Long userId = (Long) session.getAttribute("userId");

            // Tạo thông báo 
            Map<String, Object> notification = notificationService.createNotification(
                (String) request.get("title"),
                (String) request.get("content"),
                (String) request.get("target"),
                userId
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
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpServletRequest) {
        try {
            // Lấy userId từ session
            HttpSession session = httpServletRequest.getSession(false);
            if (session == null || session.getAttribute("userId") == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Không tìm thấy phiên đăng nhập hoặc userId"));
            }

            // Cập nhật thông báo
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
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable String notificationId,
            HttpServletRequest httpServletRequest) {
        try {
            // Lấy userId từ session
            HttpSession session = httpServletRequest.getSession(false);
            if (session == null || session.getAttribute("userId") == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Không tìm thấy phiên đăng nhập hoặc userId"));
            }

            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(Map.of("message", "Xóa thông báo thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi xóa thông báo: " + e.getMessage()));
        }
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markNotificationAsRead(
            @PathVariable String notificationId,
            HttpServletRequest httpServletRequest) {
        try {
            notificationService.markAsRead(notificationId, httpServletRequest);
            return ResponseEntity.ok(Map.of("message", "Đánh dấu thông báo là đã đọc thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi đánh dấu thông báo: " + e.getMessage()));
        }
    }
}