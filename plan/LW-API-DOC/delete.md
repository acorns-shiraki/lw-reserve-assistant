---
url: https://developers.worksmobile.com/jp/docs/calendar-default-event-user-delete
title: "基本カレンダーの予定の削除 | Developers"
date: 2026-04-01T17:51:24.695Z
lang: ja
---

[LINE WORKS API](/jp/docs/api) [Calendar](/jp/docs/calendar) [予定](/jp/docs/calendar-event-user-create) [基本カレンダーの予定の削除](/jp/docs/calendar-default-event-user-delete)

# 基本カレンダーの予定の削除

## DELETE /users/{userId}/calendar/events/{eventId}[](#i-0)

基本カレンダーの予定を削除する。

## Authorization[](#Authorization)

### oauth2[](#oauth2)

Access Token を指定します。  
指定の方法や Access Token の取得方法は [共通仕様](/jp/docs/api-call#authorization) を参照してください。

#### Scope[](#Scope)

calendar

## Request[](#Request)

### HTTP Request[](#HTTP-Request)

DELETE

`https://www.worksapis.com/v1.0/users/{userId}/calendar/events/{eventId}`

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

eventId 

string 

予定 ID (URL エンコードする)

  
**required**  
**example : eventr8123-wehuh324-qwejqw123** 

### Query Parameters[](#Query-Parameters)

Parameter

Type

Description

sendNotification 

boolean 

通知の送信フラグ

  
**default : true**  
**allowEmptyValue : true** 

### Header Parameters[](#Header-Parameters)

Header

type

Description

Authorization 

string 

Bearer {token}

  
**required** 

## Response[](#Response)

### HTTP 204[](#HTTP-204)

No Content

### HTTP 403[](#HTTP-403)

Forbidden

### HTTP 404[](#HTTP-404)

Not Found

*   [DELETE /users/{userId}/calendar/events/{eventId}](#i-0)
*   [Authorization](#Authorization)
    *   [Scope](#Scope)
*   [Request](#Request)
    *   [HTTP Request](#HTTP-Request)
    *   [Path Parameters](#Path-Parameters)
    *   [Query Parameters](#Query-Parameters)
    *   [Header Parameters](#Header-Parameters)
*   [Response](#Response)
    *   [HTTP 204](#HTTP-204)
    *   [HTTP 403](#HTTP-403)
    *   [HTTP 404](#HTTP-404)

[

前へ

基本カレンダーの予定の更新

](/jp/docs/calendar-default-event-user-update-put)[

次へ

Form API の概要

](/jp/docs/form)
