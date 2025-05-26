package com.example.bookingTicket.services.observer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.bookingTicket.enums.ENotifiType;
import com.example.bookingTicket.models.NotifiByOwner;
import com.example.bookingTicket.repositories.NotifiByOwnerRepository;

@Component
public class CustomerNotificationObserver implements NotificationObserver {
    private final NotifiByOwnerRepository notifiByOwnerRepository;

    @Autowired
    public CustomerNotificationObserver(NotifiByOwnerRepository notifiByOwnerRepository) {
        this.notifiByOwnerRepository = notifiByOwnerRepository;
    }

    @Override
    public void onNotificationSaved(NotifiByOwner notification) {
        String target = notification.getReceiving().toLowerCase();
        if (target.equals("customer") || target.equals("all")) {
            NotifiByOwner customerNotification = new NotifiByOwner();
            customerNotification.setNotifiId(notification.getNotifiId());
            customerNotification.setTitle(notification.getTitle());
            customerNotification.setContent(notification.getContent());
            customerNotification.setDate(notification.getDate());
            customerNotification.setType(notification.getType());
            customerNotification.setReceiving("Customer");
            customerNotification.setSender(notification.getSender());


            try {
                notifiByOwnerRepository.save(customerNotification);
                System.out.println("Đã lưu thông báo cho nhóm Customer");
            } catch (Exception e) {
                System.err.println("Lỗi khi lưu thông báo cho nhóm Customer: " + e.getMessage());
            }
        }
    }
}