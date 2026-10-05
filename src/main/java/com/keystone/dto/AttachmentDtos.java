package com.keystone.dto;

import com.keystone.domain.Attachment;

import java.time.LocalDateTime;

public class AttachmentDtos {

    /** What the API returns about a file. The Cloudinary link is never exposed - downloads go through our API. */
    public static class Response {
        public Long id;
        public Long workOrderId;
        public String fileName;
        public String contentType;
        public Long sizeBytes;
        public String uploadedByName;
        public String uploadedByRole;
        public LocalDateTime uploadedAt;

        public static Response from(Attachment a) {
            Response r = new Response();
            r.id = a.getId();
            r.workOrderId = a.getWorkOrder() != null ? a.getWorkOrder().getId() : null;
            r.fileName = a.getFileName();
            r.contentType = a.getContentType();
            r.sizeBytes = a.getSizeBytes();
            r.uploadedByName = a.getUploadedBy().getName();
            r.uploadedByRole = a.getUploadedBy().getRole().name();
            r.uploadedAt = a.getUploadedAt();
            return r;
        }
    }
}
