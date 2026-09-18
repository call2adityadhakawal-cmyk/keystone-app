package com.keystone.config;

import com.keystone.domain.*;
import com.keystone.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Seeds a small, realistic demo dataset the first time the app runs against an empty
 * database, so there is something to show without any manual setup.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, CustomerRepository customerRepository,
                       SiteRepository siteRepository, WorkOrderRepository workOrderRepository,
                       WorkOrderStatusHistoryRepository historyRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.workOrderRepository = workOrderRepository;
        this.historyRepository = historyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // already seeded on a previous run
        }

        String pwd = passwordEncoder.encode("Password123!");

        Customer meridianRetail = customerRepository.save(new Customer("Meridian Retail Group", "ops@meridianretail.example"));
        Customer harborTower = customerRepository.save(new Customer("Harbor Tower Offices", "facilities@harbortower.example"));

        Site retailMall = siteRepository.save(new Site(meridianRetail, "Meridian Mall - Chennai", "12 Anna Salai, Chennai"));
        Site retailHQ = siteRepository.save(new Site(meridianRetail, "Meridian HQ Tower", "88 MG Road, Bengaluru"));
        Site harborMain = siteRepository.save(new Site(harborTower, "Harbor Tower - Main Building", "5 Dockside Ave, Mumbai"));

        User dispatcher = userRepository.save(new User("dispatcher@keystone.dev", "Dana Dispatcher", pwd, Role.DISPATCHER, null));
        User manager = userRepository.save(new User("manager@keystone.dev", "Mona Manager", pwd, Role.MANAGER, null));
        User tech1 = userRepository.save(new User("tech1@keystone.dev", "Arun Kumar", pwd, Role.TECHNICIAN, null));
        User tech2 = userRepository.save(new User("tech2@keystone.dev", "Priya Nair", pwd, Role.TECHNICIAN, null));
        User customerUser = userRepository.save(new User("customer@keystone.dev", "Radha (Meridian Retail)", pwd, Role.CUSTOMER, meridianRetail));

        seedWorkOrder("AC Not Working", "Cooling system maintenance and AC repair service required at customer location.",
                Priority.HIGH, WorkOrderStatus.NEW, meridianRetail, retailMall, null, dispatcher.getEmail());

        seedWorkOrder("Flickering lights in lobby", "Electrical fault on the ground-floor lobby circuit.",
                Priority.MEDIUM, WorkOrderStatus.ASSIGNED, meridianRetail, retailHQ, tech1, dispatcher.getEmail());

        seedWorkOrder("Water leak near server room", "Plumbing leak reported near the server room, needs urgent attention.",
                Priority.URGENT, WorkOrderStatus.IN_PROGRESS, harborTower, harborMain, tech2, dispatcher.getEmail());

        seedWorkOrder("Elevator maintenance", "Scheduled quarterly maintenance for elevator #2.",
                Priority.LOW, WorkOrderStatus.ON_HOLD, harborTower, harborMain, tech1, dispatcher.getEmail());

        seedWorkOrder("Washroom tap replacement", "Replace worn tap fittings in the 3rd floor washroom.",
                Priority.MEDIUM, WorkOrderStatus.COMPLETED, meridianRetail, retailMall, tech2, dispatcher.getEmail());

        seedWorkOrder("HVAC filter change", "Routine filter change across rooftop HVAC units.",
                Priority.LOW, WorkOrderStatus.CLOSED, meridianRetail, retailHQ, tech1, manager.getEmail());

        System.out.println("=========================================================");
        System.out.println(" KEYSTONE demo data loaded. Seed logins (password Password123!):");
        System.out.println("  dispatcher@keystone.dev");
        System.out.println("  manager@keystone.dev");
        System.out.println("  tech1@keystone.dev / tech2@keystone.dev");
        System.out.println("  customer@keystone.dev");
        System.out.println("=========================================================");
    }

    private void seedWorkOrder(String title, String description, Priority priority, WorkOrderStatus status,
                                Customer customer, Site site, User assignedTo, String actor) {
        WorkOrder wo = new WorkOrder();
        wo.setCode(String.format("WO-%d-%06d", LocalDateTime.now().getYear(), workOrderRepository.count() + 1));
        wo.setTitle(title);
        wo.setDescription(description);
        wo.setPriority(priority);
        wo.setStatus(status);
        wo.setCustomer(customer);
        wo.setSite(site);
        wo.setAssignedTo(assignedTo);
        wo.setSlaDueAt(switch (priority) {
            case URGENT -> LocalDateTime.now().plusHours(1);
            case HIGH -> LocalDateTime.now().plusHours(4);
            case MEDIUM -> LocalDateTime.now().plusHours(24);
            case LOW -> LocalDateTime.now().plusHours(72);
        });
        wo = workOrderRepository.save(wo);
        historyRepository.save(new WorkOrderStatusHistory(wo, null, status, actor, "Seeded demo data"));
    }
}
