const request = require('supertest');
const express = require('express');

const buildApp = () => {
    const app = express();
    app.use(express.json());
    const router = require('../routes/user.route');
    app.use('/api/v1', router);
    return app;
};

jest.mock('../controller/user.controller', () => ({
    register: jest.fn((req, res) => res.status(201).json({ endpoint: 'register' })),
    login: jest.fn((req, res) => res.status(200).json({ endpoint: 'login' })),
    sendVerificationEmail: jest.fn((req, res) => res.status(200).json({ endpoint: 'send-verification-email' })),
    verifyEmail: jest.fn((req, res) => res.status(200).json({ endpoint: 'verify-email' })),
    requestPasswordReset: jest.fn((req, res) => res.status(200).json({ endpoint: 'request-reset-password' })),
    resetPassword: jest.fn((req, res) => res.status(200).json({ endpoint: 'reset-password' })),
    getProfile: jest.fn((req, res) => res.status(200).json({ endpoint: 'profile-get' })),
    updateProfile: jest.fn((req, res) => res.status(200).json({ endpoint: 'profile-put' })),
    deleteProfile: jest.fn((req, res) => res.status(200).json({ endpoint: 'profile-deactivate' }))
}));

jest.mock('../middleware/auth.middleware', () => jest.fn((req, res, next) => {
    req.user = { userId: 'u1', role: 'customer' };
    next();
}));

jest.mock('../middleware/rbac.middleware', () => ({
    rbac: jest.fn(() => (req, res, next) => next())
}));

describe('user.route', () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        app = buildApp();
    });

    test('POST /register is mapped', async () => {
        const res = await request(app).post('/api/v1/register').send({});
        expect(res.status).toBe(201);
        expect(res.body.endpoint).toBe('register');
    });

    test('POST /login is mapped', async () => {
        const res = await request(app).post('/api/v1/login').send({});
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('login');
    });

    test('POST /send-verification-email is mapped', async () => {
        const res = await request(app).post('/api/v1/send-verification-email').send({});
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('send-verification-email');
    });

    test('POST /verify-email is mapped', async () => {
        const res = await request(app).post('/api/v1/verify-email').send({});
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('verify-email');
    });

    test('GET /request-reset-password is mapped', async () => {
        const res = await request(app).get('/api/v1/request-reset-password');
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('request-reset-password');
    });

    test('POST /reset-password is mapped', async () => {
        const res = await request(app).post('/api/v1/reset-password').send({});
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('reset-password');
    });

    test('GET /profile is protected and mapped', async () => {
        const res = await request(app).get('/api/v1/profile');
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('profile-get');
    });

    test('PUT /profile is protected and mapped', async () => {
        const res = await request(app).put('/api/v1/profile').send({});
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('profile-put');
    });

    test('PUT /profile-deactivate is protected and mapped', async () => {
        const res = await request(app).put('/api/v1/profile-deactivate').send({});
        expect(res.status).toBe(200);
        expect(res.body.endpoint).toBe('profile-deactivate');
    });
});
