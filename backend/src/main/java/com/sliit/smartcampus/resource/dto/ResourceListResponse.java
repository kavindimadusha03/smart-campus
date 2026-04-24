package com.sliit.smartcampus.resource.dto;

import java.util.List;

public record ResourceListResponse(
        List<ResourceResponse> resources,
        int currentPage,
        int totalPages,
        long totalElements) {
}
