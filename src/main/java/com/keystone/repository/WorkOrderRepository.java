package com.keystone.repository;

import com.keystone.domain.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    List<WorkOrder> findByCustomerId(Long customerId);
    List<WorkOrder> findByAssignedToId(Long userId);
    long countByStatus(com.keystone.domain.WorkOrderStatus status);
}
