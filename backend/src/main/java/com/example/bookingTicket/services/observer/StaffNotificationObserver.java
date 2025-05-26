package com.example.bookingTicket.services.observer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.bookingTicket.models.NotifiByOwner;
import com.example.bookingTicket.repositories.NotifiByOwnerRepository;

@Component
public class StaffNotificationObserver implements NotificationObserver {
    private final NotifiByOwnerRepository notifiByOwnerRepository;

    @Autowired
    public StaffNotificationObserver(NotifiByOwnerRepository notifiByOwnerRepository) {
        this.notifiByOwnerRepository = notifiByOwnerRepository;
    }

    @Override
    public void onNotificationSaved(NotifiByOwner notification) {
        String target = notification.getReceiving().toLowerCase();
        if (target.equals("staff") || target.equals("all")) {
            NotifiByOwner staffNotification = new NotifiByOwner();
            staffNotification.setNotifiId(notification.getNotifiId());
            staffNotification.setTitle(notification.getTitle());
            staffNotification.setContent(notification.getContent());
            staffNotification.setDate(notification.getDate());
            staffNotification.setType(notification.getType());
            staffNotification.setReceiving("Staff");
            staffNotification.setSender(notification.getSender());

            try {
                notifiByOwnerRepository.save(staffNotification);
                System.out.println("Đã lưu thông báo cho nhóm Staff");
            } catch (Exception e) {
                System.err.println("Lỗi khi lưu thông báo cho nhóm Staff: " + e.getMessage());
            }
        }
    }
}