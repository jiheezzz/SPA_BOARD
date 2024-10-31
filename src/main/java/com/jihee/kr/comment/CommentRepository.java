package com.jihee.kr.comment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;



public interface CommentRepository extends JpaRepository<Comment, Long> {
	List<Comment> findAllByBoard_Idx(Long boardId);
}
