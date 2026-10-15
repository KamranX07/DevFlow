
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";

// Mock Prisma before importing the Express app.
const prismaMock = {
    user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    $queryRaw: jest.fn(),
};

jest.unstable_mockModule("../src/config/db.js", () => ({
    default: prismaMock,
}));

jest.unstable_mockModule("../src/utils/jwt.js", () => ({
    generateToken: jest.fn(() => "test-jwt-token"),
    verifyToken: jest.fn(() => ({ userId: 1 })),
}));

// Import only after registering the ES-module mocks.
const { default: app } = await import("../src/app.js");

const testUser = {
    id: 1,
    username: "kamran_dev",
    email: "kamran@example.com",
    profilePictureUrl: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

let storedUser;

beforeEach(async () => {
    jest.clearAllMocks();

    storedUser = {
        ...testUser,
        passwordHash: await bcrypt.hash("Password123", 4),
    };

    prismaMock.user.findFirst.mockImplementation(async ({ where }) => {
        const matchesUsername = where.OR.some(
            (condition) =>
                condition.username === storedUser.username
        );

        const matchesEmail = where.OR.some(
            (condition) =>
                condition.email === storedUser.email
        );

        return matchesUsername || matchesEmail
            ? storedUser
            : null;
    });

    prismaMock.user.findUnique.mockImplementation(async ({ where }) => {
        if (where.email === storedUser.email) {
            return storedUser;
        }

        if (where.id === storedUser.id) {
            return testUser;
        }

        return null;
    });

    prismaMock.user.create.mockImplementation(async ({ data }) => ({
        ...testUser,
        username: data.username,
        email: data.email,
    }));
});

describe("DevFlow authentication API", () => {
    test("registers a new user", async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                username: "new_developer",
                email: "new@example.com",
                password: "Password123",
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe("new@example.com");
        expect(response.body.user.passwordHash).toBeUndefined();
        expect(response.headers["set-cookie"]).toBeDefined();
        expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    });

    test("rejects registration with invalid input", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                username: "ab",
                email: "not-an-email",
                password: "123",
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    test("rejects an already registered username", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                username: "kamran_dev",
                email: "different@example.com",
                password: "Password123",
            });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    test("logs in with valid credentials", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "kamran@example.com",
                password: "Password123",
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe("kamran@example.com");
        expect(response.headers["set-cookie"]).toBeDefined();
    });

    test("rejects an incorrect password", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "kamran@example.com",
                password: "WrongPassword123",
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            "Invalid email or password"
        );
    });

    test("blocks access to /me without a cookie", async () => {
        const response = await request(app)
            .get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test("returns the authenticated user from /me", async () => {
        const response = await request(app)
            .get("/api/auth/me")
            .set("Cookie", "devflow_token=test-jwt-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.id).toBe(1);
        expect(response.body.user.email).toBe("kamran@example.com");
    });

    test("logs out and clears the authentication cookie", async () => {
        const response = await request(app)
            .post("/api/auth/logout");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.headers["set-cookie"]).toBeDefined();
        expect(response.headers["set-cookie"].join(";")).toContain(
            "devflow_token="
        );
    });
});
