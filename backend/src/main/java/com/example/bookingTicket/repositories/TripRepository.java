package com.example.bookingTicket.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.bookingTicket.models.Trip;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    @Query("SELECT t FROM Trip t WHERE t.origin = :origin AND t.destination = :destination AND DATE(t.departureTime) = DATE(:date)")
    List<Trip> findTripsByFilters(@Param("origin") String origin, @Param("destination") String destination, @Param("date") LocalDateTime date);

    Trip findByTripId(String tripId);
    boolean existsByTripId(String tripId);
    List<Trip> findByBusId(Long busId);
}