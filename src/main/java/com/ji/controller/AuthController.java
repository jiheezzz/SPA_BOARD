package com.ji.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.jihee.kr.board.config.SecurityUserDetails;
import com.jihee.kr.member.User;
import com.jihee.kr.member.UserRepository;
import com.jihee.kr.member.UserService;


@Controller
public class AuthController {
	
	@Autowired
    private UserRepository userRepository;
	
	@Autowired
	private PasswordEncoder passwordEncoder;
	
	@Autowired
	private UserService userService;

	
    @GetMapping("/")
    public String showLoginPage() {
        return "login";
    }
   
    @PostMapping("/register")
    public String registerUser(
            @RequestParam("username") String username, 
            @RequestParam("password") String password,
            @RequestParam("name") String name, 
            @RequestParam("email-username") String emailPrefix, 
            @RequestParam("domain") String emailDomain, 
            RedirectAttributes redirectAttributes) {
    	
    	String email = emailPrefix + emailDomain;
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password)); // 비밀번호 암호화
        user.setRole("ROLE_USER"); // USER로 기본설정
        user.setName(name);
        user.setEmail(email);
        user.setRegdate(LocalDateTime.now());
        
        System.out.println(user);
        // 저장 메소드
        userRepository.save(user);
        
        // 성공 메시지 추가
        redirectAttributes.addFlashAttribute("successMessage", "회원가입을 축하합니다!");
        
        // 로그인 페이지로 이동
        return "redirect:/";
    }
    
    
    @GetMapping("/main")
    public String registerUser() {
    	return "main";
    }
    

 // 아이디 중복 확인 API
    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsernameDuplicate(@RequestParam String username) {
        boolean exists = userService.isUsernameTaken(username);
    
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }


    
}

