import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { GoogleTokenStrategy } from './google-token.strategy';
import { GOOGLE_TOKEN_VERIFIER_PORT } from '../../../domain/ports/outbound/google-token-verifier.port';
import { GoogleUserEntity } from '../../../domain/entities/google-user.entity';
import type { Request } from 'express';

const mockGoogleUser = new GoogleUserEntity(
  'google-sub-123',
  'joao@gmail.com',
  'João',
  'Silva',
  undefined,
  'pt-BR',
);

const makeRequest = (authHeader?: string): Partial<Request> => ({
  headers: authHeader ? { authorization: authHeader } : {},
});

describe('GoogleTokenStrategy', () => {
  let strategy: GoogleTokenStrategy;

  const mockGoogleTokenVerifier = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleTokenStrategy,
        { provide: GOOGLE_TOKEN_VERIFIER_PORT, useValue: mockGoogleTokenVerifier },
      ],
    }).compile();

    strategy = module.get<GoogleTokenStrategy>(GoogleTokenStrategy);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('deve retornar GoogleUserEntity com token Bearer válido', async () => {
      mockGoogleTokenVerifier.verify.mockResolvedValue(mockGoogleUser);

      const result = await strategy.validate(
        makeRequest('Bearer valid-google-id-token') as Request,
      );

      expect(mockGoogleTokenVerifier.verify).toHaveBeenCalledWith('valid-google-id-token');
      expect(result).toBe(mockGoogleUser);
    });

    it('deve lançar UnauthorizedException quando Authorization header está ausente', async () => {
      await expect(
        strategy.validate(makeRequest() as Request),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        strategy.validate(makeRequest() as Request),
      ).rejects.toThrow('Token não fornecido');

      expect(mockGoogleTokenVerifier.verify).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando header não começa com Bearer', async () => {
      await expect(
        strategy.validate(makeRequest('Basic some-token') as Request),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockGoogleTokenVerifier.verify).not.toHaveBeenCalled();
    });

    it('deve propagar UnauthorizedException quando token Google é expirado/inválido', async () => {
      mockGoogleTokenVerifier.verify.mockRejectedValue(
        new UnauthorizedException('Falha na validação do token Google'),
      );

      await expect(
        strategy.validate(makeRequest('Bearer expired-token') as Request),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockGoogleTokenVerifier.verify).toHaveBeenCalledWith('expired-token');
    });

    it('deve propagar UnauthorizedException quando audience é inválida', async () => {
      mockGoogleTokenVerifier.verify.mockRejectedValue(
        new UnauthorizedException('Falha na validação do token Google'),
      );

      await expect(
        strategy.validate(makeRequest('Bearer wrong-audience-token') as Request),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
