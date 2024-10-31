package com.jihee.kr.comment;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.jihee.kr.board.Board;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name="comments")
public class Comment {
	@Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "comment_seq")
    @SequenceGenerator(name = "comment_seq", sequenceName = "COMMENT_SEQ", allocationSize = 1)
    private Long id;
    
    private String content;

    @ManyToOne
    @JoinColumn(name = "idx")
    @JsonBackReference
    private Board board;

    
    private LocalDateTime createdDate = LocalDateTime.now();
    
    
    @Override
    public String toString() {
        // 연관된 board 필드를 toString()에서 제외
        return "Comment{" +
                "id=" + id +
                ", content='" + content + '\'' +
                '}';
    }
}

