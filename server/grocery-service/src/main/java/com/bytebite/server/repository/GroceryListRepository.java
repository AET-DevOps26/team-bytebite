package com.bytebite.server.repository;

import com.bytebite.server.entity.GroceryList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GroceryListRepository extends JpaRepository<GroceryList, UUID> {

    List<GroceryList> findTop20ByOrderByCreatedAtDesc();
}
