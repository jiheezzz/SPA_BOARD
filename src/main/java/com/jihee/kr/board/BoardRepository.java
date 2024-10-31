package com.jihee.kr.board;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
	List<Board> findByTitleContaining(String title);
    List<Board> findByNameContaining(String name);
}
