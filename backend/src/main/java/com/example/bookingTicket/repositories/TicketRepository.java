package com.example.bookingTicket.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.bookingTicket.dto.TicketInfoDTO;
import com.example.bookingTicket.dto.TicketInfoProjection;
import com.example.bookingTicket.models.Seat;
import com.example.bookingTicket.models.Ticket;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Ticket findByBookingCode(String bookingCode);

    Ticket findBySeat(Seat seat);

    // UC22.1
    @Query(value = """
                SELECT
                    t.booking_code AS bookingCode,
                    u.name AS customerName,
                    u.phone AS phone,
                    CONCAT(tr.origin, ' - ', tr.destination) AS route,
                    tr.arrival_time AS arrivalTime,
                    s.seat_number AS seatNumber,
                    t.status AS ticketStatus,
                    p.status AS paymentStatus
                FROM ticket t
                JOIN seat s ON s.id = t.seat_id
                JOIN trip tr ON tr.id = t.trip_id
                JOIN users u ON u.id = t.customer_id
                JOIN booking_histories h ON h.seat_id = s.id AND h.trip_id = tr.id
                JOIN payments p ON p.booking_history_id = h.id
                WHERE t.status NOT IN ('CANCELED');
            """, nativeQuery = true)
    List<TicketInfoProjection> getAllTicketInfo();

    // UC22.2
    @Query(value = """
                SELECT
                    t.booking_code AS bookingCode,
                    u.name AS customerName,
                    u.phone AS phone,
                    CONCAT(CAST(tr.origin AS CHAR), ' - ', CAST(tr.destination AS CHAR)) AS route,
                    tr.arrival_time AS arrivalTime,
                    s.seat_number AS seatNumber,
                    t.status AS ticketStatus,
                    p.status AS paymentStatus
                FROM ticket t
                JOIN seat s ON s.id = t.seat_id
                JOIN trip tr ON tr.id = t.trip_id
                JOIN users u ON u.id = t.customer_id
                JOIN booking_histories h ON h.seat_id = s.id AND h.trip_id = tr.id
                JOIN payments p ON p.booking_history_id = h.id
                WHERE
                t.status NOT IN ('CANCELED') AND (
                    t.booking_code LIKE CONCAT('%', :keyword, '%')
                  OR u.name LIKE CONCAT('%', :keyword, '%')
                  OR u.phone LIKE CONCAT('%', :keyword, '%')
                  OR tr.origin LIKE CONCAT('%', :keyword, '%')
                  OR tr.destination LIKE CONCAT('%', :keyword, '%')
                  OR t.status LIKE CONCAT('%', :keyword, '%')
                  OR p.status LIKE CONCAT('%', :keyword, '%'))
            """, nativeQuery = true)
    List<TicketInfoProjection> searchTickets(@Param("keyword") String keyword);

    @Query(value = """
                SELECT
                    t.booking_code AS bookingCode,
                    u.name AS customerName,
                    u.phone AS phone,
                    CONCAT(tr.origin, ' - ', tr.destination) AS route,
                    tr.arrival_time AS arrivalTime,
                    s.seat_number AS seatNumber,
                    t.status AS ticketStatus,
                    p.status AS paymentStatus
                FROM ticket t
                JOIN seat s ON s.id = t.seat_id
                JOIN trip tr ON tr.id = t.trip_id
                JOIN users u ON u.id = t.customer_id
                JOIN booking_histories h ON h.seat_id = s.id AND h.trip_id = tr.id
                JOIN payments p ON p.booking_history_id = h.id
                WHERE t.booking_code = :code
            """, nativeQuery = true)
    Optional<TicketInfoProjection> getTicketDetailByBookingCode(@Param("code") String code);

    @Query(value = """
        SELECT
            t.booking_code AS bookingCode,
            u.name AS customerName,
            u.phone AS phone,
            CONCAT(tr.origin, ' - ', tr.destination) AS route,
            tr.arrival_time AS arrivalTime,
            s.seat_number AS seatNumber,
            t.status AS ticketStatus,
            p.status AS paymentStatus
        FROM ticket t
        JOIN seat s ON s.id = t.seat_id
        JOIN trip tr ON tr.id = t.trip_id
        JOIN users u ON u.id = t.customer_id
        JOIN booking_histories h ON h.seat_id = s.id AND h.trip_id = tr.id
        JOIN payments p ON p.booking_history_id = h.id
        WHERE t.booking_code LIKE CONCAT('%', :keyword, '%')
        AND t.status NOT IN ('CANCELED')
    """, nativeQuery = true)
    List<TicketInfoProjection> findByBookingCodeContaining(@Param("keyword") String keyword);

    @Query(value = """
        SELECT
            t.booking_code AS bookingCode,
            u.name AS customerName,
            u.phone AS phone,
            CONCAT(tr.origin, ' - ', tr.destination) AS route,
            tr.arrival_time AS arrivalTime,
            s.seat_number AS seatNumber,
            t.status AS ticketStatus,
            p.status AS paymentStatus
        FROM ticket t
        JOIN seat s ON s.id = t.seat_id
        JOIN trip tr ON tr.id = t.trip_id
        JOIN users u ON u.id = t.customer_id
        JOIN booking_histories h ON h.seat_id = s.id AND h.trip_id = tr.id
        JOIN payments p ON p.booking_history_id = h.id
        WHERE u.name LIKE CONCAT('%', :keyword, '%')
        AND t.status NOT IN ('CANCELED')
    """, nativeQuery = true)
    List<TicketInfoProjection> findByCustomerNameContaining(@Param("keyword") String keyword);

    @Query(value = """
        SELECT
            t.booking_code AS bookingCode,
            u.name AS customerName,
            u.phone AS phone,
            CONCAT(tr.origin, ' - ', tr.destination) AS route,
            tr.arrival_time AS arrivalTime,
            s.seat_number AS seatNumber,
            t.status AS ticketStatus,
            p.status AS paymentStatus
        FROM ticket t
        JOIN seat s ON s.id = t.seat_id
        JOIN trip tr ON tr.id = t.trip_id
        JOIN users u ON u.id = t.customer_id
        JOIN booking_histories h ON h.seat_id = s.id AND h.trip_id = tr.id
        JOIN payments p ON p.booking_history_id = h.id
        WHERE u.phone LIKE CONCAT('%', :keyword, '%')
        AND t.status NOT IN ('CANCELED')
    """, nativeQuery = true)
    List<TicketInfoProjection> findByPhoneContaining(@Param("keyword") String keyword);

    @Query(value = """
        SELECT
            t.booking_code AS bookingCode,
            u.name AS customerName,
            u.phone AS phone,
            CONCAT(tr.origin, ' - ', tr.destination) AS route,
            tr.arrival_time AS arrivalTime,
            s.seat_number AS seatNumber,
            t.status AS ticketStatus,
            p.status AS paymentStatus
        FROM ticket t
        JOIN seat s ON s.id = t.seat_id
        JOIN trip tr ON tr.id = t.trip_id
        JOIN users u ON u.id = t.customer_id
        JOIN booking_histories h ON h.seat_id = s.id AND h.trip_id = tr.id
        JOIN payments p ON p.booking_history_id = h.id
        WHERE CONCAT(tr.origin, ' - ', tr.destination) LIKE CONCAT('%', :keyword, '%')
        AND t.status NOT IN ('CANCELED')
    """, nativeQuery = true)
    List<TicketInfoProjection> findByRouteContaining(@Param("keyword") String keyword);
}