package com.keystone.dto;

import com.keystone.domain.Customer;
import com.keystone.domain.Role;
import com.keystone.domain.Site;
import com.keystone.domain.User;

public class RefDtos {

    public static class CustomerResponse {
        public Long id;
        public String name;
        public String contactEmail;

        public static CustomerResponse from(Customer c) {
            CustomerResponse r = new CustomerResponse();
            r.id = c.getId();
            r.name = c.getName();
            r.contactEmail = c.getContactEmail();
            return r;
        }
    }

    public static class SiteResponse {
        public Long id;
        public Long customerId;
        public String name;
        public String address;

        public static SiteResponse from(Site s) {
            SiteResponse r = new SiteResponse();
            r.id = s.getId();
            r.customerId = s.getCustomer().getId();
            r.name = s.getName();
            r.address = s.getAddress();
            return r;
        }
    }

    public static class UserResponse {
        public Long id;
        public String name;
        public String email;
        public Role role;

        public static UserResponse from(User u) {
            UserResponse r = new UserResponse();
            r.id = u.getId();
            r.name = u.getName();
            r.email = u.getEmail();
            r.role = u.getRole();
            return r;
        }
    }
}
