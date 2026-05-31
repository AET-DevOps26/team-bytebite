package com.bytebite.server;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.DefaultUriBuilderFactory;

@Configuration
public class GenAiClient {

    @Bean
    public RestTemplate genAiRestTemplate(@Value("${genai.base-url}") String baseUrl) {
        RestTemplate template = new RestTemplate();
        template.setUriTemplateHandler(new DefaultUriBuilderFactory(baseUrl));
        return template;
    }
}
