package com.cdm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CdmApplication {
    public static void main(String[] args) {
        SpringApplication.run(CdmApplication.class, args);
    }
}
