declare module 'sib-api-v3-sdk' {
  const ApiClient: {
    instance: {
      authentications: {
        'api-key': { apiKey: string }
      }
    }
  }

  class TransactionalSMSApi {
    sendTransacSms(sms: SendTransacSms): Promise<{ messageId: string }>
  }

  class SendTransacSms {
    sender: string
    recipient: string
    content: string
    type: string
    unicodeEnabled: boolean
  }

  export { ApiClient, TransactionalSMSApi, SendTransacSms }
  export default { ApiClient, TransactionalSMSApi, SendTransacSms }
}
