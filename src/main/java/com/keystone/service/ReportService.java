package com.keystone.service;

import com.keystone.domain.WorkOrder;
import com.keystone.domain.WorkOrderStatus;
import com.keystone.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final WorkOrderRepository workOrderRepository;

    public ReportService(WorkOrderRepository workOrderRepository) {
        this.workOrderRepository = workOrderRepository;
    }

    public Map<String, Object> summary() {
        List<WorkOrder> all = workOrderRepository.findAll();

        Map<WorkOrderStatus, Long> byStatus = new EnumMap<>(WorkOrderStatus.class);
        for (WorkOrderStatus s : WorkOrderStatus.values()) byStatus.put(s, 0L);
        long overdue = 0;
        LocalDateTime now = LocalDateTime.now();

        for (WorkOrder w : all) {
            byStatus.merge(w.getStatus(), 1L, Long::sum);
            boolean open = w.getStatus() != WorkOrderStatus.CLOSED && w.getStatus() != WorkOrderStatus.CANCELLED;
            if (open && w.getSlaDueAt() != null && w.getSlaDueAt().isBefore(now)) {
                overdue++;
            }
        }

        long totalTerminalOrMeasured = all.stream()
                .filter(w -> w.getStatus() == WorkOrderStatus.CLOSED)
                .count();
        long metOnTime = all.stream()
                .filter(w -> w.getStatus() == WorkOrderStatus.CLOSED)
                .filter(w -> w.getSlaDueAt() == null || !w.getUpdatedAt().isAfter(w.getSlaDueAt()))
                .count();
        double slaCompliance = totalTerminalOrMeasured == 0 ? 100.0
                : Math.round((metOnTime * 1000.0) / totalTerminalOrMeasured) / 10.0;

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("total", all.size());
        result.put("byStatus", byStatus);
        result.put("overdue", overdue);
        result.put("slaCompliancePct", slaCompliance);
        return result;
    }
}
