package com.ji.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jihee.kr.member.UserService;
@Controller
@RestController
public class CheckController {
	
	@Autowired
	private UserService userService;

	
	
    @GetMapping("/check-email")
    public Map<String, Boolean> checkEmail(@RequestParam("email") String email) {
        System.out.println(email);
        boolean exists = userService.isEmailExist(email); // 이메일 중복 여부 체크
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return response; // JSON 형식으로 이메일 중복 여부 반환
    }
}
