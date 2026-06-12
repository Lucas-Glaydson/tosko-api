import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GOOGLE_TOKEN_VERIFIER_PORT } from '../domain/ports/outbound/google-token-verifier.port';
import { JWT_GENERATOR_PORT } from '../domain/ports/outbound/jwt-generator.port';
import { USERS_USE_CASE_PORT } from '../../users/domain/ports/inbound/users-use-case.port';
import { UserEntity } from '../../users/domain/entities/user.entity';
import { GoogleUserEntity } from '../domain/entities/google-user.entity';

const mockGoogleUser = new GoogleUserEntity(
  'google-sub-123',
  'joao@gmail.com',
  'João',
  'Silva',
  'https://photo.url',
  'pt-BR',
);

const mockUser = new UserEntity(
  'user-id-1',
  'google-sub-123',
  'joao@gmail.com',
  'João',
  'Silva',
  'https://photo.url',
  'pt-BR',
  new Date('2026-01-01'),
  new Date('2026-06-01'),
  new Date('2026-06-11'),
);

describe('AuthService', () => {
  let service: AuthService;

  const mockGoogleTokenVerifier = {
    verify: jest.fn(),
  };

  const mockJwtGenerator = {
    generate: jest.fn(),
    verify: jest.fn(),
  };

  const mockUsersUseCase = {
    findOrCreate: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: GOOGLE_TOKEN_VERIFIER_PORT, useValue: mockGoogleTokenVerifier },
        { provide: JWT_GENERATOR_PORT, useValue: mockJwtGenerator },
        { provide: USERS_USE_CASE_PORT, useValue: mockUsersUseCase },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('googleLogin', () => {
    it('deve retornar accessToken e user após login bem-sucedido', async () => {
      mockGoogleTokenVerifier.verify.mockResolvedValue(mockGoogleUser);
      mockUsersUseCase.findOrCreate.mockResolvedValue(mockUser);
      mockJwtGenerator.generate.mockReturnValue('jwt-token-abc');

      const result = await service.googleLogin('valid-id-token');

      expect(mockGoogleTokenVerifier.verify).toHaveBeenCalledWith('valid-id-token');
      expect(mockUsersUseCase.findOrCreate).toHaveBeenCalledWith({
        googleSub: mockGoogleUser.googleSub,
        email: mockGoogleUser.email,
        givenName: mockGoogleUser.givenName,
        familyName: mockGoogleUser.familyName,
        picture: mockGoogleUser.picture,
        locale: mockGoogleUser.locale,
      });
      expect(mockJwtGenerator.generate).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ accessToken: 'jwt-token-abc', user: mockUser });
    });

    it('deve propagar UnauthorizedException quando o token Google é inválido', async () => {
      mockGoogleTokenVerifier.verify.mockRejectedValue(
        new UnauthorizedException('Falha na validação do token Google'),
      );

      await expect(service.googleLogin('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersUseCase.findOrCreate).not.toHaveBeenCalled();
      expect(mockJwtGenerator.generate).not.toHaveBeenCalled();
    });

    it('deve criar novo usuário quando ainda não existe', async () => {
      const newUser = new UserEntity(
        'new-user-id',
        'new-google-sub',
        'novo@gmail.com',
        'Novo',
        'Usuario',
        undefined,
        undefined,
        new Date(),
        new Date(),
        new Date(),
      );
      mockGoogleTokenVerifier.verify.mockResolvedValue(mockGoogleUser);
      mockUsersUseCase.findOrCreate.mockResolvedValue(newUser);
      mockJwtGenerator.generate.mockReturnValue('new-jwt-token');

      const result = await service.googleLogin('valid-id-token');

      expect(result.accessToken).toBe('new-jwt-token');
      expect(result.user).toBe(newUser);
    });
  });
});
