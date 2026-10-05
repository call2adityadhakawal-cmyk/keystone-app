package com.keystone.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A photo or video uploaded by a customer or technician for a work order. The file itself lives on
 * Cloudinary as a private ("authenticated") asset; this row only keeps what we need
 * to find it again and to show who sent it.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long sizeBytes;

    // Cloudinary identifiers - needed to build a signed download link and to delete the file.
    @Column(nullable = false, length = 500)
    private String cloudinaryPublicId;

    @Column(nullable = false)
    private String cloudinaryResourceType;

    private String cloudinaryFormat;

    // Every photo/video belongs to one job. Kept nullable in the DB only so older rows don't break the schema update.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id")
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }
}
