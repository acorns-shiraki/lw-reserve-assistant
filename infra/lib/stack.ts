import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'
import * as path from 'path'

export class LwReserveAssistantStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // === DynamoDB: メンバーテーブル ===
    const membersTable = new dynamodb.Table(this, 'MembersTable', {
      tableName: 'lw-reserve-members',
      partitionKey: { name: 'domainId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // === DynamoDB: 予約テーブル ===
    const reservationsTable = new dynamodb.Table(this, 'ReservationsTable', {
      tableName: 'lw-reserve-reservations',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // === Secrets Manager: LINE WORKS 秘密鍵 ===
    const privateKeySecret = new secretsmanager.Secret(this, 'LwPrivateKey', {
      secretName: 'lw-reserve-assistant/private-key',
      description: 'LINE WORKS Service Account RSA Private Key (BASE64)',
    })

    // === Lambda Function ===
    const fn = new lambda.Function(this, 'AppFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist'), {
        exclude: ['*.map'],
      }),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        WOFF_ID: '',              // デプロイ後に手動設定 or cdk.json の context で注入
        LW_CLIENT_ID: '',
        LW_CLIENT_SECRET: '',
        LW_SERVICE_ACCOUNT_ID: '',
        LW_DOMAIN_ID: '',
        LW_PRIVATE_KEY_BASE64: '',  // Secrets Manager から取得するよう後日変更
        DYNAMO_TABLE_MEMBERS: membersTable.tableName,
        DYNAMO_TABLE_RESERVATIONS: reservationsTable.tableName,
      },
    })

    // DynamoDB アクセス権限
    membersTable.grantReadWriteData(fn)
    reservationsTable.grantReadWriteData(fn)

    // Secrets Manager 読み取り権限
    privateKeySecret.grantRead(fn)

    // === Lambda Function URL ===
    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    })

    // === Outputs ===
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: fnUrl.url,
      description: 'Lambda Function URL',
    })

    new cdk.CfnOutput(this, 'MembersTableName', {
      value: membersTable.tableName,
    })

    new cdk.CfnOutput(this, 'ReservationsTableName', {
      value: reservationsTable.tableName,
    })

    new cdk.CfnOutput(this, 'PrivateKeySecretArn', {
      value: privateKeySecret.secretArn,
    })
  }
}
