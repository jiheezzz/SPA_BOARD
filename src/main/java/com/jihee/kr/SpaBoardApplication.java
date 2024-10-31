package com.jihee.kr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
@ComponentScan(basePackages= {"com.jihee.kr.**","com.ji.controller"})
@SpringBootApplication
public class SpaBoardApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpaBoardApplication.class, args);
	}

}
