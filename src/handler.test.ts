import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { PublishCommand } from '@aws-sdk/client-sns';
import { createHandler, parseBody, SnsPublisher } from './handler';

function snsStub(sendImpl: SnsPublisher['send']): SnsPublisher {
  return { send: mock.fn(sendImpl) };
}

test('parseBody reads API Gateway string bodies', () => {
  assert.deepEqual(
    parseBody({ body: JSON.stringify({ message: 'hello' }) }),
    { message: 'hello' },
  );
});

test('parseBody reads direct Lambda payloads', () => {
  assert.deepEqual(parseBody({ message: 'direct' }), { message: 'direct' });
});

test('returns 400 when message is missing', async () => {
  const handler = createHandler({
    topicArn: 'arn:aws:sns:us-east-1:123456789012:demo',
    sns: snsStub(async () => ({ MessageId: 'should-not-run' })),
  });

  const result = await handler({ body: '{}' });
  assert.equal(result.statusCode, 400);
  assert.equal(JSON.parse(result.body).error, 'message is required');
});

test('publishes to SNS and returns the message id', async () => {
  const sns = snsStub(async () => ({ MessageId: 'abc-123' }));
  const handler = createHandler({
    topicArn: 'arn:aws:sns:us-east-1:123456789012:demo',
    sns,
  });

  const result = await handler({
    body: JSON.stringify({ message: 'Deploy complete', subject: 'CI' }),
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { ok: true, messageId: 'abc-123' });

  const send = sns.send as ReturnType<typeof mock.fn>;
  assert.equal(send.mock.callCount(), 1);

  const command = send.mock.calls[0].arguments[0] as PublishCommand;
  assert.equal(command.input.Message, 'Deploy complete');
  assert.equal(command.input.Subject, 'CI');
  assert.equal(command.input.TopicArn, 'arn:aws:sns:us-east-1:123456789012:demo');
});

test('returns 502 when SNS publish fails', async () => {
  const handler = createHandler({
    topicArn: 'arn:aws:sns:us-east-1:123456789012:demo',
    sns: snsStub(async () => {
      throw new Error('throttled');
    }),
  });

  const result = await handler({ body: JSON.stringify({ message: 'hello' }) });
  assert.equal(result.statusCode, 502);
});
