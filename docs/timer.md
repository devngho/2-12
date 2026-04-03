## /api/timer

### GET /status

주어진 기간동안 자신의 공부 시간 기록을 조회합니다.

#### Request

- `period`: 조회할 기간 (day: 오늘, week: 이번 주, month: 이번 달)

```json
GET /api/timer/status?period=[period]
```

#### Response

응답의 기간은 모두 초 단위입니다.

```json
200 OK
{
    "totalTime": 3600,
    "sessions": [
        {
            "startTime": "2026-03-23T14:00:00Z",
            "endTime": "2026-03-23T15:00:00Z",
            "duration": 1800,
            "subject": "수학",
        },
        ...
    ],
    "subjects": {
        "국어": 1200,
        "수학": 1800,
        "영어": 600
    }
}
```

### POST /start

공부 타이머를 시작합니다.

#### Request

```json
POST /api/timer/start?subject=[subject]
```

#### Response

```json
200 OK
{
    "message": "타이머 시작",
    "startTime": "2026-03-23T14:00:00Z"
}
```

### POST /stop

공부 타이머를 중지합니다.

#### Request

```json
POST /api/timer/stop
```

#### Response

```json
200 OK
{
    "message": "타이머 중지",
    "startTime": "2026-03-23T14:00:00Z",
    "endTime": "2026-03-23T15:00:00Z",
    "duration": 3600,
    "subject": "수학"
}
```

### GET /rank

주어진 기간동안 전체 학생들의 공부 시간 랭킹을 조회합니다.

#### Request

```json
GET /api/timer/rank?period=[period]
```

#### Response

```json
200 OK
[
    {
        "rank": 1,
        "studentId": "21200",
        "name": "새벽3시에문서쓰기란너무즐거워",
        "totalTime": 233431200
    },
    ...
]
```