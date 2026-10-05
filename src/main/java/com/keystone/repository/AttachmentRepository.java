package com.keystone.repository;

import com.keystone.domain.Attachment;
import com.keystone.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    @Query("select a from Attachment a join fetch a.uploadedBy order by a.uploadedAt desc")
    List<Attachment> findAllNewestFirst();

    @Query("select a from Attachment a join fetch a.uploadedBy where a.workOrder.id = :workOrderId order by a.uploadedAt desc")
    List<Attachment> findByWorkOrderNewestFirst(Long workOrderId);

    boolean existsByWorkOrderIdAndUploadedByRole(Long workOrderId, Role role);
}
