package com.jihee.kr.board;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

@Service
public class BoardService {
	private final BoardRepository boardRepository;

    public BoardService(BoardRepository boardRepository) {
        this.boardRepository = boardRepository;
    }
    
    
    
    @Transactional
    public void saveBoard(Board board) {
        try {
            boardRepository.save(board);

        } catch (Exception e) { 
            e.printStackTrace();
            throw new RuntimeException("Board 저장 중 에러 발생", e);
        }
    }
    
    

    public List<Board> getAllBoards() {
        return boardRepository.findAll(Sort.by(Sort.Direction.DESC, "regdate"));
    }

    public Board createBoard(Board board) {
        return boardRepository.save(board);
    }

    public Board getBoardById(Long idx) {
        return boardRepository.findById(idx).orElseThrow();
    }
    

    public void deleteBoard(Long idx) {
        boardRepository.deleteById(idx);
    }
    
    
    public Board save(Board board) {
        return boardRepository.save(board);  
    }
    // 조회수 증가 후 게시글 조회
    public Board increaseViewCount(Long id) {
        Optional<Board> optionalBoard = boardRepository.findById(id);
        if (optionalBoard.isPresent()) {
            Board board = optionalBoard.get();
            board.setCnt(board.getCnt() + 1);  // 조회수 증가
            boardRepository.save(board);  // DB에 업데이트
            return board;
        }
        return null;  // 게시글이 존재하지 않는 경우
    }
    
    public List<Board> searchBoards(String searchType, String searchInput) {
        if ("title".equals(searchType)) {
            return boardRepository.findByTitleContaining(searchInput);
        } else if ("name".equals(searchType)) {
            return boardRepository.findByNameContaining(searchInput);
        } else {
            return new ArrayList<>(); 
        }
    }
    
    public Board findBoardById(Long id) {
        return boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));
    }
    
   
    public int getTotalItemCount() {
        return (int) boardRepository.count();
    }
    

}