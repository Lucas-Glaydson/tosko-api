import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google-token') {
  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Autenticação Google inválida');
    }
    return user;
  }

  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}
