package com.jihee.kr.comment;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.jihee.kr.board.BoardService;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private BoardService boardService;
    
    public List<Comment> getCommentsByBoard(Long boardId) {
        return commentRepository.findAllByBoard_Idx(boardId);
    }



    public CommentDto addComment(Long boardId, String content) {
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setBoard(boardService.findBoardById(boardId));
        Comment savedComment = commentRepository.save(comment);
        return convertToDto(savedComment);
    }


    private CommentDto convertToDto(Comment comment) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setCreatedDate(comment.getCreatedDate());


        return dto;
    }
    
    public void deleteComment(Long commentId) {
        if (commentRepository.existsById(commentId)) {
            commentRepository.deleteById(commentId);  // 댓글 삭제
        } else {
            throw new IllegalArgumentException("댓글을 찾을 수 없습니다.");
        }
    }

   
}
