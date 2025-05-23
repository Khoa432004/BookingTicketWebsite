package com.example.bookingTicket.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class SearchStrategyFactory {
    private final Map<String, SearchStrategy> strategies;

    @Autowired
    public SearchStrategyFactory(
        BookingCodeSearchStrategy bookingCodeStrategy,
        CustomerNameSearchStrategy customerNameStrategy,
        PhoneSearchStrategy phoneStrategy,
        RouteSearchStrategy routeStrategy
    ) {
        strategies = Map.of(
            "bookingcode", bookingCodeStrategy,
            "customername", customerNameStrategy,
            "phone", phoneStrategy,
            "route", routeStrategy
        );
    }

    public SearchStrategy getStrategy(String searchType) {
        return strategies.getOrDefault(searchType.toLowerCase(), 
            strategies.get("bookingcode")); // Default strategy
    }
} 