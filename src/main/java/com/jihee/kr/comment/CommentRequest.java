package com.jihee.kr.comment;

import lombok.Data;

@Data
public class CommentRequest {
    private Long parentCommentId; 
    private String content; 
    private Long boardId; 
}

