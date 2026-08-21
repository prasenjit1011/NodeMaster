import { randomInt } from 'node:crypto';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const SNS_MESSAGE_MAX = 160;
const E164_PHONE = /^\+[1-9]\d{7,14}$/;
const OTP_PATTERN = /^\d{4,8}$/;

export interface OtpPayload {
  phone?: string;
  mobile?: string;
  otp?: string;
  message?: string;
}

export interface LambdaEvent extends OtpPayload {
  body?: string | OtpPayload;
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
}

export function createHandler({ sns }: HandlerDeps = {}) {
  const client = sns ?? new SNSClient({});

  return async function handler(event: LambdaEvent): Promise<LambdaResponse> {
    let payload: OtpPayload;
    try {
      payload = parseBody(event);
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const phone = normalizeIndianPhone(payload.phone ?? payload.mobile);
    if (!phone) {
      return jsonResponse(400, {
        error: 'phone is required in E.164 format, e.g. +919876543210',
      });
    }

    const providedOtp = typeof payload.otp === 'string' ? payload.otp.trim() : '';
    const generated = !providedOtp;
    const otp = providedOtp || String(randomInt(100000, 1000000));

    if (!OTP_PATTERN.test(otp)) {
      return jsonResponse(400, { error: 'otp must be 4-8 digits' });
    }

    const message = typeof payload.message === 'string' && payload.message.trim()
      ? payload.message.trim()
      : `Your NodeMaster OTP is ${otp}. Valid for 5 minutes. Do not share.`;

    if (message.length > SNS_MESSAGE_MAX) {
      return jsonResponse(400, { error: 'message exceeds SMS size limit (160 chars)' });
    }

    try {
      const result = await client.send(new PublishCommand({
        PhoneNumber: phone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      }));

      const body: Record<string, unknown> = {
        ok: true,
        messageId: result.MessageId,
        phone,
      };
      // Return OTP only when the API generated it (caller must verify/store it).
      if (generated) {
        body.otp = otp;
      }

      return jsonResponse(200, body);
    } catch (err) {
      console.error('SNS SMS publish failed:', err);
      return jsonResponse(502, { error: 'Failed to send OTP SMS' });
    }
  };
}

/** Accepts +91…, 91…, or 10-digit Indian mobile and returns E.164. */
export function normalizeIndianPhone(raw: string | undefined): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const digits = raw.replace(/[\s()-]/g, '').replace(/^00/, '+');
  let e164 = digits;

  if (/^\d{10}$/.test(digits)) {
    e164 = `+91${digits}`;
  } else if (/^91\d{10}$/.test(digits)) {
    e164 = `+${digits}`;
  } else if (digits.startsWith('+')) {
    e164 = digits;
  } else {
    return null;
  }

  return E164_PHONE.test(e164) ? e164 : null;
}

export function parseBody(event: LambdaEvent | null | undefined): OtpPayload {
  if (!event || typeof event !== 'object') {
    return {};
  }

  if (typeof event.body === 'string') {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    return raw ? JSON.parse(raw) as OtpPayload : {};
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
