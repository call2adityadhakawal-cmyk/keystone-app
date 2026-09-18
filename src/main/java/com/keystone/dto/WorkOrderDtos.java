package com.keystone.dto;

import com.keystone.domain.Priority;
import com.keystone.domain.WorkOrder;
import com.keystone.domain.WorkOrderStatus;
import com.keystone.domain.WorkOrderStatusHistory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class WorkOrderDtos {

    public static class CreateRequest {
        @NotNull
        public Long customerId;
        @NotNull
        public Long siteId;
        @NotBlank
        public String title;
        public String description;
        @NotNull
        public Priority priority;
    }

    public static class StatusChangeRequest {
        @NotNull
        public WorkOrderStatus toStatus;
        public String note;
    }

    public static class AssignRequest {
        @NotNull
        public Long technicianId;
    }

    public static class HistoryItem {
        public WorkOrderStatus fromStatus;
        public WorkOrderStatus toStatus;
        public String changedBy;
        public LocalDateTime changedAt;
        public String note;

        public static HistoryItem from(WorkOrderStatusHistory h) {
            HistoryItem i = new HistoryItem();
            i.fromStatus = h.getFromStatus();
            i.toStatus = h.getToStatus();
            i.changedBy = h.getChangedBy();
            i.changedAt = h.getChangedAt();
            i.note = h.getNote();
            return i;
        }
    }

    public static class Response {
        public Long id;
        public String code;
        public String title;
        public String description;
        public Priority priority;
        public WorkOrderStatus status;
        public Long customerId;
        public String customerName;
        public Long siteId;
        public String siteName;
        public Long assignedToId;
        public String assignedToName;
        public LocalDateTime slaDueAt;
        public boolean overdue;
        public LocalDateTime createdAt;
        public LocalDateTime updatedAt;
        public List<HistoryItem> history;

        public static Response from(WorkOrder w) {
            Response r = new Response();
            r.id = w.getId();
            r.code = w.getCode();
            r.title = w.getTitle();
            r.description = w.getDescription();
            r.priority = w.getPriority();
            r.status = w.getStatus();
            r.customerId = w.getCustomer().getId();
            r.customerName = w.getCustomer().getName();
            r.siteId = w.getSite().getId();
            r.siteName = w.getSite().getName();
            if (w.getAssignedTo() != null) {
                r.assignedToId = w.getAssignedTo().getId();
                r.assignedToName = w.getAssignedTo().getName();
            }
            r.slaDueAt = w.getSlaDueAt();
            r.overdue = w.getSlaDueAt() != null
                    && w.getSlaDueAt().isBefore(LocalDateTime.now())
                    && w.getStatus() != WorkOrderStatus.CLOSED
                    && w.getStatus() != WorkOrderStatus.CANCELLED;
            r.createdAt = w.getCreatedAt();
            r.updatedAt = w.getUpdatedAt();
            return r;
        }

        public static Response withHistory(WorkOrder w, List<WorkOrderStatusHistory> hist) {
            Response r = from(w);
            r.history = hist.stream().map(HistoryItem::from).collect(Collectors.toList());
            return r;
        }
    }
}
