import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as iam from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'
import * as path from 'path'

export class LwReserveAssistantStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // === DynamoDB: 外部メンバーテーブル（既存） ===
    const membersTableArn = 'arn:aws:dynamodb:ap-northeast-1:386850311872:table/GetAllLineWorksUsersTable'
    const membersTableName = 'GetAllLineWorksUsersTable'

    // === DynamoDB: 予約テーブル ===
    const reservationsTable = new dynamodb.Table(this, 'ReservationsTable', {
      tableName: 'lw-reserve-reservations',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // === Secrets Manager: 既存のシークレットを参照 ===
    const secrets = secretsmanager.Secret.fromSecretNameV2(
      this, 'LwSecrets', 'lw-reserve-assistant/secrets'
    )

    // === Lambda Function ===
    const fn = new lambda.Function(this, 'AppFunction', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist'), {
        exclude: ['*.map'],
      }),
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        WOFF_ID: '',  // デプロイ後に手動設定 or cdk.json の context で注入
        LW_SECRETS_ARN: secrets.secretArn,
        DYNAMO_TABLE_MEMBERS: membersTableName,
        DYNAMO_TABLE_RESERVATIONS: reservationsTable.tableName,
      },
    })

    // 予約テーブルへのアクセス権限
    reservationsTable.grantReadWriteData(fn)

    // 外部メンバーテーブルへの読み取り権限
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Scan', 'dynamodb:GetItem', 'dynamodb:Query'],
        resources: [membersTableArn],
      })
    )

    // Secrets Manager 読み取り権限
    secrets.grantRead(fn)

    // === Lambda Function URL ===
    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    })

    // === Outputs ===
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: fnUrl.url,
      description: 'Lambda Function URL',
    })

    new cdk.CfnOutput(this, 'ReservationsTableName', {
      value: reservationsTable.tableName,
    })
  }
}
