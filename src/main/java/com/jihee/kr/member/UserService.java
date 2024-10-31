package com.jihee.kr.member;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 사용자 이름으로 유저 검색
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // 아이디 중복 여부 확인
    public boolean isUsernameTaken(String username) {
        User user = userRepository.findByUsername(username);
        return user != null; // 존재하면 true 반환 (중복)
    }
    
    public boolean isEmailExist(String email) {
        return userRepository.existsByEmail(email); // 이메일 중복 여부 확인
    }
}

