package com.example.bookingTicket.services.observer;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.example.bookingTicket.models.NotifiByOwner;

@Component
public class NotificationSubject {
    private final List<NotificationObserver> observers = new ArrayList<>();

    public void addObserver(NotificationObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(NotificationObserver observer) {
        observers.remove(observer);
    }

    public void notifyObservers(NotifiByOwner notification) {
        for (NotificationObserver observer : observers) {
            observer.onNotificationSaved(notification);
        }
    }
}