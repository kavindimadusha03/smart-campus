package com.sliit.smartcampus.ticket;

import com.sliit.smartcampus.auth.User;
import com.sliit.smartcampus.auth.UserRepository;
import com.sliit.smartcampus.notification.NotificationService;
import com.sliit.smartcampus.resource.ResourceRepository;
import com.sliit.smartcampus.resource.Resource;
import com.sliit.smartcampus.ticket.dto.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository,
                         TicketCommentRepository commentRepository,
                         TicketAttachmentRepository attachmentRepository,
                         UserRepository userRepository,
                         ResourceRepository resourceRepository,
                         NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
    }

    public TicketResponse createTicket(Long userId, CreateTicketRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (req.description() == null || req.description().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (req.category() == null || req.category().isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (req.priority() == null || req.priority().isBlank()) {
            throw new IllegalArgumentException("Priority is required");
        }
        if (req.location() == null || req.location().isBlank()) {
            throw new IllegalArgumentException("Location is required");
        }

        Ticket ticket = ticketRepository.save(
                req.resourceId(), userId, req.title(), req.description(),
                req.category(), req.priority(), req.location(),
                req.contactEmail(), req.contactPhone());

        User user = userRepository.findById(userId).orElse(null);
        String userName = user != null ? user.name() : "A user";

        notificationService.notifyManagersAndAdmins(
                "NEW_TICKET",
                "New Incident Report",
                userName + " reported: " + req.title(),
                "TICKET",
                ticket.id());

        return toDetailResponse(ticket);
    }

    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        return toDetailResponse(ticket);
    }

    public List<TicketListResponse> getMyTickets(Long userId) {
        return ticketRepository.findByCreatedBy(userId).stream()
                .map(this::toListResponse)
                .toList();
    }

    public List<TicketListResponse> getAssignedTickets(Long userId) {
        return ticketRepository.findByAssignedTo(userId).stream()
                .map(this::toListResponse)
                .toList();
    }

    public List<TicketListResponse> getAllTickets(String category, String priority,
                                                  String status, String search) {
        return ticketRepository.findAll(category, priority, status, search).stream()
                .map(this::toListResponse)
                .toList();
    }

    public TicketResponse updateTicket(Long id, UpdateTicketRequest req, Long actorId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (req.assignedTo() != null) {
            ticketRepository.updateAssignment(id, req.assignedTo());

            User assignee = userRepository.findById(req.assignedTo()).orElse(null);
            String assigneeName = assignee != null ? assignee.name() : "A technician";

            notificationService.notify(
                    req.assignedTo(),
                    "TICKET_ASSIGNED",
                    "Ticket Assigned",
                    "You have been assigned to: " + ticket.title(),
                    "TICKET",
                    id);
        }

        if (req.status() != null) {
            if ("IN_PROGRESS".equals(req.status()) && ticket.firstResponseAt() == null) {
                ticketRepository.markFirstResponseIfUnset(id);
            }

            if ("REJECTED".equals(req.status())) {
                ticketRepository.reject(id, req.rejectionReason());
            } else {
                ticketRepository.updateStatus(id, req.status(), req.resolutionNotes());
            }

            notificationService.notify(
                    ticket.createdBy(),
                    "TICKET_STATUS_CHANGE",
                    "Ticket Status Updated",
                    "Your ticket \"" + ticket.title() + "\" status changed to " + req.status(),
                    "TICKET",
                    id);

            if (ticket.assignedTo() != null && !ticket.assignedTo().equals(ticket.createdBy())) {
                notificationService.notify(
                        ticket.assignedTo(),
                        "TICKET_STATUS_CHANGE",
                        "Ticket Status Updated",
                        "Ticket \"" + ticket.title() + "\" status changed to " + req.status(),
                        "TICKET",
                        id);
            }
        }

        return getTicketById(id);
    }

    public TicketCommentResponse addComment(Long ticketId, Long userId, CreateCommentRequest req) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (req.content() == null || req.content().isBlank()) {
            throw new IllegalArgumentException("Comment content is required");
        }

        TicketComment comment = commentRepository.save(ticketId, userId, req.content());

        User commenter = userRepository.findById(userId).orElse(null);
        String commenterName = commenter != null ? commenter.name() : "Someone";

        if (!ticket.createdBy().equals(userId)) {
            notificationService.notify(
                    ticket.createdBy(),
                    "NEW_COMMENT",
                    "New Comment on Ticket",
                    commenterName + " commented on \"" + ticket.title() + "\"",
                    "COMMENT",
                    ticketId);
        }
        if (ticket.assignedTo() != null && !ticket.assignedTo().equals(userId)) {
            notificationService.notify(
                    ticket.assignedTo(),
                    "NEW_COMMENT",
                    "New Comment on Ticket",
                    commenterName + " commented on \"" + ticket.title() + "\"",
                    "COMMENT",
                    ticketId);
        }

        return toCommentResponse(comment);
    }

    public TicketCommentResponse updateComment(Long commentId, Long userId, UpdateCommentRequest req) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.userId().equals(userId)) {
            throw new IllegalStateException("Only the comment author can edit");
        }

        if (req.content() == null || req.content().isBlank()) {
            throw new IllegalArgumentException("Comment content is required");
        }

        commentRepository.update(commentId, req.content());

        TicketComment updated = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        return toCommentResponse(updated);
    }

    public void deleteComment(Long commentId, Long userId, String userRole) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.userId().equals(userId) && !"ADMIN".equals(userRole)) {
            throw new IllegalStateException("Only the comment author or ADMIN can delete");
        }

        commentRepository.deleteById(commentId);
    }

    public List<TicketCommentResponse> getComments(Long ticketId) {
        return commentRepository.findByTicketId(ticketId).stream()
                .map(this::toCommentResponse)
                .toList();
    }

    public TicketAttachmentResponse addAttachment(Long ticketId, String fileName,
                                                  String filePath, String fileType, long fileSize) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        long existingCount = attachmentRepository.findByTicketId(ticketId).size();
        if (existingCount >= 3) {
            throw new IllegalStateException("Maximum of 3 attachments per ticket allowed");
        }

        TicketAttachment attachment = attachmentRepository.save(
                ticketId, fileName, filePath, fileType, fileSize);

        return new TicketAttachmentResponse(
                attachment.id(), attachment.fileName(),
                attachment.filePath(), attachment.fileType(), attachment.fileSize());
    }

    public void deleteTicket(Long id) {
        ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        int deleted = ticketRepository.deleteById(id);
        if (deleted == 0) {
            throw new IllegalArgumentException("Ticket not found");
        }
    }

    private Long minutesBetween(java.time.Instant start, java.time.Instant end) {
        if (start == null || end == null) return null;
        return java.time.Duration.between(start, end).toMinutes();
    }

    private TicketResponse toDetailResponse(Ticket t) {
        User creator = userRepository.findById(t.createdBy()).orElse(null);
        User assignee = t.assignedTo() != null
                ? userRepository.findById(t.assignedTo()).orElse(null) : null;

        String resourceName = null;
        if (t.resourceId() != null) {
            Resource resource = resourceRepository.findById(t.resourceId()).orElse(null);
            resourceName = resource != null ? resource.name() : null;
        }

        List<TicketAttachmentResponse> attachments = attachmentRepository.findByTicketId(t.id())
                .stream()
                .map(a -> new TicketAttachmentResponse(
                        a.id(), a.fileName(), a.filePath(), a.fileType(), a.fileSize()))
                .toList();

        java.time.Instant resolutionEnd = t.closedAt() != null ? t.closedAt() : t.resolvedAt();
        Long timeToFirstResponseMinutes = minutesBetween(t.createdAt(), t.firstResponseAt());
        Long timeToResolutionMinutes = minutesBetween(t.createdAt(), resolutionEnd);

        return new TicketResponse(
                t.id(),
                "TK-" + t.id(),
                t.title(),
                t.description(),
                t.category(),
                t.priority(),
                t.status(),
                t.location(),
                t.resourceId(),
                resourceName,
                t.contactEmail(),
                t.contactPhone(),
                t.createdBy(),
                creator != null ? creator.name() : null,
                creator != null ? creator.profilePicture() : null,
                t.assignedTo(),
                assignee != null ? assignee.name() : null,
                assignee != null ? assignee.profilePicture() : null,
                t.rejectionReason(),
                t.resolutionNotes(),
                t.firstResponseAt(),
                timeToFirstResponseMinutes,
                t.resolvedAt(),
                t.closedAt(),
                timeToResolutionMinutes,
                t.createdAt(),
                t.updatedAt(),
                attachments);
    }

    private TicketListResponse toListResponse(Ticket t) {
        String assignedToName = null;
        if (t.assignedTo() != null) {
            User assignee = userRepository.findById(t.assignedTo()).orElse(null);
            assignedToName = assignee != null ? assignee.name() : null;
        }

        return new TicketListResponse(
                t.id(),
                "TK-" + t.id(),
                t.title(),
                t.category(),
                t.priority(),
                t.status(),
                t.location(),
                assignedToName,
                t.createdAt());
    }

    private TicketCommentResponse toCommentResponse(TicketComment c) {
        User user = userRepository.findById(c.userId()).orElse(null);
        return new TicketCommentResponse(
                c.id(),
                c.userId(),
                user != null ? user.name() : null,
                user != null ? user.role() : null,
                c.content(),
                c.isEdited(),
                c.createdAt());
    }
}