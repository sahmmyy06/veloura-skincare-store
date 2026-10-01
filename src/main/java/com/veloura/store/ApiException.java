/* Business errors carry an HTTP status and a message safe for the browser. */
package com.veloura.store;

public class ApiException extends RuntimeException {
    // Examples: 400 = invalid input, 401 = not logged in, 404 = not found.
    private final int status;

    public ApiException(int status, String message) {
        // RuntimeException already stores the message; the parent constructor sets it.
        super(message);
        this.status = status;
    }

    public int status() {
        return status;
    }
}
