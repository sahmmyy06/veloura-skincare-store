/* Keeps error responses compatible with the React client's {message} contract. */
package com.veloura.store;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiErrors {
    // Spring sends thrown exceptions here so browsers receive a clear JSON message.
    private static final Logger LOG = LoggerFactory.getLogger(ApiErrors.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, String>> business(ApiException error) {
        return ResponseEntity.status(error.status()).body(Map.of("message", error.getMessage()));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    ResponseEntity<Map<String, String>> malformed(Exception error) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid request."));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<Map<String, String>> missingResource(NoResourceFoundException error) {
        return ResponseEntity.status(404).body(Map.of("message", "Not found."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, String>> conflict(DataIntegrityViolationException error) {
        String databaseMessage = error.getMostSpecificCause().getMessage();
        String browserMessage = "The request conflicts with existing data.";
        if (databaseMessage != null && databaseMessage.contains("products.slug")) {
            browserMessage = "A product with this slug already exists.";
        }
        // Do not expose internal database details in the browser's error message.
        return ResponseEntity.badRequest().body(Map.of("message", browserMessage));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, String>> unexpected(Exception error) {
        LOG.error("API request failed", error);
        return ResponseEntity.internalServerError()
            .body(Map.of("message", "Unexpected server error."));
    }
}
