package com.sliit.smartcampus.ticket;

import com.sliit.smartcampus.ticket.dto.*;
import com.sliit.smartcampus.user.UserService;
import com.sliit.smartcampus.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;

    public TicketController(TicketService ticketService, UserService userService) {
        this.ticketService = ticketService;
        this.userService = userService;
    }

    @GetMapping("/my")
    public ResponseEntity<List<TicketListResponse>> getMyTickets(Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        return ResponseEntity.ok(ticketService.getMyTickets(userId));
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<TicketListResponse>> getAssignedTickets(Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        return ResponseEntity.ok(ticketService.getAssignedTickets(userId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<TicketListResponse>> getAllTickets(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ticketService.getAllTickets(category, priority, status, search));
    }

    @GetMapping("/technicians")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public ResponseEntity<?> getTechnicians() {
    try {
        System.out.println("GET /api/tickets/technicians endpoint hit");
        List<UserResponse> technicians = userService.getTechnicians();
        System.out.println("Technicians returned: " + technicians.size());
        return ResponseEntity.ok(technicians);
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(@PathVariable Long id, Authentication auth) {
        try {
            TicketResponse ticket = ticketService.getTicketById(id);
            Long userId = Long.parseLong(auth.getPrincipal().toString());
            String role = auth.getAuthorities().iterator().next().getAuthority();
            boolean isOwner = ticket.createdById().equals(userId);
            boolean isAssignee = ticket.assignedToId() != null && ticket.assignedToId().equals(userId);
            boolean isManagerOrAdmin = "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role);

            if (!isOwner && !isAssignee && !isManagerOrAdmin) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.ok(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createTicket(
            @Valid @RequestBody CreateTicketRequest request, Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        try {
            TicketResponse ticket = ticketService.createTicket(userId, request);
            return ResponseEntity.status(201).body(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    public ResponseEntity<?> updateTicket(
            @PathVariable Long id,
            @RequestBody UpdateTicketRequest request,
            Authentication auth) {
        Long actorId = Long.parseLong(auth.getPrincipal().toString());
        try {
            return ResponseEntity.ok(ticketService.updateTicket(id, request, actorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketCommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @RequestBody CreateCommentRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        try {
            TicketCommentResponse comment = ticketService.addComment(id, userId, request);
            return ResponseEntity.status(201).body(comment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @RequestBody UpdateCommentRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        try {
            return ResponseEntity.ok(ticketService.updateComment(commentId, userId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        String role = auth.getAuthorities().iterator().next().getAuthority()
                .replace("ROLE_", "");
        try {
            ticketService.deleteComment(commentId, userId, role);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<?> addAttachment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            String fileName = (String) body.get("fileName");
            String filePath = (String) body.get("filePath");
            String fileType = (String) body.get("fileType");
            long fileSize = ((Number) body.get("fileSize")).longValue();

            TicketAttachmentResponse attachment = ticketService.addAttachment(
                    id, fileName, filePath, fileType, fileSize);
            return ResponseEntity.status(201).body(attachment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
    try {
        System.out.println("DELETE ticket endpoint hit for id = " + id);
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    } catch (IllegalArgumentException e) {
        e.printStackTrace();
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}
}