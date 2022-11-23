import { TokenBlackListScheme } from './entity/tokenBlackList.scheme';

export class JwtRepository {
  async addTokenInBlackList(refreshToken: string) {
    return TokenBlackListScheme.create({ refreshToken });
  }

  async giveToken(refreshToken: string) {
    return TokenBlackListScheme.findOne({ refreshToken });
  }
}
