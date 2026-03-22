## /api/auth

### GET /registration-status

각 권한을 가진 유저가 이미 있는지 조회합니다.

#### Response

```json
200 OK

{
    "admin": true,
    "teacher": false,
    "president": true,
    "vicePresident": false
}
```

### POST /register

회원가입합니다.

#### Request Body

```json
{
    "studentId": "21200",
    "password": "password123",
    "name": "새벽3시에문서쓰기란너무즐거워",
    "role": "반장"
}
```

#### Response

```json
201 Created

{
    "message": "회원가입 완료. 승인을 대기해주세요."
}
```

```json
400 Bad Request

{
    "error": "이미 존재하는 학번입니다."
}
```

### POST /login

로그인하고 JWT 토큰을 HttpOnly 쿠키로 발급받습니다.

#### Request Body

```json
{
    "studentId": "21200",
    "password": "password123"
}
```

#### Response

```json
200 OK

{
    "message": "로그인 성공",
    "role": "반장",
    "name": "새벽3시에문서쓰기란너무즐거워"
}
```

- `accessToken` 쿠키가 `HttpOnly` 옵션으로 설정됩니다.

### POST /logout

로그아웃하고 `accessToken` 쿠키를 삭제합니다.

#### Response

```json
200 OK

{
    "message": "로그아웃 완료"
}
```

### GET /session

현재 로그인한 사용자 정보를 조회합니다.

#### Response

```json
200 OK

{
    "id": "21200",
    "name": "새벽3시에문서쓰기란너무즐거워",
    "role": "반장"
}
```

```json
401 Unauthorized

{
    "error": "접근 권한이 없습니다. 로그인이 필요합니다."
}
```

```json
500 Internal Server Error

{
    "error": "서버 인증 설정 오류"
}
```

### PATCH /approve/:userId

관리자가 대기 중인 사용자를 승인합니다.

#### Response

```json
200 OK

{
    "message": "승인 완료"
}
```

```json
403 Forbidden

{
    "error": "승인 권한이 없습니다."
}
```

### GET /pending-approve

관리자 승인 대기 중인 사용자 목록을 조회합니다.

#### Response

```json
200 OK

[
    {
        "_id": "67e8f5e17f9a3a001234abcd",
        "studentId": "21230",
        "name": "새벽3시에코드짜는건너무즐거워",
        "role": "부반장"
    }
]
```

```json
403 Forbidden

{
    "error": "승인 권한이 없습니다."
}
```
