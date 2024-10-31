package com.ji.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import com.jihee.kr.board.Board;
import com.jihee.kr.board.BoardService;
import com.jihee.kr.comment.Comment;
import com.jihee.kr.comment.CommentDto;
import com.jihee.kr.comment.CommentService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping("/board/{boardId}")
    public ResponseEntity<List<Comment>> getCommentsByBoardId(@PathVariable Long boardId) {
        List<Comment> comments = commentService.getCommentsByBoard(boardId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/board/{boardId}/add")
    public CommentDto addComment(@PathVariable Long boardId, @RequestBody Map<String, Object> payload) {
        String content = (String) payload.get("content");
        
        // 따옴표를 제거하고 저장
        content = content.replaceAll("^\"|\"$", ""); // 앞뒤 따옴표 제거
        
        return commentService.addComment(boardId, content);
    }
    
    @DeleteMapping("/{commentId}/delete")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok().build();  // 성공 시 200 OK 반환
    }


}

