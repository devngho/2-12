## /api/menu

### GET /

날짜별 급식 정보를 조회합니다.

#### Request

- date: 조회 날짜 (YYYYMMDD)

```json
GET /api/menu?date=20260402
```

#### Response

```json
200 OK

(NEIS API의 mealServiceDietInfo[1].row)
```

```json
400 Bad Request

{
    "error": "date 쿼리가 필요합니다."
}
```