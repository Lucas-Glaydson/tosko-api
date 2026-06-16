import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from '../../../domain/entities/user.entity';
import {
  CreateUserInput,
  type UserRepositoryPort,
} from '../../../domain/ports/outbound/user-repository.port';
import {
  UserSchemaClass,
  UserDocument,
} from './schemas/user.schema';

// MongoDB error code for duplicate key violations
const MONGO_DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === MONGO_DUPLICATE_KEY_CODE
  );
}

@Injectable()
export class MongooseUserRepository implements UserRepositoryPort {
  private readonly logger = new Logger(MongooseUserRepository.name);

  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    try {
      const doc = await this.userModel.create(input);
      return this.toEntity(doc);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('E-mail já cadastrado');
      }
      this.logger.error(
        { err: error },
        `Failed to create user with email: ${input.email}`,
      );
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  private toEntity(doc: UserDocument): UserEntity {
    const d = doc as unknown as { createdAt: Date; updatedAt: Date };
    return new UserEntity(
      (doc._id as object).toString(),
      doc.email,
      doc.name,
      doc.passwordHash ?? '',
      d.createdAt,
      d.updatedAt,
    );
  }
}
