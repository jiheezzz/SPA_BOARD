package com.jihee.kr.board;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.jihee.kr.comment.Comment;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import lombok.Data;

@Entity
@Data
public class Board {
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "board_seq")
	@SequenceGenerator(name = "board_seq", sequenceName = "board_seq", allocationSize = 1)
    private Long idx;
	
	private boolean isSecret;
	
	private String TrueName;
	private Long ModifiedBy;
	private LocalDateTime ModifiedDate;
    private String name;
    private String photo;
    private String title;
    private String etc;
    private String email;
    private int cnt;
    private LocalDateTime regdate = LocalDateTime.now();
    

  
    
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Comment> comments = new ArrayList<>();


    @Override
    public String toString() {
        // 연관된 컬렉션인 comments를 toString()에서 제외
        return "Board{" +
                "id=" + idx +
                ", title='" + title + '\'' +
                ", etc='" + etc + '\'' +
                '}';
    }
	
}

