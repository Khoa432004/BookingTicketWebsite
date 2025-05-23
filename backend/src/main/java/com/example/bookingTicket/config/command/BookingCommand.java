package com.example.bookingTicket.config.command;

/**
 * Command interface for booking operations
 */
public interface BookingCommand {
    void execute();
    boolean canUndo();
    void undo();
} 