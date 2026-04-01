---
url: https://developers.worksmobile.com/jp/docs/bot-user-message-send
title: "メッセージの送信 - ユーザー指定 | Developers"
date: 2026-04-01T18:06:51.575Z
lang: ja
---

[LINE WORKS API](/jp/docs/api) [Bot](/jp/docs/bot-api) [メッセージの送信](/jp/docs/bot-channel-message-send) [ユーザー指定](/jp/docs/bot-user-message-send)

# メッセージの送信 - ユーザー指定

## POST /bots/{botId}/users/{userId}/messages[](#i-0)

ユーザーにメッセージを送信する。  
各テンプレートまたはクイックリプライで **postback** メッセージを利用するには [Callback (メッセージの受信)](/jp/docs/bot-callback) を参照。

各テンプレートとクイックリプライの構造は以下の通り。

Button template  
![Image](/image/jp/api/reference/bot/273.png)

List template  
![Image](/image/jp/api/reference/bot/275.png)

Carousel template  
![Image](/image/jp/api/reference/bot/277.png)

Image carousel template  
![Image](/image/jp/api/reference/bot/279.png)

Flexible template  
![Image](/image/jp/api/reference/bot/606.png)

Quick reply  
![Image](/image/jp/api/reference/bot/267.png)

## Authorization[](#Authorization)

### oauth2[](#oauth2)

Access Token を指定します。  
指定の方法や Access Token の取得方法は [共通仕様](/jp/docs/api-call#authorization) を参照してください。

#### Scope[](#Scope)

bot.message  
bot

## Request[](#Request)

### HTTP Request[](#HTTP-Request)

POST

`https://www.worksapis.com/v1.0/bots/{botId}/users/{userId}/messages`

### Path Parameters[](#Path-Parameters)

Parameter

Type

Description

botId 

integer 

Bot ID

  
**required**  
**example : 2000001**  
**format : int64** 

userId 

string 

ユーザーを特定する ID (URL エンコードする)

*   ユーザー ID (**userId**)
*   ログイン ID (**email**)

  
**required**  
**example : userf7da-f82c-4284-13e7-030f3b4c756x** 

### Header Parameters[](#Header-Parameters)

Header

type

Description

Authorization 

string 

Bearer {token}

  
**required** 

Content-Type 

string 

application/json

  
**required**  
**example : application/json** 

### Request Body[](#Request-Body)

[メッセージタイプ](/jp/docs/bot-send-content) を参照。

> 注意
> 
> *   ドキュメントを参照し、必ずドキュメントに定義されたプロパティを使用してください。ドキュメントに定義されていないプロパティを使用すると、エラーや意図しない動作を引き起こす可能性があります。

## Response[](#Response)

### HTTP 201[](#HTTP-201)

OK

*   [POST /bots/{botId}/users/{userId}/messages](#i-0)
*   [Authorization](#Authorization)
    *   [Scope](#Scope)
*   [Request](#Request)
    *   [HTTP Request](#HTTP-Request)
    *   [Path Parameters](#Path-Parameters)
    *   [Header Parameters](#Header-Parameters)
    *   [Request Body](#Request-Body)
*   [Response](#Response)
    *   [HTTP 201](#HTTP-201)

[

前へ

トークルーム指定

](/jp/docs/bot-channel-message-send)[

次へ

アップロード

](/jp/docs/bot-attachment-create)