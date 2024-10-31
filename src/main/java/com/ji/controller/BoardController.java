package com.ji.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.jihee.kr.board.Board;
import com.jihee.kr.board.BoardRepository;
import com.jihee.kr.board.BoardService;
import com.jihee.kr.board.config.SecurityUserDetails;
import com.jihee.kr.member.User;
import com.jihee.kr.member.UserRepository;

@RestController
@RequestMapping("/api/board")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }
    
    @Autowired
    UserRepository userRepository;
    
    @Autowired
    BoardRepository boardRepository;
    

    @GetMapping
    public List<Board> getAllBoards() {
    	

    	
        return boardService.getAllBoards();
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> createBoard(
        @RequestParam("inquiryType") String inquiryType,
        @RequestParam("etc") String etc,
        @RequestParam(value = "isSecret", defaultValue = "false") boolean isSecret, // 비밀글 여부 추가
        @RequestParam(value = "file", required = false) MultipartFile file,
        @AuthenticationPrincipal SecurityUserDetails securityUserDetails) throws IOException {
        
        // 로그인한 사용자 정보 가져오기
        User user = securityUserDetails.getMember();
        
        // 필드값 로그로 확인
        System.out.println("inquiryType: " + inquiryType);
        System.out.println("etc: " + etc);
        System.out.println("isSecret: " + isSecret); // 비밀글 여부 출력
        
        // 사용자 정보 추출
        String id = String.valueOf(user.getUsername());
        String email = String.valueOf(user.getEmail());
        String trueName = user.getName();

        // Board 엔티티 생성
        Board board = new Board();
        board.setTitle(inquiryType);
        board.setName(id);
        board.setEmail(email);
        board.setEtc(etc);
        board.setSecret(isSecret); // 비밀글 여부 설정
        board.setTrueName(trueName);

        // 파일 처리
        if (file != null && !file.isEmpty()) {
            try {
                String fileName = saveFile(file);  // 파일 저장 로직
                board.setPhoto(fileName); // 저장된 파일 이름 설정
            } catch (IOException e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                     .body(Collections.singletonMap("message", "File upload failed"));
            }
        }

        // Board 저장
        try {
            boardService.save(board); // 저장 로직
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Collections.singletonMap("message", "Board save failed"));
        }

        // 성공 응답
        Map<String, String> response = new HashMap<>();
        response.put("message", "Board created successfully");

        return ResponseEntity.ok(response);
    }




    // 파일 저장 메서드
    private String saveFile(MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get("C:/uploads/" + fileName);
        Files.createDirectories(filePath.getParent());
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return fileName;
    }




 // 게시글 상세보기 (조회수 증가)
    @PostMapping("/{idx}/increase-view")
    public ResponseEntity<Board> getBoardWithViewIncrease(@PathVariable Long idx, @RequestParam(required = false) String password) {
        // 게시글 조회 및 조회수 증가 처리
        Board board = boardService.increaseViewCount(idx);
        if (board != null) {
            return ResponseEntity.ok(board);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // 게시글 조회 (조회수 증가 없이 단순 조회)
    @GetMapping("/{idx}/no-view")
    public ResponseEntity<Board> getBoardWithoutViewIncrease(@PathVariable Long idx) {
        Board board = boardService.findBoardById(idx);
        if (board == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        return ResponseEntity.ok(board);
    }



    @DeleteMapping("/{idx}")
    public ResponseEntity<Map<String, String>> deleteBoard(@PathVariable Long idx) {
        // 게시글 찾기
        Board board = boardService.getBoardById(idx);
        if (board == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "게시글을 찾을 수 없습니다."));
        }

        // 파일 경로 확인
        String photoPath = board.getPhoto();  // DB에 저장된 사진 경로

        // 사진이 있으면 파일 시스템에서 삭제
        if (photoPath != null && !photoPath.isEmpty()) {
            deletePhoto(photoPath);
        }

        // 게시글 삭제
        boardService.deleteBoard(idx);

        // JSON 형식으로 응답 반환
        Map<String, String> response = new HashMap<>();
        response.put("message", "게시글 삭제 및 사진 삭제 성공");
        return ResponseEntity.ok(response);
    }


    
    private void deletePhoto(String photoPath) {
        try {
            // 파일 시스템에서 사진 경로
            Path filePath = Paths.get("C:/uploads/" + photoPath);
            
            // 파일이 존재하면 삭제
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException e) {
            e.printStackTrace();
            // 파일 삭제 실패 시 로그에 기록
            System.out.println("파일 삭제 실패: " + photoPath);
        }
    }
    
    @PostMapping("/update")
    public ResponseEntity<Map<String, String>> updateBoard(
        @RequestParam("idx") Long idx,
        @RequestParam("title") String title,
        @RequestParam("etc") String etc,
        @RequestParam("name") String name,
        @RequestParam("isSecret") boolean isSecret,
        @RequestPart(value = "photo", required = false) MultipartFile photo,
        @AuthenticationPrincipal SecurityUserDetails securityUserDetails) throws IOException {

        // 로그 출력
        System.out.println("idx: " + idx);
        System.out.println("title: " + title);
        System.out.println("etc: " + etc);
        System.out.println("name: " + name);
    
        if (photo != null) {
            System.out.println("photo: " + photo.getOriginalFilename());
        } else {
            System.out.println("photo: null");
        }

        // 게시글 찾기
        Board board = boardService.getBoardById(idx);

        if (board == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "게시글을 찾을 수 없습니다."));
        }

        // 로그인한 사용자 정보 가져오기
        User user = securityUserDetails.getMember();
        if (user == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "로그인된 사용자 정보를 찾을 수 없습니다."));
        }

        Long userId = user.getId();

        // 게시글 수정
        board.setTitle(title);
        board.setEtc(etc);
        board.setName(name);
        board.setModifiedDate(LocalDateTime.now());
        board.setModifiedBy(userId);
        board.setSecret(isSecret);

 
        // 파일 처리
        if (photo != null && !photo.isEmpty()) {
            if (board.getPhoto() != null) {
                Path oldFilePath = Paths.get("C:/uploads/" + board.getPhoto());
                Files.deleteIfExists(oldFilePath);
            }

            String fileName = UUID.randomUUID().toString() + "_" + photo.getOriginalFilename();
            Path filePath = Paths.get("C:/uploads/" + fileName);
            Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            board.setPhoto(fileName);
        }

        boardService.save(board);

        // 성공 메시지 반환
        Map<String, String> response = new HashMap<>();
        response.put("message", "게시글이 성공적으로 수정되었습니다.");
        return ResponseEntity.ok(response);
    }


    
    @GetMapping("/search")
    public List<Board> searchBoards(@RequestParam("searchType") String searchType,
                                    @RequestParam("searchInput") String searchInput) {
    	System.out.println(searchType+"/"+searchInput);
    	if ("name".equals(searchType)) {
            return boardRepository.findByNameContaining(searchInput); // 작성자 부분 일치 검색
        } else if ("title".equals(searchType)) {
            return boardRepository.findByTitleContaining(searchInput); // 제목 검색 (정확히 일치)
        }
        return new ArrayList<>(); // 다른 조건에 대한 처리가 필요할 때
    }
    

    
 
    @PostMapping("/{id}/detail")
    public ResponseEntity<?> getBoardDetail(
            @PathVariable Long id, 
            @RequestParam String password, 
            Authentication authentication) {

        Board board = boardService.findBoardById(id);


       
        
        // 비밀번호가 맞으면 게시물 정보 반환
        Map<String, Object> response = new HashMap<>();
        response.put("board", board);
        response.put("success", true);  // 성공적으로 게시물을 로드했을 때
        return ResponseEntity.ok(response);
    }



    @GetMapping("/checkAdmin")
    public ResponseEntity<Map<String, Object>> checkAdmin(
    		@AuthenticationPrincipal SecurityUserDetails securityUserDetails) {
        Map<String, Object> response = new HashMap<>();
        
        if (securityUserDetails != null) {
            boolean isAdmin = securityUserDetails.getAuthorities().stream()
                                  .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
            String username = securityUserDetails.getUsername();  // 유저의 username 가져오기

            
            response.put("isAdmin", isAdmin);
            response.put("username", username);  // username을 응답에 추가
          
        } else {
            response.put("isAdmin", false);
            response.put("username", "Anonymous");  // 인증되지 않은 경우 기본 값 설정
        }
        
        return ResponseEntity.ok(response);  // 여러 값을 반환
    }



    
    @GetMapping("/user-info")
    public ResponseEntity<Map<String, String>> getUserInfo(@AuthenticationPrincipal SecurityUserDetails securityUserDetails) {
        
        if (securityUserDetails == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        
        

        User user = securityUserDetails.getMember();
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        
        String id = String.valueOf(user.getUsername());
        // 응답 데이터 생성
        Map<String, String> userInfo = new HashMap<>();
        userInfo.put("id", id);
        return ResponseEntity.ok(userInfo);
    }
    
    @PostMapping("/{boardId}/detail/re")
    public ResponseEntity<Map<String, Object>> getBoardDetail(
        @PathVariable Long boardId,
        @AuthenticationPrincipal SecurityUserDetails securityUserDetails) {
        
    	System.out.println(boardId);
        if (securityUserDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }

        Board board = boardService.findBoardById(boardId);

        if (board == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        User currentUser = securityUserDetails.getMember(); 

        Map<String, Object> boardInfo = new HashMap<>();
        boardInfo.put("board", board); 
        boardInfo.put("name", board.getName());
        boardInfo.put("authorEmail", board.getEmail());
        boardInfo.put("currentUser", currentUser.getUsername());
        boardInfo.put("username", currentUser.getName());
        boardInfo.put("isAdmin", currentUser.getRole().contains("ROLE_ADMIN"));  // Boolean으로 처리
        boardInfo.put("isSecret", board.isSecret());  // 비밀글 여부 추가
        System.out.println(boardInfo);

        return ResponseEntity.ok(boardInfo);
    }



    
    @GetMapping("/user-role")
    public ResponseEntity<Map<String, Object>> getUserRole(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            // 인증되지 않은 경우에도 JSON 형식으로 응답을 반환
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Unauthorized");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        boolean isAdmin = authorities.stream().anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN"));
        Map<String, Object> response = new HashMap<>();
        response.put("isAdmin", isAdmin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/total-count")
    public ResponseEntity<Integer> getTotalBoardCount() {
        int totalItems = boardService.getTotalItemCount();  // 총 레코드 수 가져오기
        return ResponseEntity.ok(totalItems);  // HTTP 200 OK로 응답
    }
    
    
}


