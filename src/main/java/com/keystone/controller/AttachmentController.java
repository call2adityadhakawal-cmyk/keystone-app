package com.keystone.controller;

import com.keystone.domain.Attachment;
import com.keystone.dto.AttachmentDtos;
import com.keystone.service.AttachmentService;
import com.keystone.service.AuthService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Role split asked for by the mentor:
 *  - CUSTOMER and TECHNICIAN can upload.
 *  - DISPATCHER and MANAGER (the admin side) can list, download and delete.
 */
@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final AuthService authService;

    public AttachmentController(AttachmentService attachmentService, AuthService authService) {
        this.attachmentService = attachmentService;
        this.authService = authService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CUSTOMER','TECHNICIAN')")
    public AttachmentDtos.Response upload(@RequestParam("workOrderId") Long workOrderId,
                                          @RequestParam("file") MultipartFile file, Authentication auth) {
        return attachmentService.upload(workOrderId, file, authService.currentUser(auth.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public List<AttachmentDtos.Response> list(@RequestParam(value = "workOrderId", required = false) Long workOrderId) {
        return attachmentService.list(workOrderId);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public ResponseEntity<InputStreamResource> download(@PathVariable Long id) {
        Attachment a = attachmentService.get(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(a.getFileName(), StandardCharsets.UTF_8).build().toString())
                .contentType(MediaType.parseMediaType(a.getContentType()))
                .body(new InputStreamResource(attachmentService.openStream(a)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public Map<String, String> delete(@PathVariable Long id) {
        attachmentService.delete(id);
        return Map.of("message", "File deleted successfully");
    }
}
