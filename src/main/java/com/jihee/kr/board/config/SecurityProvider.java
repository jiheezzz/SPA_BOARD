package com.jihee.kr.board.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.jihee.kr.member.User;

@Component
public class SecurityProvider implements AuthenticationProvider {

	@Autowired
	private SecurityUserDetailsService userDetailsService;

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		String username = authentication.getName();
		String password = (String) authentication.getCredentials();

		SecurityUserDetails userDetails = (SecurityUserDetails) userDetailsService.loadUserByUsername(username);
		
		String dbPassword = userDetails.getPassword();
		PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

		if(!passwordEncoder.matches(password, dbPassword)) {
			System.out.println("[사용자] 비밀번호가 일치하지 않습니다.");
			throw new BadCredentialsException("[사용자] 아이디 또는 비밀번호가 일치하지 않습니다.");
		}

		User member = userDetails.getMember();
		if (member == null || "N".equals(member.getUsername())) {
			System.out.println("[사용자] 사용할 수 없는 계정입니다.");
			throw new BadCredentialsException("[사용자] 사용할 수 없는 계정입니다.");
		}

		// 인증이 성공하면 UsernamePasswordAuthenticationToken 객체를 반환한다.
		// 해당 객체는 Authentication 객체로 추후 인증이 끝나고 SecurityContextHolder.getContext() 에 저장된다.
		return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
	}

	@Override
	public boolean supports(Class<?> authentication) {
		return authentication.equals(UsernamePasswordAuthenticationToken.class);
	}
}
