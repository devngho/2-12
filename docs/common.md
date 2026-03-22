## 공통

모든 API는 오류가 발생할 경우 `error` 필드에 오류 메시지를 담아 JSON 형태로 응답합니다.

```json
500 Internal Server Error

{
    "error": "상태 확인 중 오류 발생"
}
```

### 인증

- 로그인 성공 시 `accessToken` 쿠키가 `HttpOnly`로 발급됩니다.
- 보호된 API는 쿠키 기반 인증 또는 `Authorization: Bearer <token>` 헤더 인증을 지원합니다.

### 권한 오류

권한이 없거나 토큰이 없으면 아래와 같이 응답합니다.

```json
401 Unauthorized

{
    "error": "접근 권한이 없습니다. 로그인이 필요합니다."
}
```

```json
401 Unauthorized

{
    "error": "유효하지 않은 토큰입니다."
}
```

```json
403 Forbidden

{
    "error": "권한이 없습니다."
}
```
