package com.bytebite.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
// JPA/Hibernate would otherwise open a JDBC connection at startup to read DB metadata,
// which fails in CI where no database is available. The dialect is configured explicitly
// in application.properties, so Hibernate can bootstrap without probing the database.
@TestPropertySource(properties = "spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false")
class ServerApplicationTests {

	@Test
	void contextLoads() {
	}

}