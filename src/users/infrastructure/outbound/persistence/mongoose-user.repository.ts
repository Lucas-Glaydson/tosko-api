import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from '../../../domain/entities/user.entity';
import {
  FindOrCreateUserInput,
  type UserRepositoryPort,
} from '../../../domain/ports/outbound/user-repository.port';
import {
  UserSchemaClass,
  UserDocument,
} from './schemas/user.schema';

@Injectable()
export class MongooseUserRepository implements UserRepositoryPort {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByGoogleSub(googleSub: string): Promise<UserEntity | null> {
    const doc = await this.userModel.findOne({ googleSub }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(input: FindOrCreateUserInput): Promise<UserEntity> {
    const doc = await this.userModel.create({
      ...input,
      lastLoginAt: new Date(),
    });
    return this.toEntity(doc);
  }

  async updateLastLogin(id: string): Promise<UserEntity> {
    const doc = await this.userModel
      .findByIdAndUpdate(
        id,
        { lastLoginAt: new Date() },
        { new: true },
      )
      .exec();
    return this.toEntity(doc!);
  }

  async softDelete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  private toEntity(doc: UserDocument): UserEntity {
    return new UserEntity(
      (doc._id as object).toString(),
      doc.googleSub,
      doc.email,
      doc.givenName,
      doc.familyName,
      doc.picture,
      doc.locale,
      (doc as unknown as { createdAt: Date }).createdAt,
      (doc as unknown as { updatedAt: Date }).updatedAt,
      doc.lastLoginAt,
    );
  }
}
