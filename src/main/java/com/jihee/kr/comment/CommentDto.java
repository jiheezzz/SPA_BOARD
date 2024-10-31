package com.jihee.kr.comment;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class CommentDto {
    private Long id;
    private String content;
    private LocalDateTime createdDate;
    
    
}
