## /api/timetable

### GET /

기간별 시간표를 조회합니다. 개인 선택 데이터가 있으면 과목/교사/강의실 정보가 함께 반환됩니다.

#### Request

- `startDate`: 조회 시작 날짜 (YYYYMMDD)
- `endDate`: 조회 종료 날짜 (YYYYMMDD)

```json
GET /api/timetable?startDate=20260323&endDate=20260327
```

#### Response

```json
200 OK

[
    {
        "name": "국어",
        "period": "1",
        "date": "20260323",
        "subject": null,
        "teacher": null,
        "room": null
    },
    ...,
    {
        "name": "탐구B",
        "period": "4",
        "date": "20260323",
        "subject": "인공지능 기초",
        "teacher": "새벽3시에문서쓰기란너무즐거워",
        "room": "212"
    },
    ...
]
```

```json
400 Bad Request

{
    "error": "startDate와 endDate 쿼리가 필요합니다."
}
```

```json
400 Bad Request

{
    "error": "startDate와 endDate는 문자열이어야 합니다."
}
```

```json
500 Internal Server Error

{
    "error": "시간표 조회 오류"
}
```

### POST /select

개인 시간표 선택 정보를 저장합니다.

#### Request Body

```json
{
    "selections": [
        {
            "name": "탐구A",
            "subject": "화학",
            "teacher": "새벽3시에코드짜는건너무즐거워",
            "room": "212"
        },
        {
            "name": "탐구B",
            "subject": "인공지능 기초",
            "teacher": "새벽3시에문서쓰기란너무즐거워",
            "room": "212"
        }
    ]
}
```

#### Response

```json
200 OK

{
    "message": "선택이 저장되었습니다."
}
```

```json
400 Bad Request

{
    "error": "selections는 배열이어야 합니다."
}
```

```json
500 Internal Server Error

{
    "error": "선택 저장 오류"
}
```
