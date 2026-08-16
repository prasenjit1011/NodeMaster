import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const SNS_SUBJECT_MAX = 100;
const SNS_MESSAGE_MAX = 256 * 1024;

export interface NotifyPayload {
  message?: string;
  subject?: string;
}

export interface LambdaEvent extends NotifyPayload {
  body?: string | NotifyPayload;
  isBase64Encoded?: boolean;
}

export interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface SnsPublisher {
  send(command: PublishCommand): Promise<{ MessageId?: string }>;
}

export interface HandlerDeps {
  sns?: SnsPublisher;
  topicArn?: string;
}

export function createHandler({ sns, topicArn }: HandlerDeps = {}) {
  const client = sns ?? new SNSClient({});

  return async function handler(event: LambdaEvent): Promise<LambdaResponse> {
    const topic = topicArn ?? process.env.SNS_TOPIC_ARN;
    if (!topic) {
      return jsonResponse(500, { error: 'SNS_TOPIC_ARN is not configured' });
    }

    let payload: NotifyPayload;
    try {
      payload = parseBody(event);
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    const subject = typeof payload.subject === 'string' && payload.subject.trim()
      ? payload.subject.trim()
      : 'NodeMaster notification';

    if (!message) {
      return jsonResponse(400, { error: 'message is required' });
    }

    if (message.length > SNS_MESSAGE_MAX) {
      return jsonResponse(400, { error: 'message exceeds SNS size limit' });
    }

    try {
      const result = await client.send(new PublishCommand({
        TopicArn: topic,
        Subject: subject.slice(0, SNS_SUBJECT_MAX),
        Message: message,
      }));

      return jsonResponse(200, {
        ok: true,
        messageId: result.MessageId,
      });
    } catch (err) {
      console.error('SNS publish failed:', err);
      return jsonResponse(502, { error: 'Failed to publish to SNS' });
    }
  };
}

export function parseBody(event: LambdaEvent | null | undefined): NotifyPayload {
  if (!event || typeof event !== 'object') {
    return {};
  }

  if (typeof event.body === 'string') {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    return raw ? JSON.parse(raw) as NotifyPayload : {};
  }

  if (event.body && typeof event.body === 'object') {
    return event.body;
  }

  return event;
}

function jsonResponse(statusCode: number, body: Record<string, unknown>): LambdaResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const handler = createHandler();
