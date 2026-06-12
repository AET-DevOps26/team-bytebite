package com.bytebite.server;

import com.bytebite.server.dto.GroceryListDTO;
import com.bytebite.server.dto.MergeRequest;
import com.bytebite.server.service.GroceryMergeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MergeController {

    private final GroceryMergeService groceryMergeService;

    public MergeController(GroceryMergeService groceryMergeService) {
        this.groceryMergeService = groceryMergeService;
    }

    @PostMapping(value = "/api/groceries/merge",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public GroceryListDTO merge(@RequestBody MergeRequest request) {
        return groceryMergeService.merge(request);
    }
}
