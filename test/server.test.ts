/// <reference types="jest" />
const connectDBMock = jest.fn();

const listenMock = jest.fn(
    (port: number, host: string, cb: () => void) => cb()
);

jest.mock("../src/config/db", () => ({
    connectDB: connectDBMock,
}));

jest.mock("../src/app", () => ({
    __esModule: true,
    default: {
        listen: listenMock,
    },
}));

describe("server.ts bootstrap", () => {
    let consoleSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        jest.resetModules();

        connectDBMock.mockClear();
        listenMock.mockClear();

        consoleSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it("should call connectDB and start server", async () => {
        await import("../src/server");

        expect(connectDBMock).toHaveBeenCalledTimes(1);
    });

    it("should start listening on port 3000", async () => {
        await import("../src/server");

        expect(listenMock).toHaveBeenCalledWith(
            3000,
            "0.0.0.0",
            expect.any(Function)
        );
    });

    it("should log server start message", async () => {
        await import("../src/server");

        expect(consoleSpy).toHaveBeenCalledWith(
            "Server running on port 3000"
        );
    });
});