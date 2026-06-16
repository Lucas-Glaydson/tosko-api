import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { USER_REPOSITORY_PORT } from '../domain/ports/outbound/user-repository.port';
import { UserEntity } from '../domain/entities/user.entity';

const makeUser = (): UserEntity =>
  new UserEntity(
    'user-id-1',
    'joao@gmail.com',
    'João Silva',
    '$2b$10$hashedpassword',
    new Date('2026-01-01'),
    new Date('2026-06-11'),
  );

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
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

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent-id')).rejects.toThrow('Usuário não encontrado');
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

