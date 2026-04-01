---
url: https://developers.worksmobile.com/jp/docs/calendar-event-user-get
title: "指定カレンダーの予定の取得 | Developers"
date: 2026-04-01T17:47:15.705Z
lang: ja
---

[LINE WORKS API](/jp/docs/api) [Calendar](/jp/docs/calendar) [予定](/jp/docs/calendar-event-user-create) [取得](/jp/docs/calendar-event-user-get)

# 指定カレンダーの予定の取得

## GET /users/{userId}/calendars/{calendarId}/events/{eventId}[](#i-0)

指定カレンダーの予定を取得する。

## Authorization[](#Authorization)

### oauth2[](#oauth2)

Access Token を指定します。  
指定の方法や Access Token の取得方法は [共通仕様](/jp/docs/api-call#authorization) を参照してください。

#### Scope[](#Scope)

calendar  
calendar.read

## Request[](#Request)

### HTTP Request[](#HTTP-Request)

GET

`https://www.worksapis.com/v1.0/users/{userId}/calendars/{calendarId}/events/{eventId}`

### Path Parameters[](#Path-Parameters)

Parameter

Type

Description

userId 

string 

ユーザーを特定する ID (URL エンコードする)

*   ユーザーID (**userId**)
*   ログインID (**email**)
*   自身 ("_**me**_")

  
**required**  
**example : userf7da-f82c-4284-13e7-030f3b4c756x** 

calendarId 

string 

カレンダー ID

  
**required**  
**example : calendar-96b8-4c74-8277-7953e0b4604a** 

eventId 

string 

予定 ID (URL エンコードする)

  
**required**  
**example : eventr8123-wehuh324-qwejqw123** 

### Header Parameters[](#Header-Parameters)

Header

type

Description

Authorization 

string 

Bearer {token}

  
**required** 

## Response[](#Response)

### HTTP 200[](#HTTP-200)

OK

Property

Type

Description

eventComponents 

array ([Event](#Event)) 

予定情報

 

organizerCalendarId 

string 

イベントが属しているカレンダー ID

 

#### Event[](#Event)

Property

Type

Description

eventId 

string 

予定 ID

  
**required**  
**minLength : 1**  
**maxLength : 255** 

createdTime 

object ([createdTime](#createdTime)) 

時間情報

  
**readOnly : true** 

updatedTime 

object ([updatedTime](#updatedTime)) 

時間情報

  
**readOnly : true** 

summary 

string 

予定の内容

  
**required**  
**minLength : 0**  
**maxLength : 200** 

description 

string 

予定のメモ

  
**minLength : 0**  
**maxLength : 5000** 

location 

string 

予定の場所

  
**minLength : 0**  
**maxLength : 100** 

map 

object ([map](#map)) 

地図情報

 

mapUrl 

object ([mapUrl](#mapUrl)) 

地図 URL

 

categoryId 

string 

予定のカテゴリー ID

 

organizer 

object ([organizer](#organizer)) 

主催者  
予定が属するカレンダーを示す。

*   基本カレンダー: 基本カレンダーのマスターのログイン ID
*   基本カレンダー以外: カレンダー固有のカレンダーのメールアドレス

  
**readOnly : true** 

start 

object ([start](#start)) 

予定の開始または終了日時

  
**required** 

end 

object ([end](#end)) 

予定の開始または終了日時

 

recurrence 

array ([Recurrence](#Recurrence)) 

繰返し情報

  
**minItems : 0**  
**maxItems : 100** 

recurringEventId 

string 

繰返し例外予定 ID

*   参照) [https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.4](https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.4.4)

 

transparency 

string 

表示方法

*   **OPAQUE** : 予定あり
*   **TRANSPARENT** : 空き時間

  
**default : OPAQUE**  
**Allowed values : OPAQUE, TRANSPARENT** 

visibility 

string 

公開/非公開

*   **PUBLIC** : 公開
*   **PRIVATE** : 非公開

  
**default : PUBLIC**  
**Allowed values : PUBLIC, PRIVATE** 

sequence 

integer 

シーケンス番号

*   参照) [https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.7.4](https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.7.4)

  
**default : 0**  
**minimum : 0**  
**format : int32** 

attendees 

array ([Attendee](#Attendee)) 

参加者リスト

  
**minItems : 0**  
**maxItems : 500** 

videoMeeting 

object ([videoMeeting](#videoMeeting)) 

ビデオ通話ミーティング

 

reminders 

array ([Alarm](#Alarm)) 

通知情報

  
**minItems : 0**  
**maxItems : 100** 

attachments 

array ([File](#File)) 

添付ファイル（添付ファイルのサイズの合計が 100MB 以下）

  
**readOnly : true** 

viewUrl 

string 

予定情報の参照 URL

  
**minLength : 0**  
**format : uri**  
**readOnly : true** 

priority 

integer 

予定の重要度0 : 重要度の指定なし1 : 最も重要2 : 次に重要....9 : 最も低い重要度

  
**default : 0**  
**minimum : 0**  
**maximum : 9** 

#### createdTime[](#createdTime)

Property

Type

Description

dateTime 

string 

日時 (YYYY-MM-DDTHH:mm:ss)

 

timeZone 

string 

[タイムゾーン](/jp/docs/appendix#timezone-code)

 

#### updatedTime[](#updatedTime)

Property

Type

Description

dateTime 

string 

日時 (YYYY-MM-DDTHH:mm:ss)

 

timeZone 

string 

[タイムゾーン](/jp/docs/appendix#timezone-code)

 

#### map[](#map)

Property

Type

Description

type 

string 

地図タイプ（google など）

 

geo 

string 

経緯度

 

#### mapUrl[](#mapUrl)

Property

Type

Description

mapUrl 

string 

地図の URL

 

imageId 

string 

地図の画像 ID

 

#### organizer[](#organizer)

Property

Type

Description

email 

string 

主催者のメールアドレス

  
**required** 

displayName 

string 

主催者名

 

#### start[](#start)

Property

Type

Description

date 

string 

終日予定の場合の日付 (YYYY-MM-DD)

*   start.date は予定期間に含み、end.date は予定期間に含まない。

 

dateTime 

string 

時間予定の場合の日時 (YYYY-MM-DDTHH:mm:ss)

 

timeZone 

string 

時間予定 (dateTime) の場合の [タイムゾーン](/jp/docs/appendix#timezone-code)

 

#### end[](#end)

Property

Type

Description

date 

string 

終日予定の場合の日付 (YYYY-MM-DD)

*   start.date は予定期間に含み、end.date は予定期間に含まない。

 

dateTime 

string 

時間予定の場合の日時 (YYYY-MM-DDTHH:mm:ss)

 

timeZone 

string 

時間予定 (dateTime) の場合の [タイムゾーン](/jp/docs/appendix#timezone-code)

 

#### Recurrence[](#Recurrence)

Property

Type

Description

Recurrence 

string 

繰返し予定のルールを設定

*   参照)
*   EXDATE: [https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.1](https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.1)
*   RRULE: [https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10](https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10)  
    例) 毎週木曜日の繰り返し  
    RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TH

 

#### Attendee[](#Attendee)

Property

Type

Description

id 

string 

設備ID  
設備を指定する場合は必須

> 設備から設備 ID を取得する API は用意されていない  
> 設備を予約した予定を取得することで設備 ID を取得できる

 

email 

string 

参加者メールアドレス  
参加者を指定する場合は必須

 

displayName 

string 

参加者または設備名

 

partstat 

string 

予定招待への回答

*   **NEEDS-ACTION** : 未回答
*   **ACCEPTED** : 承諾
*   **DECLINED** : 辞退
*   **TENTATIVE** : 未定

  
**Allowed values : NEEDS-ACTION, ACCEPTED, DECLINED, TENTATIVE** 

isResource 

boolean 

設備フラグ

  
**default : false** 

isOptional 

boolean 

任意参加フラグ

  
**default : false** 

resourceValue 

string 

リソースの固有値

 

#### videoMeeting[](#videoMeeting)

Property

Type

Description

url 

string 

ビデオ通話ミーティング URL

  
**format : uri** 

resourceId 

string 

ビデオ通話ミーティング ID

 

#### Alarm[](#Alarm)

Property

Type

Description

method 

string 

通知方法

*   **DISPLAY** : プッシュ通知
*   **EMAIL** : メール通知

  
**required**  
**Allowed values : DISPLAY, EMAIL** 

trigger 

string 

予定開始前の通知タイミング  
詳細は [こちら](https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.6.3) を参照  
例)  
\-PT0S : イベント予定時刻  
\-PT15M : 15 分前  
\-PT12H : 12 時間前  
\-P1D : 1 日前  
\-P1W : 1 週間前  
\-P6DT12H : 6 日 12 時間前

 

triggerDateTime 

object ([triggerDateTime](#triggerDateTime)) 

時間情報

 

#### triggerDateTime[](#triggerDateTime)

Property

Type

Description

dateTime 

string 

日時 (YYYY-MM-DDTHH:mm:ss)

 

timeZone 

string 

[タイムゾーン](/jp/docs/appendix#timezone-code)

 

#### File[](#File)

Property

Type

Description

fileUrl 

string 

ファイル URL

  
**readOnly : true** 

fileName 

string 

ファイル名

  
**readOnly : true** 

fileSize 

integer 

ファイルサイズ

  
**minimum : 0**  
**format : int64**  
**readOnly : true** 

### Response Example[](#Response-Example)

example

`1{   2  "eventComponents": [   3    {   4      "eventId": "eventr8123-wehuh324-qwejqw123",   5      "createdTime": {   6        "dateTime": "2021-12-12T22:44:59",   7        "timeZone": "Asia/Tokyo"   8      },   9      "updatedTime": {   10        "dateTime": "2021-12-14T21:01:31",   11        "timeZone": "Asia/Tokyo"   12      },   13      "summary": "Meeting",   14      "description": "Memo",   15      "location": "CUNY Graduate Center",   16      "map": {   17        "type": "google",   18        "geo": "40.7486484;-73.98400699999999"   19      },   20      "mapUrl": {   21        "mapUrl": "https://mapUrl.googlemap.com",   22        "imageId": "imageId123"   23      },   24      "categoryId": "1",   25      "organizer": {   26        "email": "user1@example.com",   27        "displayName": "ワークス 太郎"   28      },   29      "start": {   30        "dateTime": "2021-12-13T14:00:00",   31        "timeZone": "Asia/Tokyo"   32      },   33      "end": {   34        "dateTime": "2021-12-13T15:00:00",   35        "timeZone": "Asia/Tokyo"   36      },   37      "transparency": "OPAQUE",   38      "visibility": "PUBLIC",   39      "sequence": 1,   40      "attendees": [   41        {   42          "email": "attendee1@example.com",   43          "displayName": "user1",   44          "partstat": "NEEDS-ACTION",   45          "isOptional": false,   46          "isResource": false   47        },   48        {   49          "email": "attendee2@example.com",   50          "displayName": "user2",   51          "partstat": "ACCEPTED",   52          "isOptional": true,   53          "isResource": false   54        },   55        {   56          "id": "10000355/10029600@97d9ddb4-ae93-4469-8471-110c573d13z1",   57          "partstat": "ACCEPTED",   58          "resourceValue": "https://calendar.worksmobile.com/resources/resource/10000355/10029600@97d9ddb4-ae93-4469-8471-110c573d13z1",   59          "isOptional": false,   60          "isResource": true   61        },   62        {   63          "email": "attendee3@example.com",   64          "displayName": "user3",   65          "partstat": "DECLINED",   66          "isOptional": false,   67          "isResource": false   68        }   69      ],   70      "videoMeeting": {   71        "url": "https://works.do/x4gOs1_call",   72        "resourceId": "x4gOs1_call"   73      },   74      "reminders": [   75        {   76          "method": "DISPLAY",   77          "trigger": "-PT10M"   78        },   79        {   80          "method": "EMAIL",   81          "triggerDateTime": {   82            "dateTime": "2021-12-13T10:00:00",   83            "timeZone": "Asia/Tokyo"   84          }   85        }   86      ],   87      "attachments": [   88        {   89          "fileUrl": "https://calendar.worksmobile.com/file/download?scheduleId=20211212T134459Z-153@zvcweb06.wcal.nfra.io&path=21785b23-760z-4394-badf-6463c9474746.10029600",   90          "fileName": "4024939274.pdf",   91          "fileSize": 48506   92        }   93      ],   94      "viewUrl": "https://calendar.worksmobile.com/permanentLink.nhn",   95      "priority": 0   96    }   97  ],   98  "organizerCalendarId": "calendar-96b8-4c74-8277-7953e0b4604a"   99}`

  

### HTTP 403[](#HTTP-403)

Forbidden

### HTTP 404[](#HTTP-404)

Not Found

*   [GET /users/{userId}/calendars/{calendarId}/events/{eventId}](#i-0)
*   [Authorization](#Authorization)
    *   [Scope](#Scope)
*   [Request](#Request)
    *   [HTTP Request](#HTTP-Request)
    *   [Path Parameters](#Path-Parameters)
    *   [Header Parameters](#Header-Parameters)
*   [Response](#Response)
    *   [HTTP 200](#HTTP-200)
        *   [Event](#Event)
        *   [createdTime](#createdTime)
        *   [updatedTime](#updatedTime)
        *   [map](#map)
        *   [mapUrl](#mapUrl)
        *   [organizer](#organizer)
        *   [start](#start)
        *   [end](#end)
        *   [Recurrence](#Recurrence)
        *   [Attendee](#Attendee)
        *   [videoMeeting](#videoMeeting)
        *   [Alarm](#Alarm)
        *   [triggerDateTime](#triggerDateTime)
        *   [File](#File)
    *   [Response Example](#Response-Example)
    *   [HTTP 403](#HTTP-403)
    *   [HTTP 404](#HTTP-404)

[

前へ

リスト取得

](/jp/docs/calendar-event-user-list)[

次へ

更新

](/jp/docs/calendar-event-user-update-put)
