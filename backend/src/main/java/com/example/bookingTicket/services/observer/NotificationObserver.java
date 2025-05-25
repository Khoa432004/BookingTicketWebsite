package com.example.bookingTicket.services.observer;

import com.example.bookingTicket.models.NotifiByOwner;

public interface NotificationObserver {
    void onNotificationSaved(NotifiByOwner notification);
}