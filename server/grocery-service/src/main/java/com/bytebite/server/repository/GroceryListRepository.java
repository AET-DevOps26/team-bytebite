package com.bytebite.server.repository;

import com.bytebite.server.dto.GroceryListSummaryDTO;
import com.bytebite.server.entity.GroceryList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface GroceryListRepository extends JpaRepository<GroceryList, UUID> {

  List<GroceryList> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

  Optional<GroceryList> findByIdAndUserId(UUID id, UUID userId);

  /**
   * Returns each list as a summary with item totals computed in a single aggregate query, so the
   * collapsed cards can show progress without loading every item.
   */
  @Query(
      """
            select new com.bytebite.server.dto.GroceryListSummaryDTO(
                gl.id, gl.name, gl.createdAt,
                count(i),
                coalesce(sum(case when i.purchased = true then 1L else 0L end), 0L))
            from GroceryList gl
            left join gl.items i
            where gl.userId = :userId
            group by gl.id, gl.name, gl.createdAt
            order by gl.createdAt desc
            """)
  List<GroceryListSummaryDTO> findSummariesByUserId(UUID userId);
}
