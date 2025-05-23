package com.example.bookingTicket.config.command;

import java.util.Stack;

import org.springframework.stereotype.Component;

/**
 * Invoker for booking commands
 */
@Component
public class BookingCommandInvoker {
    private final Stack<BookingCommand> executedCommands = new Stack<>();
    
    public void execute(BookingCommand command) {
        command.execute();
        executedCommands.push(command);
    }
    
    public boolean canUndo() {
        return !executedCommands.isEmpty() && executedCommands.peek().canUndo();
    }
    
    public void undo() {
        if (canUndo()) {
            BookingCommand command = executedCommands.pop();
            command.undo();
        } else {
            throw new RuntimeException("No command to undo");
        }
    }
} 