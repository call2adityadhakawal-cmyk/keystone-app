package com.keystone.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.keystone.domain.Attachment;
import com.keystone.domain.User;
import com.keystone.domain.WorkOrder;
import com.keystone.dto.AttachmentDtos;
import com.keystone.exception.ApiExceptions.BadRequestException;
import com.keystone.exception.ApiExceptions.NotFoundException;
import com.keystone.repository.AttachmentRepository;
import com.keystone.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Upload / download of photos and videos. Who may call what is decided in
 * AttachmentController with @PreAuthorize; this class does the file work.
 */
@Service
public class AttachmentService {

    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "video/mp4");
    private static final String CLOUD_FOLDER = "keystone";
    // "authenticated" = private on Cloudinary: the file can only be fetched with a signed link we generate.
    private static final String DELIVERY_TYPE = "authenticated";

    private final AttachmentRepository attachmentRepository;
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderService workOrderService;
    private final Cloudinary cloudinary;

    public AttachmentService(AttachmentRepository attachmentRepository, WorkOrderRepository workOrderRepository,
                             WorkOrderService workOrderService, Cloudinary cloudinary) {
        this.attachmentRepository = attachmentRepository;
        this.workOrderRepository = workOrderRepository;
        this.workOrderService = workOrderService;
        this.cloudinary = cloudinary;
    }

    /**
     * A customer can only attach to their own organisation's jobs and a technician only to jobs
     * assigned to them - the same visibility rule as viewing the work order, so we reuse it.
     */
    @Transactional
    public AttachmentDtos.Response upload(Long workOrderId, MultipartFile file, User uploader) {
        workOrderService.getOne(workOrderId, uploader); // throws Forbidden / NotFound
        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found"));
        validate(file);
        requireCloudinaryConfigured();

        Map<?, ?> result;
        try {
            result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", CLOUD_FOLDER,
                    "resource_type", "auto",
                    "type", DELIVERY_TYPE));
        } catch (IOException | RuntimeException ex) {
            throw new IllegalStateException("Upload to Cloudinary failed: " + ex.getMessage(), ex);
        }

        Attachment a = new Attachment();
        a.setFileName(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        a.setContentType(file.getContentType());
        a.setSizeBytes(file.getSize());
        a.setCloudinaryPublicId(String.valueOf(result.get("public_id")));
        a.setCloudinaryResourceType(String.valueOf(result.get("resource_type")));
        a.setCloudinaryFormat(result.get("format") == null ? null : String.valueOf(result.get("format")));
        a.setWorkOrder(workOrder);
        a.setUploadedBy(uploader);
        return AttachmentDtos.Response.from(attachmentRepository.save(a));
    }

    @Transactional(readOnly = true)
    public List<AttachmentDtos.Response> list(Long workOrderId) {
        List<Attachment> rows = workOrderId == null
                ? attachmentRepository.findAllNewestFirst()
                : attachmentRepository.findByWorkOrderNewestFirst(workOrderId);
        return rows.stream().map(AttachmentDtos.Response::from).toList();
    }

    @Transactional(readOnly = true)
    public Attachment get(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Attachment " + id + " not found"));
    }

    /** Opens the file from Cloudinary using a short signed link, so the caller never sees the Cloudinary URL. */
    public InputStream openStream(Attachment a) {
        requireCloudinaryConfigured();
        String publicIdWithFormat = a.getCloudinaryFormat() == null
                ? a.getCloudinaryPublicId()
                : a.getCloudinaryPublicId() + "." + a.getCloudinaryFormat();
        String signedUrl = cloudinary.url()
                .resourceType(a.getCloudinaryResourceType())
                .type(DELIVERY_TYPE)
                .signed(true)
                .generate(publicIdWithFormat);
        try {
            return URI.create(signedUrl).toURL().openStream();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not fetch the file from Cloudinary: " + ex.getMessage(), ex);
        }
    }

    /** Removes the file from Cloudinary first, then the database row. */
    @Transactional
    public void delete(Long id) {
        Attachment a = get(id);
        requireCloudinaryConfigured();
        try {
            cloudinary.uploader().destroy(a.getCloudinaryPublicId(), ObjectUtils.asMap(
                    "resource_type", a.getCloudinaryResourceType(),
                    "type", DELIVERY_TYPE));
        } catch (IOException | RuntimeException ex) {
            throw new IllegalStateException("Delete from Cloudinary failed: " + ex.getMessage(), ex);
        }
        attachmentRepository.delete(a);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File cannot be empty.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BadRequestException("Max file size is 10MB.");
        }
        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Only PNG, JPEG images and MP4 videos are allowed.");
        }
    }

    private void requireCloudinaryConfigured() {
        Object key = cloudinary.config.apiKey;
        if (cloudinary.config.cloudName == null || cloudinary.config.cloudName.isBlank()
                || key == null || key.toString().isBlank()) {
            throw new IllegalStateException("Cloudinary is not set up. Set CLOUDINARY_CLOUD_NAME, "
                    + "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET before starting the app.");
        }
    }
}
