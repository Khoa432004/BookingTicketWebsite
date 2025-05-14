package com.example.bookingTicket.controllers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.bookingTicket.dto.BusDTO;
import com.example.bookingTicket.dto.SeatDTO;
import com.example.bookingTicket.dto.TripDTO;
import com.example.bookingTicket.models.Bus;
import com.example.bookingTicket.models.Trip;
import com.example.bookingTicket.repositories.BusRepository;
import com.example.bookingTicket.services.SeatService;
import com.example.bookingTicket.services.TripService;

@RestController
@RequestMapping("/api")
public class TripController {
    @Autowired
    private TripService tripService;

    @Autowired
    private SeatService seatService;
    
    @Autowired
    private BusRepository busRepository;

    // GET /api/trips: Lấy danh sách chuyến đi với bộ lọc
    @GetMapping("/trips")
    public ResponseEntity<List<TripDTO>> getTrips(
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String date) {
        try {
            LocalDateTime parsedDate = null;
            if (date != null) {
                parsedDate = LocalDateTime.parse(date, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
            List<TripDTO> trips = tripService.getTrips(origin, destination, parsedDate);
            return ResponseEntity.ok(trips);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching trips: " + e.getMessage(), e);
        }
    }

    // GET /api/trips/{idOrTripId}: Lấy chi tiết chuyến đi
    @GetMapping("/trips/{idOrTripId}")
    public ResponseEntity<TripDTO> getTripDetails(@PathVariable String idOrTripId) {
        try {
            TripDTO tripDTO;
            try {
                Long id = Long.parseLong(idOrTripId);
                Trip trip = tripService.getTripById(id);
                tripDTO = tripService.convertToDTO(trip);
            } catch (NumberFormatException e) {
                // Nếu không phải số, xem như là tripId
                tripDTO = tripService.getTripByTripId(idOrTripId);
            }
            return ResponseEntity.ok(tripDTO);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }

    // GET /api/trips/{tripId}/seats: Lấy danh sách ghế của một chuyến xe
    @GetMapping("/trips/{tripId}/seats")
    public ResponseEntity<List<SeatDTO>> getSeatsByTripId(@PathVariable Long tripId) {
        try {
            List<SeatDTO> seats = seatService.getSeatsByTripId(tripId);
            return ResponseEntity.ok(seats);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Seats not found for trip: " + tripId, e);
        }
    }



    ///////////////////////

    // API tạo chuyến xe mới
    @PostMapping("/trips")
    public ResponseEntity<Map<String, Object>> createTrip(@RequestBody Trip trip, @RequestParam Long busId) {
        Trip createdTrip = tripService.createTrip(trip, busId);
        TripDTO tripDTO = convertToTripDTO(createdTrip);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Chuyến xe đã được tạo thành công");
        response.put("trip", tripDTO);
        return ResponseEntity.ok(response);
    }

    // Hàm chuyển đổi từ Trip sang TripDTO
    private TripDTO convertToTripDTO(Trip trip) {
        TripDTO tripDTO = new TripDTO();
        tripDTO.setId(trip.getId());
        tripDTO.setTripId(trip.getTripId());
        tripDTO.setOrigin(trip.getOrigin());
        tripDTO.setDestination(trip.getDestination());
        tripDTO.setDepartureTime(trip.getDepartureTime());
        tripDTO.setArrivalTime(trip.getArrivalTime());
        tripDTO.setBusType(trip.getBusType());
        tripDTO.setPrice(trip.getPrice());
        tripDTO.setAvailableSeats(trip.getAvailableSeats());
        tripDTO.setBusId(trip.getBus() != null ? trip.getBus().getId() : null);
        return tripDTO;
    }

    // API cập nhật chuyến xe
    @PutMapping("/trips/{id}")
    public ResponseEntity<Map<String, Object>> updateTrip(
            @PathVariable Long id,
            @RequestBody Trip trip,
            @RequestParam(required = false) Long busId) {
        Trip updatedTrip = tripService.updateTrip(id, trip, busId);
        TripDTO tripDTO = convertToTripDTO(updatedTrip); // Đảm bảo không có lỗi ở đây
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Chuyến xe đã được cập nhật thành công");
        response.put("trip", tripDTO);
        return ResponseEntity.ok(response);
    }

    // API xóa chuyến xe
        @DeleteMapping("/trips/{id}")
        public ResponseEntity<Map<String, Object>> deleteTrip(@PathVariable Long id) {
                tripService.deleteTrip(id);
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Chuyến xe đã được xóa thành công");
                return ResponseEntity.ok(response);
            }

    // Endpoint để lấy danh sách xe buýt, trả về BusDTO
    @GetMapping("/trips/buses")
    public ResponseEntity<List<BusDTO>> getBuses() {
        List<Bus> buses = busRepository.findAll();
        List<BusDTO> busDTOs = buses.stream()
                .map(this::convertToBusDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(busDTOs);
    }

    // Hàm chuyển đổi từ Bus sang BusDTO
    private BusDTO convertToBusDTO(Bus bus) {
        BusDTO busDTO = new BusDTO();
        busDTO.setId(bus.getId());
        busDTO.setBusNumber(bus.getBusNumber());
        busDTO.setBusType(bus.getBusType());
        busDTO.setTotalSeats(bus.getTotalSeats());
        return busDTO;
    }
}