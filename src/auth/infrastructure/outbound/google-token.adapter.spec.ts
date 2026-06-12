import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleTokenAdapter } from './google-token.adapter';
import { OAuth2Client } from 'google-auth-library';

jest.mock('google-auth-library');

const MockedOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

const validPayload = {
  sub: 'google-sub-123',
  email: 'joao@gmail.com',
  given_name: 'João',
  family_name: 'Silva',
  picture: 'https://photo.url',
  locale: 'pt-BR',
};

describe('GoogleTokenAdapter', () => {
  let adapter: GoogleTokenAdapter;
  let mockVerifyIdToken: jest.Mock;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-client-id.apps.googleusercontent.com'),
  };

  beforeEach(async () => {
    mockVerifyIdToken = jest.fn();
    MockedOAuth2Client.mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    }) as unknown as OAuth2Client);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleTokenAdapter,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    adapter = module.get<GoogleTokenAdapter>(GoogleTokenAdapter);
    jest.clearAllMocks();

    // Re-wire mock after clearAllMocks
    mockVerifyIdToken = jest.fn();
    (adapter as unknown as { client: { verifyIdToken: jest.Mock } }).client.verifyIdToken =
      mockVerifyIdToken;
  });

  describe('verify', () => {
    it('deve retornar GoogleUserEntity com token válido', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => validPayload,
      });

      const result = await adapter.verify('valid-token');

      expect(result.googleSub).toBe(validPayload.sub);
      expect(result.email).toBe(validPayload.email);
      expect(result.givenName).toBe(validPayload.given_name);
      expect(result.familyName).toBe(validPayload.family_name);
      expect(result.picture).toBe(validPayload.picture);
      expect(result.locale).toBe(validPayload.locale);
    });

    it('deve lançar UnauthorizedException quando payload é nulo', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      await expect(adapter.verify('token-sem-payload')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(adapter.verify('token-sem-payload')).rejects.toThrow(
        'Token inválido',
      );
    });

    it('deve lançar UnauthorizedException quando token está expirado', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Token used too late'));

      await expect(adapter.verify('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(adapter.verify('expired-token')).rejects.toThrow(
        'Falha na validação do token Google',
      );
    });

    it('deve lançar UnauthorizedException quando audience é inválida', async () => {
      mockVerifyIdToken.mockRejectedValue(
        new Error('Wrong recipient, payload audience != requiredAudience'),
      );

      await expect(adapter.verify('wrong-audience-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve re-lançar UnauthorizedException sem encapsular', async () => {
      const original = new UnauthorizedException('Token inválido');
      mockVerifyIdToken.mockRejectedValue(original);

      await expect(adapter.verify('some-token')).rejects.toThrow(original);
    });
  });
});
