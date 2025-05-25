package com.example.bookingTicket.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import com.example.bookingTicket.services.observer.CustomerNotificationObserver;
import com.example.bookingTicket.services.observer.NotificationSubject;
import com.example.bookingTicket.services.observer.StaffNotificationObserver;

import jakarta.annotation.PostConstruct;

@Configuration
public class ObserverConfig {

    @Autowired
    private NotificationSubject notificationSubject;

    @Autowired
    private StaffNotificationObserver staffNotificationObserver;

    @Autowired
    private CustomerNotificationObserver customerNotificationObserver;

    @PostConstruct
    public void init() {
        notificationSubject.addObserver(staffNotificationObserver);
        notificationSubject.addObserver(customerNotificationObserver);
    }
}