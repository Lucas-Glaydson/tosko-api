import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { USER_REPOSITORY_PORT } from '../domain/ports/outbound/user-repository.port';
import { UserEntity } from '../domain/entities/user.entity';

const makeUser = (overrides: Partial<ConstructorParameters<typeof UserEntity>[0]> = {}) =>
  new UserEntity(
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

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findByGoogleSub: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY_PORT, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findOrCreate', () => {
    const input = {
      googleSub: 'google-sub-123',
      email: 'joao@gmail.com',
      givenName: 'João',
      familyName: 'Silva',
    };

    it('deve retornar usuário existente com lastLogin atualizado', async () => {
      const existingUser = makeUser();
      const updatedUser = makeUser();
      mockUserRepository.findByGoogleSub.mockResolvedValue(existingUser);
      mockUserRepository.updateLastLogin.mockResolvedValue(updatedUser);

      const result = await service.findOrCreate(input);

      expect(mockUserRepository.findByGoogleSub).toHaveBeenCalledWith(input.googleSub);
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(existingUser.id);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(result).toBe(updatedUser);
    });

    it('deve criar novo usuário quando googleSub não existe', async () => {
      const newUser = makeUser();
      mockUserRepository.findByGoogleSub.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser);

      const result = await service.findOrCreate(input);

      expect(mockUserRepository.findByGoogleSub).toHaveBeenCalledWith(input.googleSub);
      expect(mockUserRepository.create).toHaveBeenCalledWith(input);
      expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
      expect(result).toBe(newUser);
    });
  });

  describe('findById', () => {
    it('deve retornar o usuário quando encontrado', async () => {
      const user = makeUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await service.findById('user-id-1');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id-1');
      expect(result).toBe(user);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        'Usuário não encontrado',
      );
    });
  });

  describe('softDelete', () => {
    it('deve chamar softDelete no repositório', async () => {
      mockUserRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete('user-id-1');

      expect(mockUserRepository.softDelete).toHaveBeenCalledWith('user-id-1');
    });
  });
});
