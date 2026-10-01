/* Preserves the original PNG and JPEG share-image bytes without the Node runtime. */
package com.veloura.store;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.Base64;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShareImages {
    private final byte[] png;
    private final byte[] jpg;

    public ShareImages() throws IOException {
        png = load("png");
        jpg = load("jpg");
    }

    private static byte[] load(String format) throws IOException {
        String resourceName = "og-image." + format + ".b64";
        // These legacy files store image bytes as text. Decode that text before sending it.
        try (InputStream input = new ClassPathResource(resourceName).getInputStream()) {
            byte[] encodedImage = input.readAllBytes();
            return Base64.getMimeDecoder().decode(encodedImage);
        }
    }

    @GetMapping("/api/og-image.png")
    ResponseEntity<byte[]> png() {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG)
            .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic()).body(png);
    }

    @GetMapping("/api/og-image.jpg")
    ResponseEntity<byte[]> jpg() {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
            .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic()).body(jpg);
    }
}
