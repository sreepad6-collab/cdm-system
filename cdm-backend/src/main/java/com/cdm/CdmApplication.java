package com.cdm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CdmApplication {
    public static void main(String[] args) {
        // Fix: Java 25 on Windows uses AF_UNIX pipes for NIO selectors.
        // If java.io.tmpdir has spaces or short-form path (e.g., HAREKR~1),
        // the AF_UNIX connect fails with "Invalid argument".
        // Override with a simple path before any NIO class is loaded.
        String tmpDir = System.getProperty("java.io.tmpdir", "");
        if (tmpDir.contains(" ") || tmpDir.contains("~")) {
            System.setProperty("java.io.tmpdir", "C:\\Temp");
        }
        System.out.println("[CDM] java.io.tmpdir = " + System.getProperty("java.io.tmpdir"));
        SpringApplication.run(CdmApplication.class, args);
    }
}
