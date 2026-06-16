import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JWT_GENERATOR_PORT } from '../domain/ports/outbound/jwt-generator.port';
import { USER_REPOSITORY_PORT } from '../../users/domain/ports/outbound/user-repository.port';
import { UserEntity } from '../../users/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const makeUser = (overrides: Partial<{
  id: string; email: string; name: string; passwordHash: string;
}> = {}): UserEntity =>
  new UserEntity(
    overrides.id ?? 'user-id-1',
    overrides.email ?? 'joao@gmail.com',
    overrides.name ?? 'João Silva',
    overrides.passwordHash ?? '$2b$10$hashedpassword',
    new Date('2026-01-01'),
    new Date('2026-06-11'),
  );

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockJwtGenerator = {
    generate: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY_PORT, useValue: mockUserRepository },
        { provide: JWT_GENERATOR_PORT, useValue: mockJwtGenerator },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const input = { email: 'joao@gmail.com', name: 'João Silva', password: 'secret123' };

    it('deve registrar novo usuário e retornar accessToken', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpw');
      const user = makeUser({ passwordHash: '$2b$10$hashedpw' });
      mockUserRepository.create.mockResolvedValue(user);
      mockJwtGenerator.generate.mockReturnValue('jwt-token');

      const result = await service.register(input);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(input.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash: '$2b$10$hashedpw',
      });
      expect(result.accessToken).toBe('jwt-token');
      expect((result.user as UserEntity & { passwordHash?: string }).passwordHash).toBeUndefined();
    });

    it('deve lançar ConflictException quando e-mail já existe', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());

      await expect(service.register(input)).rejects.toThrow(ConflictException);
      await expect(service.register(input)).rejects.toThrow('E-mail já cadastrado');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const input = { email: 'joao@gmail.com', password: 'secret123' };

    it('deve retornar accessToken com credenciais válidas', async () => {
      const user = makeUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtGenerator.generate.mockReturnValue('jwt-token');

      const result = await service.login(input);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(input.password, user.passwordHash);
      expect(result.accessToken).toBe('jwt-token');
      expect((result.user as UserEntity & { passwordHash?: string }).passwordHash).toBeUndefined();
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(input)).rejects.toThrow('Credenciais inválidas');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando senha está incorreta', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(input)).rejects.toThrow('Credenciais inválidas');
    });
  });
});
