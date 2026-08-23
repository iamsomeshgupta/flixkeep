const User = require('../models/User');

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id, selectFields = '') {
    return await User.findById(id).select(selectFields);
  }

  async findOne(query, selectFields = '') {
    return await User.findOne(query).select(selectFields);
  }

  async findByEmail(email, selectFields = '') {
    return await User.findOne({ email }).select(selectFields);
  }

  async findByUsername(username, selectFields = '') {
    return await User.findOne({ username }).select(selectFields);
  }

  async findByGoogleId(googleId) {
    return await User.findOne({ googleId });
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  // Admin capabilities
  async findAll({ page = 1, limit = 10, search = '' }) {
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await User.countDocuments(query);
    
    return { users, total, page, pages: Math.ceil(total / limit) };
  }
}

module.exports = new UserRepository();
