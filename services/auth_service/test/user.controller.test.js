const userController = require('../controller/user.controller');
const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../models/user.model', () => {
    const User = jest.fn();
    User.findOne = jest.fn();
    User.findById = jest.fn();
    User.findByIdAndUpdate = jest.fn();
    return User;
});

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn()
}));

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('user.controller', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, JWT_SECRET: 'secret', JWT_EXPIRATION: '1h' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('register', () => {
        test('returns 400 when required fields are missing', async () => {
            const req = { body: { email: 'a@b.com' } };
            const res = mockRes();

            await userController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 400 when email already exists', async () => {
            const req = { body: { name: 'A', email: 'a@b.com', password: 'pass' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue({ _id: 'u1' });

            await userController.register(req, res);

            expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'a@b.com' });
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 201 when user is created', async () => {
            const req = { body: { name: 'A', email: 'a@b.com', password: 'pass' } };
            const res = mockRes();
            const save = jest.fn().mockResolvedValue(undefined);

            UserModel.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            UserModel.mockImplementation((payload) => ({ ...payload, save }));

            await userController.register(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
            expect(save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('login', () => {
        test('returns 400 when email/password missing', async () => {
            const req = { body: { email: '' } };
            const res = mockRes();

            await userController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 400 when user not found', async () => {
            const req = { body: { email: 'a@b.com', password: 'pass' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue(null);

            await userController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 400 when password is invalid', async () => {
            const req = { body: { email: 'a@b.com', password: 'wrong' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue({ password_hash: 'hashed' });
            bcrypt.compare.mockResolvedValue(false);

            await userController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 500 when JWT secret missing', async () => {
            const req = { body: { email: 'a@b.com', password: 'pass' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue({ _id: 'u1', role: 'customer', password_hash: 'hashed' });
            bcrypt.compare.mockResolvedValue(true);
            delete process.env.JWT_SECRET;

            await userController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        test('returns 200 with token for valid credentials', async () => {
            const req = { body: { email: 'a@b.com', password: 'pass' } };
            const res = mockRes();
            const existingUser = { _id: 'u1', role: 'customer', password_hash: 'hashed' };

            UserModel.findOne.mockResolvedValue(existingUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token123');

            await userController.login(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'u1', role: 'customer' },
                'secret',
                { expiresIn: '1h' }
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('email and password flows', () => {
        test('sendVerificationEmail returns 400 when user not found', async () => {
            const req = { body: { email: 'x@y.com' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue(null);

            await userController.sendVerificationEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('sendVerificationEmail saves OTP and returns 200', async () => {
            const req = { body: { email: 'x@y.com' } };
            const res = mockRes();
            const save = jest.fn().mockResolvedValue(undefined);
            const existingUser = { save };
            UserModel.findOne.mockResolvedValue(existingUser);

            await userController.sendVerificationEmail(req, res);

            expect(existingUser.otp).toBeDefined();
            expect(existingUser.otp_expiry).toBeDefined();
            expect(save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('verifyEmail returns 400 when OTP invalid', async () => {
            const req = { body: { email: 'x@y.com', otp: '123456' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue({ otp: '000000', otp_expiry: Date.now() + 5000 });

            await userController.verifyEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('verifyEmail returns 200 for valid OTP', async () => {
            const req = { body: { email: 'x@y.com', otp: '123456' } };
            const res = mockRes();
            const save = jest.fn().mockResolvedValue(undefined);
            const existingUser = {
                otp: '123456',
                otp_expiry: Date.now() + 5000,
                save
            };
            UserModel.findOne.mockResolvedValue(existingUser);

            await userController.verifyEmail(req, res);

            expect(existingUser.is_verified).toBe(true);
            expect(save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('requestPasswordReset returns 400 when user missing', async () => {
            const req = { body: { email: 'x@y.com' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue(null);

            await userController.requestPasswordReset(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('requestPasswordReset sets otp and returns 200', async () => {
            const req = { body: { email: 'x@y.com' } };
            const res = mockRes();
            const save = jest.fn().mockResolvedValue(undefined);
            const existingUser = { save };
            UserModel.findOne.mockResolvedValue(existingUser);

            await userController.requestPasswordReset(req, res);

            expect(existingUser.otp).toBeDefined();
            expect(save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('resetPassword returns 400 when user missing', async () => {
            const req = { body: { email: 'x@y.com', otp: '1', newPassword: 'new' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue(null);

            await userController.resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('resetPassword returns 400 when otp invalid', async () => {
            const req = { body: { email: 'x@y.com', otp: '1', newPassword: 'new' } };
            const res = mockRes();
            UserModel.findOne.mockResolvedValue({ otp: '2', otp_expiry: Date.now() + 5000 });

            await userController.resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('resetPassword updates hash and returns 200', async () => {
            const req = { body: { email: 'x@y.com', otp: '1', newPassword: 'new' } };
            const res = mockRes();
            const save = jest.fn().mockResolvedValue(undefined);
            const existingUser = { otp: '1', otp_expiry: Date.now() + 5000, save };

            UserModel.findOne.mockResolvedValue(existingUser);
            bcrypt.hash.mockResolvedValue('hashed-new');

            await userController.resetPassword(req, res);

            expect(existingUser.password_hash).toBe('hashed-new');
            expect(save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('profile methods', () => {
        test('getProfile returns 404 when user does not exist', async () => {
            const req = { user: { userId: 'u1' } };
            const res = mockRes();
            UserModel.findById.mockResolvedValue(null);

            await userController.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('getProfile returns 200 with user data', async () => {
            const req = { user: { userId: 'u1' } };
            const res = mockRes();
            UserModel.findById.mockResolvedValue({ _id: 'u1', name: 'U' });

            await userController.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('updateProfile returns 404 when user does not exist', async () => {
            const req = { user: { userId: 'u1' }, body: { name: 'N' } };
            const res = mockRes();
            UserModel.findById.mockResolvedValue(null);

            await userController.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('updateProfile updates name and returns 200', async () => {
            const req = { user: { userId: 'u1' }, body: { name: 'New Name' } };
            const res = mockRes();
            const save = jest.fn().mockResolvedValue(undefined);
            const existingUser = { _id: 'u1', name: 'Old', save };
            UserModel.findById.mockResolvedValue(existingUser);

            await userController.updateProfile(req, res);

            expect(existingUser.name).toBe('New Name');
            expect(save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('deleteProfile returns 404 when user does not exist', async () => {
            const req = { user: { userId: 'u1' } };
            const res = mockRes();
            UserModel.findById.mockResolvedValue(null);

            await userController.deleteProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('deleteProfile deactivates profile and returns 200', async () => {
            const req = { user: { userId: 'u1' } };
            const res = mockRes();
            UserModel.findById.mockResolvedValue({ _id: 'u1' });
            UserModel.findByIdAndUpdate.mockResolvedValue({ _id: 'u1', is_verified: false });

            await userController.deleteProfile(req, res);

            expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', { $set: { is_verified: false } });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
