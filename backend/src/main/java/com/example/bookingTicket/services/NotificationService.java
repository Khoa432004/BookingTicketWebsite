package com.example.bookingTicket.services;

import com.example.bookingTicket.enums.ENotifiType;
import com.example.bookingTicket.models.NotifiByOwner;
import com.example.bookingTicket.models.Owner;
import com.example.bookingTicket.repositories.NotifiByOwnerRepository;
import com.example.bookingTicket.services.observer.NotificationSubject;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotifiByOwnerRepository notifiByOwnerRepository;

    @Autowired
    private NotificationSubject notificationSubject;

    @Transactional
    public Map<String, Object> createNotification(String title, String content, String target, Long senderId) {
        NotifiByOwner notification = new NotifiByOwner();

        notification.setTitle(title);
        notification.setContent(content);
        notification.setDate(LocalDateTime.now());
        notification.setNotifiId("NOTIF" + System.currentTimeMillis());
        notification.setType(ENotifiType.BY_OWNER);

        String receiving;
        switch (target.toLowerCase()) {
            case "staff":
                receiving = "Staff";
                break;
            case "customer":
                receiving = "Customer";
                break;
            case "all":
                receiving = "All";
                break;
            default:
                throw new IllegalArgumentException("Đối tượng nhận không hợp lệ: " + target);
        }
        notification.setReceiving(receiving);

        Owner sender = new Owner();
        sender.setId(senderId);
        notification.setSender(sender);

        // Không lưu thông báo gốc nếu target là "All", chỉ thông báo cho observer
        if (!receiving.equals("All")) {
            notifiByOwnerRepository.save(notification);
        }

        // Thông báo cho các observer để lưu thông báo cho từng nhóm
        notificationSubject.notifyObservers(notification);

        return convertToMapForCreation(notification);
    }
    // Thông báo khi dat ve thanh cong
    @Transactional
    public Map<String, Object> notifyBookingSuccess(String content) {
        NotifiByOwner notification = new NotifiByOwner();

        // Đặt giá trị mặc định, sẽ được observer tùy chỉnh
        notification.setTitle("Thông báo hệ thống");
        notification.setContent(content);
        notification.setDate(LocalDateTime.now());
        notification.setNotifiId("BOOKING_NOTIF" + System.currentTimeMillis());
        notification.setType(ENotifiType.SYSTEM);
        notification.setReceiving("All");

        Owner sender = new Owner();
        sender.setId(2L);
        notification.setSender(sender);

        // Không lưu thông báo gốc, chỉ thông báo cho observer
        notificationSubject.notifyObservers(notification);

        return convertToMapForCreation(notification);
    }




    @Transactional
    public Map<String, Object> updateNotification(String notifiId, String title, String content, String target) {
        NotifiByOwner notification = notifiByOwnerRepository.findByNotifiId(notifiId)
                .orElseThrow(() -> new IllegalArgumentException("Thông báo không tồn tại: " + notifiId));

        notification.setTitle(title);
        notification.setContent(content);

        String receiving;
        switch (target.toLowerCase()) {
            case "staff":
                receiving = "Staff";
                break;
            case "customer":
                receiving = "Customer";
                break;
            case "all":
                receiving = "All";
                break;
            default:
                throw new IllegalArgumentException("Đối tượng nhận không hợp lệ: " + target);
        }
        notification.setReceiving(receiving);

        // Không lưu thông báo gốc nếu target là "All", chỉ thông báo cho observer
        if (!receiving.equals("All")) {
            notifiByOwnerRepository.save(notification);
        }

        // Thông báo cho các observer khi cập nhật
        notificationSubject.notifyObservers(notification);

        return convertToMapForCreation(notification);
    }

    @Transactional
    public void deleteNotification(String notificationId) {
        NotifiByOwner notification = notifiByOwnerRepository.findByNotifiId(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Thông báo không tồn tại."));
        notifiByOwnerRepository.delete(notification);
    }

    public List<Map<String, Object>> getAllNotifications() {
        try {
            System.out.println("Inside getAllNotifications at " + new java.util.Date());
            List<NotifiByOwner> notifications = notifiByOwnerRepository.findAll();
            System.out.println("Notifications fetched: " + (notifications != null ? notifications.size() : 0));
            return notifications.stream().map(notification -> {
                Map<String, Object> notificationMap = new HashMap<>();
                notificationMap.put("id", notification.getNotifiId());
                notificationMap.put("title", notification.getTitle());
                notificationMap.put("content", notification.getContent());
                notificationMap.put("target", notification.getReceiving());
                notificationMap.put("createdAt", notification.getDate().toString());
                return notificationMap;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.out.println("Error in getAllNotifications: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi lấy thông báo: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> convertToMapForCreation(NotifiByOwner notification) {
        Map<String, Object> map = new HashMap<>();

        map.put("id", notification.getNotifiId() != null ? notification.getNotifiId() : "NOTIF" + notification.getId());
        map.put("title", notification.getTitle());
        map.put("content", notification.getContent());
        map.put("target", notification.getReceiving().toLowerCase());
        map.put("createdAt", notification.getDate() != null
                ? notification.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))
                : "N/A");

        return map;
    }
}