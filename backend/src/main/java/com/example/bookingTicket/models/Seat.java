package com.example.bookingTicket.models;

import com.example.bookingTicket.config.state.SeatState;
import com.example.bookingTicket.config.state.SeatStateFactory;
import com.example.bookingTicket.enums.ESeatStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;

@Entity
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String seatNumber;

    @Enumerated(EnumType.STRING)
    private ESeatStatus status;
    
    @Transient
    private SeatState state;

    @ManyToOne
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;
    
    // State pattern methods
    public void handleBook() {
        ensureStateInitialized();
        state.handleBook(this);
    }
    
    public void handleRelease() {
        ensureStateInitialized();
        state.handleRelease(this);
    }
    
    public boolean isAvailable() {
        ensureStateInitialized();
        return state.isAvailable();
    }
    
    private void ensureStateInitialized() {
        if (state == null) {
            state = SeatStateFactory.createState(status);
        }
    }

    // Getters và Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
    
    public ESeatStatus getStatus() { return status; }
    public void setStatus(ESeatStatus status) { 
        this.status = status; 
        this.state = SeatStateFactory.createState(status);
    }
    
    public SeatState getState() {
        ensureStateInitialized();
        return state;
    }
    
    public void setState(SeatState state) {
        this.state = state;
    }
    
    public Bus getBus() { return bus; }
    public void setBus(Bus bus) { this.bus = bus; }
}