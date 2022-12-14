import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { settings } from '../settings';

@Injectable()
export class AuthBasicGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const base64 = Buffer.from(
      `${settings.BASIC_USER}:${settings.BASIC_PASS}`,
    ).toString('base64');
    const validAuthHeader = `Basic ${base64}`;

    if (authHeader !== validAuthHeader) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
