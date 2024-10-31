package com.jihee.kr.board.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextPersistenceFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private SecurityUserDetailsService securityUserDetail;
    
    @Autowired
    SecurityProvider provider;
    
    @Autowired
    public void configure (AuthenticationManagerBuilder auth) throws Exception {
        auth.authenticationProvider(provider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    	 http
         .sessionManagement(session -> session
             .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)  // 세션이 필요할 때 생성
             .maximumSessions(1)  // 최대 세션 수
             .expiredUrl("/")  // 세션 만료 시 이동할 URL
             
         )
         //권한설정
         .securityMatcher("/api/**","/login","/main","/logout")
         .authorizeHttpRequests(authorize ->
             authorize
                 .requestMatchers("/","/login","/error").permitAll() //해당 경로는 권한 X
                 .requestMatchers("/api/**","/main").hasAnyRole("USER","ADMIN")
         )
         //로그인
         .formLogin(form ->
             form
                 .loginPage("/") // 로그인 페이지 설정
                 .loginProcessingUrl("/login") // 로그인 처리 URL 설정 Controller 설정 X
                 .successHandler((request, response, authentication) -> {
                     response.setStatus(HttpServletResponse.SC_OK); // 로그인 성공 시 OK 상태 반환
                 })
                 .failureHandler((request, response, exception) -> {
                     response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 로그인 실패 시 UNAUTHORIZED 상태 반환
                 })
                 .defaultSuccessUrl("/main") // 로그인 성공 후 이동할 페이지
                 .permitAll()
         )
         //로그아웃
         .logout(logout ->
             logout
                 .logoutUrl("/logout") // 로그아웃 처리 URL 설정 Controller 설정 X
                 .logoutSuccessUrl("/") // 로그아웃 성공 후 이동할 페이지
                 .deleteCookies("JSESSIONID") // 로그아웃 후 쿠키 삭제
                 .invalidateHttpSession(true) // Invalidate session
         )
         //자동 로그인 7일 동안
         .rememberMe(remember ->
             remember
                 .key("jj") // 인증 토큰 생성시 사용할 키
                 .tokenValiditySeconds(60 * 60 * 24 * 7) // 인증 토큰 유효 시간 (초)
                 .userDetailsService(securityUserDetail) // 인증 토큰 생성시 사용할 UserDetailsService
                 //로그인 페이지에 form에 <input type="checkbox" name="remember-me" id="rememberMe"> 이런식으로 사용
                 .rememberMeParameter("remember-me") // 로그인 페이지에서 사용할 파라미터 이름
         )
         //csrf 해제
         .csrf(AbstractHttpConfigurer::disable);
    	 

     return http.build();
 }
    
    
    
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
        factory.addContextCustomizers(context -> context.setSessionTimeout(30));  // 세션 타임아웃 30분
        return factory;
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
