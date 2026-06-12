export class GoogleUserEntity {
  constructor(
    public readonly googleSub: string,
    public readonly email: string,
    public readonly givenName: string,
    public readonly familyName: string,
    public readonly picture: string | undefined,
    public readonly locale: string | undefined,
  ) {}
}
