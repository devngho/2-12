## /api/files

### GET /

자료 목록을 조회합니다.

#### Query

- `category`: 라우터에서 지원하지만 현재 `File` 모델에 `category` 필드가 없어 실질 필터링에 사용되지 않습니다.

#### Response

```json
200 OK

[
    {
        "_id": "67e8ff157f9a3a001234abcd",
        "fileName": "1742456789123.pdf",
        "filePath": "uploads/1742456789123.pdf",
        "size": 251328,
        "authorId": "21200",
        "uploadDate": "2026-03-21T08:10:00.000Z",
        "preserve": false
    }
]
```

### POST /upload

파일을 업로드합니다. `multipart/form-data`로 전송해야 합니다.

#### Request Body

```text
file: (binary)
description: "중간고사 범위 정리"
preserve: "true"
```

#### Response

```json
500 Internal Server Error

{
    "error": "업로드 오류"
}
```

```json
400 Bad Request

{
    "error": "파일이 첨부되지 않았습니다."
}
```

### PATCH /:id/preserve

반장/관리자가 파일 보존 여부를 변경합니다.

#### Request Body

```json
{
    "preserve": true
}
```

#### Response

```json
200 OK

{
    "message": "보존 설정 변경됨",
    "preserve": true
}
```

```json
403 Forbidden

{
    "error": "권한이 없습니다."
}
```

```json
400 Bad Request

{
    "error": "preserve 필드는 boolean이어야 합니다."
}
```

```json
404 Not Found

{
    "error": "파일 없음"
}
```

### DELETE /:id

파일을 삭제합니다. 작성자 본인 또는 반장/관리자만 삭제할 수 있습니다.

#### Response

```json
200 OK

{
    "message": "파일 삭제됨"
}
```

```json
403 Forbidden

{
    "error": "삭제 권한이 없습니다."
}
```

```json
404 Not Found

{
    "error": "파일 없음"
}
```

```json
500 Internal Server Error

{
    "error": "물리적 삭제 실패"
}
```
