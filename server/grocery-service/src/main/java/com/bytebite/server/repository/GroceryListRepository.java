package com.bytebite.server.repository;

import com.bytebite.server.entity.GroceryList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GroceryListRepository extends JpaRepository<GroceryList, UUID> {}
