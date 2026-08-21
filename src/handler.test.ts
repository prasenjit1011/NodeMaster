import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { PublishCommand } from '@aws-sdk/client-sns';
import { createHandler, normalizeIndianPhone, parseBody, SnsPublisher } from './handler';

function snsStub(sendImpl: SnsPublisher['send']): SnsPublisher {
  return { send: mock.fn(sendImpl) };
}

test('parseBody reads API Gateway string bodies', () => {
  assert.deepEqual(
    parseBody({ body: JSON.stringify({ phone: '+919876543210', otp: '123456' }) }),
    { phone: '+919876543210', otp: '123456' },
  );
});

test('normalizeIndianPhone accepts local and E.164 forms', () => {
  assert.equal(normalizeIndianPhone('9876543210'), '+919876543210');
  assert.equal(normalizeIndianPhone('919876543210'), '+919876543210');
  assert.equal(normalizeIndianPhone('+919876543210'), '+919876543210');
  assert.equal(normalizeIndianPhone('bad'), null);
});

test('returns 400 when phone is missing', async () => {
  const handler = createHandler({
    sns: snsStub(async () => ({ MessageId: 'should-not-run' })),
  });

  const result = await handler({ body: JSON.stringify({ otp: '123456' }) });
  assert.equal(result.statusCode, 400);
  assert.match(JSON.parse(result.body).error, /phone is required/);
});

test('sends OTP SMS to phone from API param', async () => {
  const sns = snsStub(async () => ({ MessageId: 'abc-123' }));
  const handler = createHandler({ sns });

  const result = await handler({
    body: JSON.stringify({ phone: '9876543210', otp: '482910' }),
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), {
    ok: true,
    messageId: 'abc-123',
    phone: '+919876543210',
  });

  const send = sns.send as ReturnType<typeof mock.fn>;
  const command = send.mock.calls[0].arguments[0] as PublishCommand;
  assert.equal(command.input.PhoneNumber, '+919876543210');
  assert.match(command.input.Message ?? '', /482910/);
  assert.equal(command.input.TopicArn, undefined);
  assert.equal(
    command.input.MessageAttributes?.['AWS.SNS.SMS.SMSType']?.StringValue,
    'Transactional',
  );
});

test('generates OTP when not provided', async () => {
  const sns = snsStub(async () => ({ MessageId: 'gen-1' }));
  const handler = createHandler({ sns });

  const result = await handler({
    body: JSON.stringify({ mobile: '+919876543210' }),
  });

  assert.equal(result.statusCode, 200);
  const body = JSON.parse(result.body);
  assert.equal(body.ok, true);
  assert.match(body.otp, /^\d{6}$/);
});

test('returns 502 when SNS publish fails', async () => {
  const handler = createHandler({
    sns: snsStub(async () => {
      throw new Error('throttled');
    }),
  });

  const result = await handler({
    body: JSON.stringify({ phone: '+919876543210', otp: '111111' }),
  });
  assert.equal(result.statusCode, 502);
});
