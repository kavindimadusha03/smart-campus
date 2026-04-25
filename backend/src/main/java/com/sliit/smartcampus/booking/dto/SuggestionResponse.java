package com.sliit.smartcampus.booking.dto;

import java.util.List;

public record SuggestionResponse(
    List<TimeSlot> nextSlots,
    List<ResourceResponse> alternatives
) { }

