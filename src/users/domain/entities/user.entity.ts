export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly googleSub: string,
    public readonly email: string,
    public readonly givenName: string,
    public readonly familyName: string,
    public readonly picture: string | undefined,
    public readonly locale: string | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastLoginAt: Date,
  ) {}
}
