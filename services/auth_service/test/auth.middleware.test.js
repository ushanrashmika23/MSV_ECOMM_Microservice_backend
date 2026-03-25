const auth = require('../middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

jest.mock('../models/user.model', () => ({
    findById: jest.fn()
}));

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('auth.middleware', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, JWT_SECRET: 'secret' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('returns 401 when token is missing', async () => {
        const req = { header: jest.fn().mockReturnValue(undefined) };
        const res = mockRes();
        const next = jest.fn();

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 500 when JWT secret is missing', async () => {
        delete process.env.JWT_SECRET;
        const req = { header: jest.fn().mockReturnValue('Bearer token') };
        const res = mockRes();
        const next = jest.fn();

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 400 when token verification fails', async () => {
        const req = { header: jest.fn().mockReturnValue('Bearer invalid') };
        const res = mockRes();
        const next = jest.fn();
        jwt.verify.mockImplementation(() => {
            throw new Error('invalid');
        });

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when decoded user does not exist', async () => {
        const req = { header: jest.fn().mockReturnValue('Bearer token') };
        const res = mockRes();
        const next = jest.fn();

        jwt.verify.mockReturnValue({ userId: 'u1' });
        User.findById.mockResolvedValue(null);

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when user is not verified', async () => {
        const req = { header: jest.fn().mockReturnValue('Bearer token') };
        const res = mockRes();
        const next = jest.fn();

        jwt.verify.mockReturnValue({ userId: 'u1' });
        User.findById.mockResolvedValue({ _id: 'u1', is_verified: false, role: 'customer' });

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('sets req.user and calls next for valid token', async () => {
        const req = { header: jest.fn().mockReturnValue('Bearer token') };
        const res = mockRes();
        const next = jest.fn();

        jwt.verify.mockReturnValue({ userId: 'u1' });
        User.findById.mockResolvedValue({ _id: 'u1', is_verified: true, role: 'admin' });

        await auth(req, res, next);

        expect(req.user).toEqual({ userId: 'u1', role: 'admin' });
        expect(next).toHaveBeenCalledTimes(1);
    });
});
