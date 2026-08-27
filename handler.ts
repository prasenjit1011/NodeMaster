import serverless from 'serverless-http';
import { app, ensureMongo } from './app';

const proxy = serverless(app, {
    binary: ['image/jpeg', 'image/png', 'image/webp', 'image/*', 'application/octet-stream'],
});

let mongoInitPromise: Promise<void> | null = null;

async function initializeMongo(): Promise<void> {
    if (!mongoInitPromise) {
        mongoInitPromise = ensureMongo()
            .then(() => {
                console.log('MongoDB connection initialized.');
            })
            .catch((error: unknown) => {
                mongoInitPromise = null;
                console.error('MongoDB initialization failed:', error);
                throw error;
            });
    }

    await mongoInitPromise;
}

interface LambdaContext {
    callbackWaitsForEmptyEventLoop: boolean;
}

interface LambdaEvent {
    requestContext?: unknown;
    rawPath?: string;
    path?: string;
    httpMethod?: string;
}

export async function handler(
    event: LambdaEvent,
    context: LambdaContext
): Promise<unknown> {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        console.log('Lambda request:', {
            requestContext: event?.requestContext,
            rawPath: event?.rawPath,
            path: event?.path,
            httpMethod: event?.httpMethod,
        });

        await initializeMongo();
        return await proxy(event as Parameters<typeof proxy>[0], context as Parameters<typeof proxy>[1]);
    } catch (error) {
        console.error('Lambda handler error:', error);

        const message =
            error instanceof Error ? error.message : 'Unknown error';

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal Server Error',
                error:
                    process.env.NODE_ENV === 'production'
                        ? undefined
                        : message,
            }),
        };
    }
}
