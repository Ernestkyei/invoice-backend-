jest.mock('../models/userModel', () => ({
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
}));

const User = require('../models/userModel');
const userService = require('../services/userService');

describe('userService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes the email and creates a default admin user when none exists', async () => {
    const createdUser = {
      _id: 'user-id',
      name: 'Admin',
      email: 'admin@paylink.com',
      password: 'hashed-password',
      createdAt: new Date(),
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(null);
    User.countDocuments.mockResolvedValue(0);
    User.create.mockResolvedValue(createdUser);

    const result = await userService.login(' Admin@PayLink.com ', 'password123');

    expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@paylink.com' });
    expect(User.create).toHaveBeenCalledWith({
      name: 'Admin',
      email: 'admin@paylink.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('admin@paylink.com');
  });
});
