package com.jihee.kr.board.config;

import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;


public class SecurityUser extends User {

	private static final long serialVersionUID = 1L;

	public SecurityUser( com.jihee.kr.member.User user ) {
		super(user.getUsername(), 
				  user.getPassword(),
				  AuthorityUtils.createAuthorityList(user.getRole().toString()));
	  	}	

}
