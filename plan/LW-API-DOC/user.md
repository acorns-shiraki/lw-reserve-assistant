---
url: https://developers.worksmobile.com/jp/docs/user-get
title: "ユーザーの取得 | Developers"
date: 2026-04-01T18:09:08.235Z
lang: ja
---

[LINE WORKS API](/jp/docs/api) [Directory](/jp/docs/directory) [ユーザー (メンバー)](/jp/docs/user-create) [取得](/jp/docs/user-get)

# ユーザーの取得

## GET /users/{userId}[](#i-0)

ユーザーを取得する。

> 注意
> 
> *   取得できるプロパティは、[管理項目](https://admin.worksmobile.com/member/users#fields) 設定などのサービスによる制約に従います。
> *   **X(Twitter)** に対する Response Body の SNS タイプ messenger.protocol には、現在は **TWITTER** が返りますが、2026年7月下旬を目処に **X** に変更を予定しています。

## Authorization[](#Authorization)

### oauth2[](#oauth2)

Access Token を指定します。  
指定の方法や Access Token の取得方法は [共通仕様](/jp/docs/api-call#authorization) を参照してください。

#### Scope[](#Scope)

user  
user.read  
directory  
directory.read

## Request[](#Request)

### HTTP Request[](#HTTP-Request)

GET

`https://www.worksapis.com/v1.0/users/{userId}`

### Path Parameters[](#Path-Parameters)

Parameter

Type

Description

userId 

string 

ユーザーを特定する ID (URL エンコードする)

*   ユーザー ID (**userId**)
*   ログイン ID (**email**)
*   ユーザーの ExternalKey (**externalKey:{userExternalKey}**)

  
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

## Response[](#Response)

### HTTP 200[](#HTTP-200)

OK

Property

Type

Description

domainId 

integer 

ドメイン ID

  
**required**  
**format : int32** 

userId 

string 

ユーザー ID

*   ユーザーのリソース ID
*   登録時に自動発行されるユニーク ID

  
**readOnly : true** 

userExternalKey 

string 

顧客企業で管理するユーザーの ExternalKey  
"_**%**_"、"_**\\**_"、"_**#**_"、"_**/**_"、"_**?**_" の特殊文字は利用できない。

  
**maxLength : 100**  
**nullable : true** 

isAdministrator 

boolean 

ドメイン管理者フラグ

  
**readOnly : true** 

isPending 

boolean 

登録待ちステータスフラグ

  
**readOnly : true** 

isSuspended 

boolean 

一時停止ステータスフラグ

  
**readOnly : true** 

isDeleted 

boolean 

削除ステータスフラグ

  
**readOnly : true** 

isAwaiting 

boolean 

待機中フラグ

  
**readOnly : true** 

leaveOfAbsence 

object ([leaveOfAbsence](#leaveOfAbsence)) 

  
**readOnly : true** 

suspendedReason 

string 

一時停止理由

*   **MASTER** : 管理者による一時停止
*   **LOGIN\_FAIL** : ログインに失敗

  
**Allowed values : MASTER, LOGIN\_FAIL,**  
**readOnly : true**  
**nullable : true** 

email 

string 

ログイン ID = メールアドレス  
アドバンストプランの場合、**ID@ドメイン名**  
他のプランの場合、**ID@グループ名**  
**localpart@domain** の場合の **localpart** の制限

*   2 ～ 40 字の英小文字、数字、ドット ("_**.**_")、ハイフン ("_**\-**_")、アンダーバー ("_**\_**_") のみ使用できる
*   最初の文字には英小文字、数字のみ使用できる
*   ドット ("_**.**_") は最初と最後、および連続 ("_**..**_") では使用できない

  
**required**  
**maxLength : 90** 

userName 

object ([userName](#userName)) 

名前情報

  
**required** 

i18nNames 

array ([UserI18nName](#UserI18nName)) 

多言語名リスト

  
**minItems : 0** 

nickName 

string 

ニックネーム

*   許容される特殊文字: !@&()-\_+\[\]{},./#'\`^~

  
**maxLength : 100**  
**nullable : true** 

privateEmail 

string 

個人メールアドレス

*   SSO を使用せず、**passwordConfig.passwordCreationType** が **MEMBER** の場合は必須
*   最高管理者の場合は必須
*   有効なメールアドレスを指定する  
    **localpart@domain**の制限
*   localpart は 64 文字以下
*   domain は 253 文字以下

  
**maxLength : 256**  
**nullable : true** 

aliasEmails 

array (string) 

サブメールアドレスリスト  
アドバンストプランでのみ登録できる  
**localpart@domain** の場合の **localpart** の制限

*   最初の文字は英小文字、数字のみ使用できる
*   ドット ("_**.**_") は最初と最後および連続 ("_**..**_")は使用できない。
*   2 ～ 40字の英小文字、数字、ドット ("_**.**_")、ハイフン ("_**\-**_")、アンダーバー ("_**\_**_") のみ使用できる。

  
**minItems : 0**  
**maxItems : 10** 

employmentTypeId 

string 

利用権限タイプ ID  
利用権限タイプ設定を使用している場合のみ指定可 (既定値: 利用権限タイプなし)

*   利用権限タイプ ID
*   利用権限タイプの ExternalKey (**externalKey:{employmentTypeExternalKey}**)

> 注意  
> 本プロパティは廃止予定です。今後は **userTypeId** を使用してください。

  
**nullable : true** 

employmentTypeExternalKey 

string 

利用権限タイプの ExternalKey

> 注意  
> 本プロパティは廃止予定です。今後は **userTypeExternalKey** を使用してください。

  
**maxLength : 100**  
**readOnly : true**  
**nullable : true** 

employmentTypeName 

string 

利用権限タイプ名

> 注意  
> 本プロパティは廃止予定です。今後は **userTypeName** を使用してください。

  
**readOnly : true**  
**nullable : true** 

userTypeId 

string 

利用権限タイプ ID  
利用権限タイプ設定を使用している場合のみ指定可 (既定値: 利用権限タイプなし)

*   利用権限タイプ ID
*   利用権限タイプの ExternalKey (**externalKey:{userTypeExternalKey}**)

  
**nullable : true** 

userTypeExternalKey 

string 

利用権限タイプの ExternalKey

  
**maxLength : 100**  
**readOnly : true**  
**nullable : true** 

userTypeName 

string 

利用権限タイプ名

  
**readOnly : true**  
**nullable : true** 

userTypeCode 

string 

利用権限タイプコード  
英字 (A ~ Z、a ~ z)、数字 (0 ~ 9)、underscore (\_) が利用でき、最大 50 文字まで指定できる。  
英字で始めなければならない。

  
**maxLength : 50**  
**readOnly : true**  
**nullable : true** 

searchable 

boolean 

サジェストへの表示フラグ (既定値: true)

  
**default : true** 

organizations 

array ([UserOrganization](#UserOrganization)) 

ユーザーが所属するドメインリスト (原職、兼職含む)

  
**minItems : 0** 

telephone 

string 

電話番号  
許容される特殊文字: -\*#+P T()

  
**maxLength : 100**  
**pattern : ^(?=.\*\[0-9\])\[0-9+\\-\*#PTpt()\\u3000\]{0,100}**  
**nullable : true** 

cellPhone 

string 

携帯電話番号  
許容される特殊文字: -\*#+P T()

  
**maxLength : 100**  
**pattern : ^(?=.\*\[0-9\])\[0-9+\\-\*#PTpt()\\u3000\]{0,100}**  
**nullable : true** 

location 

string 

勤務先

  
**maxLength : 100**  
**nullable : true** 

task 

string 

担当業務

  
**maxLength : 100**  
**nullable : true** 

messenger 

object ([messenger](#messenger)) 

SNS タイプモデル

  
**nullable : true** 

birthdayCalendarType 

string 

誕生日の日付タイプ

*   **SOLAR** : 西暦
*   **LUNAR** : 旧暦

  
**Allowed values : SOLAR, LUNAR**  
**nullable : true** 

birthday 

string 

生年月日 (YYYY-MM-DD)

  
**maxLength : 10**  
**nullable : true** 

locale 

string 

多言語コード

  
**Allowed values : ja\_JP, ko\_KR, en\_US, zh\_CN, zh\_TW** 

hiredDate 

string 

入社日 (YYYY-MM-DD)

  
**maxLength : 10**  
**nullable : true** 

timeZone 

string 

[タイムゾーン](/jp/docs/appendix#timezone-code)

  
**example : Europe/Berlin** 

customFields 

array ([UserCustomField](#UserCustomField)) 

*   1 ユーザーに登録できるカスタムフィールドは最大で 50 個
*   1 ユーザーに同一の **customFieldId** で登録できるカスタムフィールドは最大で 10 個

> 注意  
> 本プロパティは2026年7月下旬を目処に廃止予定です。今後は **customProperties** を使用してください。

  
**minItems : 0**  
**maxItems : 50** 

customProperties 

object ([customProperties](#customProperties)) 

ユーザーカスタムプロパティ  
[ユーザーカスタムプロパティの登録](/jp/docs/directory-user-custom-property-create) を利用して、事前にカスタムフィールドを作成します。

*   customProperties の key の値は、[ユーザーカスタムプロパティの登録](/jp/docs/directory-user-custom-property-create) で設定した propertyName の値です。
*   customProperties の value の値は、フィールドの propertyType、multiValued の値によって type が異なります。詳細は customProperties を参照してください。
*   customProperties では、複数のユーザーカスタムプロパティに対する値を同時に設定することができます。

 

relations 

array ([UserRelation](#UserRelation)) 

関係者連絡先リスト

  
**minItems : 0**  
**maxItems : 10** 

activationDate 

string 

利用開始日 (形式 YYYY-MM-DDThh:mm:ssTZD)

*   ユーザーが利用可能になる未来の日時を指定可能
*   null の場合には、ユーザーは即時に利用可能

  
**maxLength : 25**  
**nullable : true** 

employeeNumber 

string 

社員番号

  
**minLength : 1**  
**maxLength : 20**  
**nullable : true** 

#### leaveOfAbsence[](#leaveOfAbsence)

Property

Type

Description

startTime 

string 

休職の開始日時 (YYYY-MM-DDThh:mm:ssTZD)

  
**nullable : true** 

endTime 

string 

休職の終了日時 (YYYY-MM-DDThh:mm:ssTZD)

  
**nullable : true** 

isLeaveOfAbsence 

boolean 

休職中フラグ

 

#### userName[](#userName)

Property

Type

Description

lastName 

string 

姓

*   姓、名を合わせて最大 80 字まで使用できる
*   姓と名のいずれか 1 つは必須
*   許容される特殊文字: !@&()-\_+\[\]{},./#'\`^~

  
**maxLength : 80**  
**nullable : true** 

firstName 

string 

名

*   姓、名を合わせて最大 80 字まで使用できる
*   姓と名のいずれか1つは必須
*   許容される特殊文字: !@&()-\_+\[\]{},./#'\`^~

  
**maxLength : 80**  
**nullable : true** 

phoneticLastName 

string 

姓のフリガナ (カタカナのみ許可)

  
**maxLength : 100**  
**nullable : true** 

phoneticFirstName 

string 

名のフリガナ (カタカナのみ許可)

  
**maxLength : 100**  
**nullable : true** 

#### UserI18nName[](#UserI18nName)

Property

Type

Description

language 

string 

多言語コード

  
**Allowed values : ja\_JP, ko\_KR, en\_US, zh\_CN, zh\_TW** 

firstName 

string 

多言語の名

*   組織図の多言語の名の後ろに表示
*   許容される特殊文字: !@&()-\_+\[\]{},./#'\`^~

  
**maxLength : 100**  
**nullable : true** 

lastName 

string 

多言語の姓

*   組織図の多言語の名の前に表示
*   許容される特殊文字: !@&()-\_+\[\]{},./#'\`^~

  
**maxLength : 100**  
**nullable : true** 

#### UserOrganization[](#UserOrganization)

Property

Type

Description

domainId 

integer 

ドメイン ID

  
**required**  
**format : int32** 

primary 

boolean 

代表ドメインフラグ  
必ず代表 (**primary: true**) を1つ設定してください。代表を設定しない場合、自動的に一番最初の値が代表に設定されます。

  
**required** 

userExternalKey 

string 

顧客企業で管理するユーザーの ExternalKey

> 注意
> 
> *   `organizations[].userExternalKey` ではなく、user の `userExternalKey` の値を設定・参照してください。
> *   [ユーザーの登録](/jp/docs/user-create)、[ユーザーの更新](/jp/docs/user-update-put)、[ユーザーの部分更新](/jp/docs/user-update-patch) で `organizations[].userExternalKey` を指定しても、値は反映されません。  
>     "_**%**_"、"_**\\**_"、"_**#**_"、"_**/**_"、"_**?**_" の特殊文字は利用不可。

  
**maxLength : 100**  
**nullable : true** 

email 

string 

メールアドレス  
アドバンストプランで原職と兼職に異なるメールアドレスを設定するときに使用。

  
**maxLength : 90** 

levelId 

string 

職級 ID  
職級設定を使用している場合のみ指定可 (既定値: なし)

*   職級 ID (**levelId**)
*   職級の ExternalKey (**externalKey:{levelExternalKey}**)

  
**nullable : true** 

levelExternalKey 

string 

職級の ExternalKey

  
**maxLength : 100**  
**readOnly : true**  
**nullable : true** 

levelName 

string 

職級名

  
**readOnly : true**  
**nullable : true** 

executive 

boolean 

役員フラグ

  
**readOnly : true** 

organizationName 

string 

会社名

  
**readOnly : true** 

orgUnits 

array ([orgUnit](#orgUnit)) 

組織リスト

  
**minItems : 0**  
**maxItems : 30** 

#### orgUnit[](#orgUnit)

Property

Type

Description

orgUnitId 

string 

組織 ID

*   組織 ID (**orgUnitId**)
*   組織の ExternalKey (**externalKey:{orgUnitExternalKey}**)

  
**required** 

orgUnitExternalKey 

string 

組織の ExternalKey

  
**maxLength : 100**  
**readOnly : true**  
**nullable : true** 

orgUnitName 

string 

組織名

  
**readOnly : true** 

orgUnitEmail 

string 

組織のメールアドレス

  
**readOnly : true** 

primary 

boolean 

代表組織フラグ  
必ず代表 (**primary: true** )を1つ設定してください。代表を設定しない場合、自動的に一番最初の値が代表に設定されます。

  
**required** 

positionId 

string 

役職 ID  
役職設定を使用している場合のみ指定可 (既定値: 役職なし)

*   役職 ID (**positionId**)
*   役職の ExternalKey (**externalKey:{positionExternalKey}**)

  
**nullable : true** 

positionExternalKey 

string 

役職の ExternalKey

  
**maxLength : 100**  
**readOnly : true**  
**nullable : true** 

positionName 

string 

役職名

  
**readOnly : true**  
**nullable : true** 

isManager 

boolean 

組織長フラグ (既定値: **false**)  
既存の組織長が設定されている場合は上書き (既存の組織長は解除される)。

  
**default : false** 

visible 

boolean 

ユーザー公開フラグ (既定値: **true**)  
組織図から組織のユーザーとして表示するかどうか。

  
**default : true** 

useTeamFeature 

boolean 

組織のトークルーム機能の利用フラグ (既定値: **true**)  
組織に所属しているがトークルームでのメッセージ受信やファイル共有、組織メール受信などの、組織のトークルーム機能を制限したい場合にこのパラメータを利用する。  
この値が **true** の場合、以下の機能を利用可能。

*   組織トークルームのメンバーとして参加 (トーク、ノート、カレンダー、フォルダの閲覧)
*   組織宛メールの受信
*   組織カレンダーの参照、および宛の予定招待の受信
*   組織宛に共有された掲示板、Drive、アンケート回答
*   組織をグループのユーザーとして設定した場合、グループのユーザーに含まれるこの値が **false** の場合、組織に提供される上記のすべての機能は利用できない。  
    組織のユーザーとして所属しているが、上記のような組織のトークルーム機能を利用しない場合、この値を **false** に設定する。

  
**default : true** 

#### messenger[](#messenger)

Property

Type

Description

protocol 

string 

SNS タイプ

> *   Request Body における SNS タイプ messenger.protocol での **TWITTER** と **X** は、どちらも X(Twitter) を示します。**TWITTER** は、2026年11月中旬を目処に廃止を予定しています。
> *   **X(Twitter)** に対する Response Body の SNS タイプ messenger.protocol には、現在は **TWITTER** が返りますが、2026年7月下旬を目処に **X** に変更を予定しています。

*   **LINE** : LINE
*   **FACEBOOK** : Facebook
*   **TWITTER** : X (Twitter)
*   **X** : X (Twitter)
*   **CUSTOM**: カスタム

  
**required**  
**Allowed values : LINE, FACEBOOK, TWITTER, X, CUSTOM** 

customProtocol 

string 

カスタム SNS タイプ

*   SNS タイプが **CUSTOM** の場合に指定する

  
**maxLength : 100** 

messengerId 

string 

SNS ID

  
**required**  
**minLength : 1**  
**maxLength : 100** 

#### UserCustomField[](#UserCustomField)

Property

Type

Description

customFieldId 

string 

カスタムフィールドを識別できる値

*   作成時の **resourceId**
*   クライアントが管理するキー **externalKey:{customFieldExternalKey}**

  
**required** 

customFieldExternalKey 

string 

カスタムフィールド ExternalKey

  
**maxLength : 100**  
**readOnly : true**  
**nullable : true** 

value 

string 

カスタムフィールドテキスト

*   カスタムフィールドタイプが **STRING** の場合は必須

  
**maxLength : 100**  
**nullable : true** 

link 

string 

カスタムフィールドリンク  
カスタムフィールドタイプが **LINK** の場合は必須  
link には有効な URL 形式を指定します。

*   value と link の両方を指定した場合 : リンク付きテキスト表示
*   link のみ指定した場合 : URL 表示

  
**maxLength : 300**  
**nullable : true** 

#### customProperties[](#customProperties)

Property

Type

Description

propertyName 

string 

propertyType = STRING、multiValued = false の場合

  
**maxLength : 100** 

array (string) 

propertyType = STRING、multiValued = true の場合

  
**maxItems : 10** 

string 

propertyType = STRING、multiValued = false で、 options (選択肢リスト) が存在する場合  
options (選択肢リスト) 内の optionName (選択肢名) を一つ指定する。

 

array (string) 

propertyType = STRING、multiValued = true で、 options (選択肢リスト) が存在する場合  
options (選択肢リスト) 内の optionName (選択肢名) を一つ指定する。

  
**maxItems : 10** 

string 

propertyType = DATE、multiValued = false の場合。日付 (YYYY-MM-DD)

  
**pattern : YYYY-MM-DD**  
**format : date** 

array (string) 

propertyType = DATE、multiValued = true の場合。日付 (YYYY-MM-DD)

  
**maxItems : 10** 

integer 

propertyType = INTEGER、multiValued = false の場合

  
**minimum : 0** 

array (integer) 

propertyType = INTEGER、multiValued = true の場合

  
**maxItems : 10** 

object ([CustomPropertyLink](#CustomPropertyLink)) 

propertyType が LINK で、multiValued が false の場合

*   link は必須。
*   link には有効な URL 形式を指定します。
*   link のみが指定されている場合には、link が表示テキストになる。
*   text と link を両方指定し、 text が 'Homepage1'、link が '[https://www.example.com](https://www.example.com)' の場合には以下となる。
    *   <a href = "[https://www.example.com">Homepage1](https://www.example.com%22%3EHomepage1)</a>

 

array ([CustomPropertyLink](#CustomPropertyLink)) 

propertyType = LINK で、multiValued = true の場合

*   link は必須。
*   link のみが指定されている場合には、link が表示テキストになる。
*   text と link を両方指定し、 text が 'Homepage1'、link が '[https://www.example.com](https://www.example.com)' の場合には以下となる。
    *   <a href = "[https://www.example.com">Homepage1](https://www.example.com%22%3EHomepage1)</a>

  
**maxItems : 10** 

#### CustomPropertyLink[](#CustomPropertyLink)

Property

Type

Description

text 

string 

テキスト

  
**maxLength : 100**  
**nullable : true** 

link 

string 

URL

  
**maxLength : 300** 

#### UserRelation[](#UserRelation)

Property

Type

Description

relationUserId 

string 

関係者連絡先ユーザー ID

 

relationName 

string 

関係性

  
**maxLength : 50** 

externalKey 

string 

externalKey

  
**maxLength : 100**  
**readOnly : true**  
**nullable : true** 

### Response Example[](#Response-Example)

example

`1{   2  "domainId": 10000001,   3  "userId": "userf7da-f82c-4284-13e7-030f3b4c756x",   4  "userExternalKey": "USER_EXT_01",   5  "isAdministrator": false,   6  "isPending": false,   7  "isSuspended": false,   8  "isDeleted": false,   9  "isAwaiting": true,   10  "suspendedReason": null,   11  "email": "localpart@example.com",   12  "userName": {   13    "lastName": "ワークス",   14    "firstName": "太郎",   15    "phoneticLastName": null,   16    "phoneticFirstName": null   17  },   18  "i18nNames": [],   19  "nickName": "nickname",   20  "privateEmail": "private.works@example.com",   21  "aliasEmails": [],   22  "employmentTypeId": null,   23  "employmentTypeName": null,   24  "employmentTypeExternalKey": null,   25  "userTypeId": null,   26  "userTypeName": null,   27  "userTypeExternalKey": null,   28  "userTypeCode": null,   29  "searchable": true,   30  "organizations": [   31    {   32      "domainId": 10000001,   33      "primary": true,   34      "userExternalKey": null,   35      "email": "localpart@example.com",   36      "levelId": "levelaa7-b824-4937-66af-042f1f43cefa",   37      "levelExternalKey": null,   38      "levelName": "一般社員",   39      "executive": false,   40      "organizationName": "org",   41      "orgUnits": [   42        {   43          "orgUnitId": "orgunitf-f27f-4af8-27e1-03817a911417",   44          "orgUnitExternalKey": null,   45          "orgUnitEmail": "team01@example.com",   46          "orgUnitName": "組織",   47          "primary": true,   48          "positionId": "position-7027-4a02-b838-6f52b5e38db7",   49          "positionExternalKey": null,   50          "positionName": "社員",   51          "isManager": true,   52          "visible": true,   53          "useTeamFeature": true   54        }   55      ]   56    }   57  ],   58  "telephone": "031-1234-5678",   59  "cellPhone": "090-1234-5678",   60  "location": "green building",   61  "task": "mytask",   62  "messenger": {   63    "protocol": "LINE",   64    "messengerId": "lineid"   65  },   66  "birthdayCalendarType": "SOLAR",   67  "birthday": "2000-01-01",   68  "locale": "ja_JP",   69  "hiredDate": "2020-01-01",   70  "timeZone": "Asia/Tokyo",   71  "leaveOfAbsence": {   72    "startTime": null,   73    "endTime": null,   74    "isLeaveOfAbsence": false   75  },   76  "customProperties": {   77    "string_single": "hiking",   78    "string_multi": [   79      "hiking",   80      "swimming"   81    ],   82    "string_single_option": "option_cooking",   83    "string_multi_option": [   84      "option_cooking",   85      "option_piano"   86    ],   87    "date_single": "2025-03-23",   88    "date_multi": [   89      "2025-03-23",   90      "2025-03-24"   91    ],   92    "integer_single": 123,   93    "integer_multi": [   94      123,   95      456   96    ],   97    "link_single": {   98      "text": "worksmobile",   99      "link": "https://contact.worksmobile.com"   100    },   101    "link_multi": [   102      {   103        "text": "worksmobile",   104        "link": "https://contact.worksmobile.com"   105      },   106      {   107        "text": "line",   108        "link": "https://www.line.me/"   109      }   110    ]   111  },   112  "relations": [   113    {   114      "relationUserId": "userfd-fc09-4a57-ab38-03dc6c425e09",   115      "relationName": "Manager",   116      "externalKey": "ExternalKeyValue"   117    }   118  ],   119  "activationDate": "2030-11-12T09:30:00+09:00",   120  "employeeNumber": "employee1234"   121}`

  

### HTTP 404[](#HTTP-404)

Not Found

*   [GET /users/{userId}](#i-0)
*   [Authorization](#Authorization)
    *   [Scope](#Scope)
*   [Request](#Request)
    *   [HTTP Request](#HTTP-Request)
    *   [Path Parameters](#Path-Parameters)
    *   [Header Parameters](#Header-Parameters)
*   [Response](#Response)
    *   [HTTP 200](#HTTP-200)
        *   [leaveOfAbsence](#leaveOfAbsence)
        *   [userName](#userName)
        *   [UserI18nName](#UserI18nName)
        *   [UserOrganization](#UserOrganization)
        *   [orgUnit](#orgUnit)
        *   [messenger](#messenger)
        *   [UserCustomField](#UserCustomField)
        *   [customProperties](#customProperties)
        *   [CustomPropertyLink](#CustomPropertyLink)
        *   [UserRelation](#UserRelation)
    *   [Response Example](#Response-Example)
    *   [HTTP 404](#HTTP-404)

[

前へ

リスト取得

](/jp/docs/user-list)[

次へ

更新

](/jp/docs/user-update-put)