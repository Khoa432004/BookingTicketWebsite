package com.example.bookingTicket.services;

import com.example.bookingTicket.enums.EAccType;
import com.example.bookingTicket.enums.ENotifiType;
import com.example.bookingTicket.models.Account;
import com.example.bookingTicket.models.NotifiByOwner;
import com.example.bookingTicket.models.Notification;
import com.example.bookingTicket.models.Owner;
import com.example.bookingTicket.models.UserNotification;
import com.example.bookingTicket.repositories.AccountRepository;
import com.example.bookingTicket.repositories.NotifiByOwnerRepository;
import com.example.bookingTicket.repositories.UserNotificationRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private UserNotificationRepository userNotificationRepository;

    @Autowired
    private NotifiByOwnerRepository notifiByOwnerRepository;

    @Autowired
    private AccountRepository accountRepository;

    public List<Map<String, Object>> getNotificationsForUser(String userName) {
        Account account = accountRepository.findByUserName(userName);
        if (account == null) {
            throw new IllegalArgumentException("User không tồn tại.");
        }

        List<UserNotification> userNotifications = userNotificationRepository.findByAccount(account);
        EAccType userType = account.getType();

        return userNotifications.stream()
                .filter(userNotification -> {
                    Notification notification = userNotification.getNotification();
                    String receiving = notification.getReceiving().toLowerCase();

                    if ("ADMIN".equals(userType)) {
                        return true;
                    } else if ("STAFF".equals(userType)) {
                        return receiving.equals("staff") || receiving.equals("all");
                    } else if ("CUSTOMER".equals(userType)) {
                        return receiving.equals("customer") || receiving.equals("all");
                    }
                    return false;
                })
                .map(this::convertToMap)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createNotification(String title, String content, String target, Long senderId) {
        NotifiByOwner notification = new NotifiByOwner();

        notification.setTitle(title);
        notification.setContent(content);
        notification.setDate(LocalDateTime.now());
        notification.setNotifiId("NOTIF" + System.currentTimeMillis());
        notification.setType(ENotifiType.SYSTEM);

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

        notifiByOwnerRepository.save(notification);

        // Thêm bản ghi vào bảng usernotification
        createUserNotifications(notification);

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

        notifiByOwnerRepository.save(notification);

        return convertToMapForCreation(notification);
    }

    @Transactional
    public void deleteNotification(String notificationId) {
        NotifiByOwner notification = notifiByOwnerRepository.findByNotifiId(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Thông báo không tồn tại."));
        notifiByOwnerRepository.delete(notification);
    }

    public List<Map<String, Object>> getAllNotifications(HttpServletRequest httpServletRequest) {
        HttpSession session = httpServletRequest.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new IllegalArgumentException("Không tìm thấy phiên đăng nhập hoặc userId");
        }

        Integer userId = ((Long) session.getAttribute("userId")).intValue();
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản: " + userId));

        // Lấy tất cả thông báo từ bảng notifications
        List<NotifiByOwner> notifications = notifiByOwnerRepository.findAll();
        return notifications.stream().map(notification -> {
            Map<String, Object> notificationMap = new HashMap<>();
            notificationMap.put("id", notification.getNotifiId());
            notificationMap.put("title", notification.getTitle());
            notificationMap.put("content", notification.getContent());
            notificationMap.put("target", notification.getReceiving());
            notificationMap.put("createdAt", notification.getDate().toString());

            // Lấy trạng thái read từ bảng user_notification cho người dùng hiện tại
            Optional<UserNotification> userNotification = userNotificationRepository
                    .findByAccountAndNotification(account, notification);
            boolean isRead = userNotification.map(UserNotification::isRead).orElse(false);
            notificationMap.put("read", isRead);

            return notificationMap;
        }).collect(Collectors.toList());
    }

    private void createUserNotifications(Notification notification) {
        String target = notification.getReceiving() != null ? notification.getReceiving().toLowerCase() : "";
        System.out.println("Target: " + target);

        List<Account> accounts;
        try {
            if (target.equals("all")) {
                accounts = accountRepository.findAll();
            } else if (target.equals("staff")) {
                accounts = accountRepository.findByType(EAccType.STAFF);
            } else if (target.equals("customer")) {
                accounts = accountRepository.findByType(EAccType.CUSTOMER);
            } else {
                System.out.println("Target không hợp lệ: " + target);
                return;
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy danh sách tài khoản: " + e.getMessage());
            return;
        }

        System.out.println("Số lượng tài khoản tìm thấy: " + accounts.size());
        if (accounts.isEmpty()) {
            System.out.println("Không tìm thấy tài khoản phù hợp để tạo UserNotification.");
            return;
        }

        for (Account account : accounts) {
            System.out.println("Kiểm tra tài khoản: " + account.getUserId() + ", type: " + account.getType());
            if (account.getType() == EAccType.OWNER) {
                System.out.println("Bỏ qua tài khoản OWNER: " + account.getUserId());
                continue;
            }

            UserNotification userNotification = new UserNotification();
            userNotification.setAccount(account);
            userNotification.setNotification(notification);
            userNotification.setRead(false);
            try {
                userNotificationRepository.save(userNotification);
                System.out.println("Đã lưu UserNotification cho tài khoản: " + account.getUserId());
            } catch (Exception e) {
                System.err.println("Lỗi khi lưu UserNotification cho tài khoản " + account.getUserId() + ": " + e.getMessage());
            }
        }
    }

    private Map<String, Object> convertToMap(UserNotification userNotification) {
        Notification notification = userNotification.getNotification();
        Map<String, Object> map = new HashMap<>();

        map.put("id", notification.getNotifiId() != null ? notification.getNotifiId() : "NOTIF" + notification.getId());
        map.put("title", notification.getTitle());
        map.put("content", notification.getContent());

        String time = notification.getDate() != null
                ? notification.getDate().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                : "N/A";
        map.put("time", time);

        ENotifiType type = notification.getType();
        String typeString;
        String title;
        switch (type) {
            case BY_OWNER:
                typeString = "booking";
                title = "TBAO bởi chủ sở hữu";
                break;
            case SYSTEM:
                typeString = "payment";
                title = "TBAO bởi hệ thống";
                break;
            default:
                typeString = "system";
                title = "Thông báo hệ thống";
        }
        map.put("type", typeString);
        map.put("title", title);
        map.put("read", userNotification.isRead());

        return map;
    }

    private Map<String, Object> convertToMapForCreation(Notification notification) {
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
                    // Loại bỏ "read" vì không cần đánh dấu đã xem
                    return notificationMap;
                }).collect(Collectors.toList());
            } catch (Exception e) {
                System.out.println("Error in getAllNotifications: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Lỗi khi lấy thông báo: " + e.getMessage(), e);
            }
        }
}