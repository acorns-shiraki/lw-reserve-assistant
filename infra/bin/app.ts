#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { LwReserveAssistantStack } from '../lib/stack'

const app = new cdk.App()

new LwReserveAssistantStack(app, 'LwReserveAssistantStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
  },
})
