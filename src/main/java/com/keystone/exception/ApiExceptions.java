package com.keystone.exception;

public class ApiExceptions {

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }

    public static class IllegalTransitionException extends RuntimeException {
        public IllegalTransitionException(String message) { super(message); }
    }

    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException(String message) { super(message); }
    }

    public static class BadCredentialsException extends RuntimeException {
        public BadCredentialsException(String message) { super(message); }
    }

    /** The request itself is malformed or fails a business rule (weak password, missing company, ...). */
    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) { super(message); }
    }

    /** The request clashes with something that already exists (an email already registered). */
    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }
}
