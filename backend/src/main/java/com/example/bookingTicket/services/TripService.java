package com.example.bookingTicket.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.bookingTicket.dto.BusDTO;
import com.example.bookingTicket.dto.TripDTO;
import com.example.bookingTicket.models.Bus;
import com.example.bookingTicket.models.Trip;
import com.example.bookingTicket.repositories.BusRepository;
import com.example.bookingTicket.repositories.TripRepository;

import jakarta.transaction.Transactional;

@Service
public class TripService {
    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private SeatService seatService;
    
    @Autowired
    private BusRepository busRepository;

    // Lấy danh sách chuyến đi với bộ lọc
    public List<TripDTO> getTrips(String origin, String destination, LocalDateTime date) {
        List<Trip> trips;
        if (origin != null && destination != null && date != null) {
            trips = tripRepository.findTripsByFilters(origin, destination, date);
        } else {
            trips = tripRepository.findAll();
        }
        return trips.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TripDTO convertToDTO(Trip trip) {
        TripDTO dto = new TripDTO();
        dto.setId(trip.getId());
        dto.setTripId(trip.getTripId());
        dto.setOrigin(trip.getOrigin());
        dto.setDestination(trip.getDestination());
        dto.setDepartureTime(trip.getDepartureTime());
        dto.setArrivalTime(trip.getArrivalTime());
        dto.setBusType(trip.getBusType());
        dto.setPrice(trip.getPrice());
        dto.setAvailableSeats(trip.getAvailableSeats());

        if (trip.getBus() != null) {
            BusDTO busDTO = new BusDTO();
            busDTO.setId(trip.getBus().getId());
            busDTO.setBusNumber(trip.getBus().getBusNumber());
            busDTO.setBusType(trip.getBus().getBusType());
            busDTO.setTotalSeats(trip.getBus().getTotalSeats());
            dto.setBus(busDTO);
        }

        return dto;
    }

    // Lấy chi tiết chuyến đi theo tripId
    public TripDTO getTripByTripId(String tripId) {
        Trip trip = tripRepository.findByTripId(tripId);
        if (trip == null) {
            throw new RuntimeException("Trip not found with tripId: " + tripId);
        }
        return convertToDTO(trip);
    }

    // Lấy chi tiết chuyến đi theo id
    public Trip getTripById(Long id) {
        return tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
    }

    // // Tạo chuyến đi mới (dùng để thêm dữ liệu mẫu)
    // public Trip createTrip(Trip trip) {
    //     trip.setTripId(UUID.randomUUID().toString());
    //     return tripRepository.save(trip);
    // }

    public Trip findById(Long id) {
        return tripRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));
    }






    ///////////////////////////////////
    @Transactional
    public Trip createTrip(Trip trip, Long busId) {
        // Kiểm tra busId tồn tại
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe bus với ID: " + busId));

        // Kiểm tra tripId đã tồn tại chưa
        if (tripRepository.existsByTripId(trip.getTripId())) {
            throw new IllegalArgumentException("Mã chuyến xe " + trip.getTripId() + " đã tồn tại.");
        }
        // Kiểm tra xe bus có chuyến khác không (loại trừ trường hợp tạo mới)
        List<Trip> existingTrips = tripRepository.findByBusId(busId);
        if (!existingTrips.isEmpty()) {
            throw new IllegalArgumentException("Xe này đang có chuyến khác.");
        }

        // Liên kết Trip với Bus
        trip.setBus(bus);
        bus.setTrip(trip);

        // Đặt số ghế khả dụng bằng tổng số ghế của xe bus
        trip.setAvailableSeats(bus.getTotalSeats());

        return tripRepository.save(trip);
    }

    @Transactional
    public Trip updateTrip(Long id, Trip updatedTrip, Long busId) {
        Trip existingTrip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến xe với ID: " + id));

        // Cập nhật thông tin chuyến xe
        existingTrip.setOrigin(updatedTrip.getOrigin());
        existingTrip.setDestination(updatedTrip.getDestination());
        existingTrip.setDepartureTime(updatedTrip.getDepartureTime());
        existingTrip.setArrivalTime(updatedTrip.getArrivalTime());
        existingTrip.setBusType(updatedTrip.getBusType());
        existingTrip.setPrice(updatedTrip.getPrice());
        existingTrip.setAvailableSeats(updatedTrip.getAvailableSeats());

        // Kiểm tra và cập nhật Bus nếu busId thay đổi
        if (busId != null && (existingTrip.getBus() == null || !existingTrip.getBus().getId().equals(busId))) {
            Bus bus = busRepository.findById(busId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy xe bus với ID: " + busId));
            // Hủy liên kết với bus cũ (nếu có)
            if (existingTrip.getBus() != null) {
                existingTrip.getBus().setTrip(null);
            }
            // Liên kết với bus mới
            existingTrip.setBus(bus);
            bus.setTrip(existingTrip);
        }

        return tripRepository.save(existingTrip);
    }

    @Transactional
    public void deleteTrip(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chuyến xe với ID: " + id));

        // Hủy liên kết với Bus trước khi xóa
        if (trip.getBus() != null) {
            trip.getBus().setTrip(null);
        }

        tripRepository.delete(trip);
    }

    // Phương thức lấy danh sách xe bus để hiển thị trong form
    public Iterable<Bus> getAllBuses() {
        return busRepository.findAll();
    }

}