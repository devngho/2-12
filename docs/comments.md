## /api/comments

### POST /

댓글을 등록합니다.

- 인증 필요: 예 (`verifyToken`)

#### Request Body

```json
{
    "boardId": "67e8f9bb7f9a3a001234abcd",
    "nickname": "ㅇㅇ",
    "content": "개추"
}
```

#### Response

```json
201 Created

{
    "message": "댓글이 등록되었습니다.",
    "data": [
        {
            "nickname": "ㅇㅇ",
            "content": "개추",
            "commentedAt": "2026-04-04T10:30:00.000Z"
        }
    ]
}
```

```json
400 Bad Request

{
    "error": "boardId, nickname, content는 문자열이어야 합니다."
}
```

```json
404 Not Found

{
    "error": "게시글을 찾을 수 없습니다."
}
```

```json
500 Internal Server Error

{
    "error": "댓글 등록 오류"
}
```

### GET /:boardId

게시글의 댓글 목록을 조회합니다.

#### Path Parameter

- `boardId`: 댓글을 조회할 게시글 ID

#### Response

```json
200 OK

[
    {
        "nickname": "홍길동",
        "content": "좋은 공지 감사합니다.",
        "commentedAt": "2026-04-04T10:30:00.000Z"
    }
]
```

```json
404 Not Found

{
    "error": "게시글을 찾을 수 없습니다."
}
```

```json
500 Internal Server Error

{
    "error": "댓글 조회 오류"
}
```
