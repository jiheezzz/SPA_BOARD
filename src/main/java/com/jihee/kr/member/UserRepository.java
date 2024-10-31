package com.jihee.kr.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {
	User findByUsername(String username);
	
	@Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 'true' ELSE 'false' END FROM users u WHERE u.email = :email", nativeQuery = true)
	 boolean existsByEmail(String email);
}


