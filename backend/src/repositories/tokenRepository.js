const Token = require('../models/Token');

class TokenRepository {
  async create(tokenData) {
    const token = new Token(tokenData);
    return await token.save();
  }

  async findByToken(token) {
    return await Token.findOne({ token });
  }

  async deleteByToken(token) {
    return await Token.findOneAndDelete({ token });
  }

  async deleteByUserId(userId) {
    return await Token.deleteMany({ userId });
  }

  async deleteExpiredTokens() {
    // Standard MongoDB TTL handles this, but a manual repository clean is a good fallback
    return await Token.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

module.exports = new TokenRepository();
