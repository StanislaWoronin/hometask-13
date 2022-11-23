import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import mongoose from 'mongoose';
import { UsersRepository } from '../users/infrastructure/users.repository';

@Controller('testing')
export class TestingController {
  @Delete('all-data')
  @HttpCode(204)
  async deleteAll() {
    await mongoose.connection.db.dropDatabase();
    return HttpStatus.NO_CONTENT;
  }
}
