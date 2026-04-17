package com.sliit.smartcampus.ticket;

import com.sliit.smartcampus.auth.User;
import com.sliit.smartcampus.auth.UserRepository;
import com.sliit.smartcampus.notification.NotificationService;
import com.sliit.smartcampus.resource.ResourceRepository;
import com.sliit.smartcampus.ticket.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock private TicketRepository ticketRepository;
    @Mock private TicketCommentRepository commentRepository;
    @Mock private TicketAttachmentRepository attachmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private TicketService ticketService;

    private Ticket sampleTicket;
    private User sampleUser;

    @BeforeEach
    void setUp() {
       sampleTicket = new Ticket(
        1L,
        null,
        1L,
        null,
        "Broken Chair",
        "Chair is broken in room 101",
        "FURNITURE",
        "MEDIUM",
        "OPEN",
        "Building A, Room 101",
        "user@test.com",
        null,
        null,
        null,
        null, // firstResponseAt
        null, // resolvedAt
        null, // closedAt
        Instant.now(), // createdAt
        Instant.now()  // updatedAt
);
        sampleUser = new User(1L, "user@test.com", "Test User", null,
                "GOOGLE", "gid", "USER", true, Instant.now(), Instant.now());
    }

    @Test
    void createTicket_blankTitle_throwsException() {
        CreateTicketRequest request = new CreateTicketRequest(
                "", "description", "FURNITURE", "LOW", "Building A",
                null, null, null);

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.createTicket(1L, request));
    }

    @Test
    void createTicket_blankDescription_throwsException() {
        CreateTicketRequest request = new CreateTicketRequest(
                "Title", "", "FURNITURE", "LOW", "Building A",
                null, null, null);

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.createTicket(1L, request));
    }

    @Test
    void createTicket_valid_returnsResponse() {
        CreateTicketRequest request = new CreateTicketRequest(
                "Broken Chair", "Chair is broken", "FURNITURE", "MEDIUM",
                "Room 101", null, "user@test.com", null);

        when(ticketRepository.save(any(), eq(1L), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), isNull()))
                .thenReturn(sampleTicket);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(attachmentRepository.findByTicketId(1L)).thenReturn(List.of());

        TicketResponse response = ticketService.createTicket(1L, request);

        assertNotNull(response);
        assertEquals("Broken Chair", response.title());
        verify(notificationService).notifyManagersAndAdmins(
                eq("NEW_TICKET"), anyString(), anyString(), eq("TICKET"), eq(1L));
    }

    @Test
    void addAttachment_exceedsLimit_throwsException() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));

        TicketAttachment att = new TicketAttachment(1L, 1L, "f.jpg", "/p", "image/jpeg", 100, Instant.now());
        when(attachmentRepository.findByTicketId(1L)).thenReturn(List.of(att, att, att));

        assertThrows(IllegalStateException.class,
                () -> ticketService.addAttachment(1L, "new.jpg", "/p", "image/jpeg", 100));
    }

    @Test
    void addComment_blankContent_throwsException() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(sampleTicket));

        CreateCommentRequest request = new CreateCommentRequest("");

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.addComment(1L, 1L, request));
    }

    @Test
    void updateComment_notAuthor_throwsException() {
        TicketComment comment = new TicketComment(1L, 1L, 2L, "content",
                false, Instant.now(), Instant.now());
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));

        UpdateCommentRequest request = new UpdateCommentRequest("edited");

        assertThrows(IllegalStateException.class,
                () -> ticketService.updateComment(1L, 1L, request));
    }

    @Test
    void deleteComment_notAuthorOrAdmin_throwsException() {
        TicketComment comment = new TicketComment(1L, 1L, 2L, "content",
                false, Instant.now(), Instant.now());
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));

        assertThrows(IllegalStateException.class,
                () -> ticketService.deleteComment(1L, 1L, "USER"));
    }

    @Test
    void deleteComment_admin_succeeds() {
        TicketComment comment = new TicketComment(1L, 1L, 2L, "content",
                false, Instant.now(), Instant.now());
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));

        assertDoesNotThrow(() -> ticketService.deleteComment(1L, 1L, "ADMIN"));
        verify(commentRepository).deleteById(1L);
    }

    @Test
    void getTicketById_notFound_throwsException() {
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.getTicketById(999L));
    }
}