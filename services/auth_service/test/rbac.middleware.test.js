const { rbac } = require('../middleware/rbac.middleware');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('rbac.middleware', () => {
    test('calls next when role is allowed', () => {
        const req = { user: { role: 'admin' } };
        const res = mockRes();
        const next = jest.fn();

        const middleware = rbac(['admin', 'customer']);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('returns 403 when role is not allowed', () => {
        const req = { user: { role: 'guest' } };
        const res = mockRes();
        const next = jest.fn();

        const middleware = rbac(['admin', 'customer']);
        middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
