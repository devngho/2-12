## /api/boards

### POST /

게시글을 등록합니다.

`Content-Type: multipart/form-data` 요청을 받으며 텍스트 필드와 파일 첨부를 함께 보낼 수 있습니다.

#### Request Body

- `title` (string, 필수): 게시글 제목
- `category` (string, 필수): `공지` | `수행` | `일반` | `파일`
- `content` (string, 필수): 게시글 내용
- `deadline` (string, 선택): ISO Date 문자열
- `dDayAlarm` (number, 선택): D-Day 알림 기준 일수 (기본값 3)
- `files` (file[], 선택): 첨부 파일 배열. 키 이름은 `files`

예시 (multipart form-data):

```text
title: 수행평가 공지
category: 수행
content: 다음 주 월요일까지 수행평가 계획서를 제출하세요.
deadline: 2026-03-25T00:00:00.000Z
dDayAlarm: 3
files: <첨부파일1>
files: <첨부파일2>
```

#### Response

```json
201 Created

{
    "message": "글이 등록되었습니다.",
    "data": {
        "_id": "67e8f9bb7f9a3a001234abcd",
        "title": "수행평가 공지",
        "category": "공지",
        "content": "다음 주 월요일까지 수행평가 계획서를 제출하세요.",
        "deadline": "2026-03-25T00:00:00.000Z",
        "dDayAlarm": 3,
        "authorId": "21200",
        "authorName": "홍길동",
        "files": [
            {
                "fileName": "guide.pdf",
                "filePath": "uploads/boards/1743500012345-123456789.pdf"
            }
        ],
        "createdAt": "2026-03-20T09:12:00.000Z"
    }
}
```

```json
400 Bad Request

{
    "error": "title, category, content는 문자열이어야 합니다."
}
```

```json
403 Forbidden

{
    "error": "공지는 관리자, 반장, 부반장만 작성할 수 있습니다."
}
```

### GET /

게시글 목록을 조회합니다. `category` 쿼리로 필터링할 수 있습니다.

#### Query

- `category`: 게시글 카테고리 (`공지`, `일반`)

#### Response

```json
200 OK

[
    {
        "_id": "67e8f9bb7f9a3a001234abcd",
        "title": "수행평가 공지",
        "category": "공지",
        "content": "다음 주 월요일까지 수행평가 계획서를 제출하세요.",
        "deadline": "2026-03-25T00:00:00.000Z",
        "dDayAlarm": 3,
        "authorId": "21200",
        "authorName": "홍길동",
        "createdAt": "2026-03-20T09:12:00.000Z"
    }
]
```

```json
400 Bad Request

{
    "error": "카테고리 쿼리는 문자열이어야 합니다."
}
```

### GET /alerts

D-Day 알림 조건에 맞는 글 목록을 조회합니다.

#### Response

```json
200 OK

[]
```

### PATCH /change-pw

관리자/반장/부반장이 대상 사용자 비밀번호를 변경합니다.

#### Request Body

```json
{
    "targetId": "67e8f5e17f9a3a001234abcd",
    "newPassword": "newPassword123"
}
```

#### Response

```json
200 OK

{
    "message": "비밀번호가 변경되었습니다."
}
```

```json
403 Forbidden

{
    "error": "비밀번호 수정 권한이 없습니다."
}
```

```json
404 Not Found

{
    "error": "대상 사용자를 찾을 수 없습니다."
}
```
