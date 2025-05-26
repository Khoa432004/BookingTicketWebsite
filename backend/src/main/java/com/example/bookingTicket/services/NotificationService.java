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

        if (!receiving.equals("All")) {
            notifiByOwnerRepository.save(notification);
        }

        notificationSubject.notifyObservers(notification);

        return convertToMapForCreation(notification);
    }

    @Transactional
    public void createBookingNotification(String bookingId, Long userId, Long senderId) {
        try {
            // Tạo thông báo cho Staff
            NotifiByOwner staffNotification = new NotifiByOwner();
            staffNotification.setTitle("Đặt vé thành công");
            staffNotification.setContent("Khách hàng với ID " + userId + " đã đặt vé cho chuyến đi " + bookingId);
            staffNotification.setDate(LocalDateTime.now());
            staffNotification.setNotifiId("NOTIF_STAFF_" + System.currentTimeMillis());
            staffNotification.setType(ENotifiType.SYSTEM);
            staffNotification.setReceiving("Staff");

            Owner sender = new Owner();
            sender.setId(senderId);
            staffNotification.setSender(sender);

            notifiByOwnerRepository.save(staffNotification);
            System.out.println("Đã lưu thông báo cho Staff: " + staffNotification.getNotifiId());

            // Tạo thông báo cho userId
            NotifiByOwner userNotification = new NotifiByOwner();
            userNotification.setTitle("Xác nhận đặt vé");
            userNotification.setContent("Bạn đã đặt vé thành công");
            userNotification.setDate(LocalDateTime.now());
            userNotification.setNotifiId("NOTIF_USER_" + System.currentTimeMillis());
            userNotification.setType(ENotifiType.BY_OWNER);
            userNotification.setReceiving(userId.toString());

            userNotification.setSender(sender);

            notifiByOwnerRepository.save(userNotification);
            System.out.println("Đã lưu thông báo cho User: " + userNotification.getNotifiId());
        } catch (Exception e) {
            System.err.println("Lỗi khi lưu thông báo: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể lưu thông báo: " + e.getMessage(), e);
        }
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

        if (!receiving.equals("All")) {
            notifiByOwnerRepository.save(notification);
        }

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