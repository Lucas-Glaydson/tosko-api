import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
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

// Indexes that existed in old schema versions (e.g. Google auth) and must be removed
const STALE_INDEXES = ['googleSub_1'];

interface MongoServerError {
  code: number;
  keyValue?: Record<string, unknown>;
  message?: string;
}

function isDuplicateKeyError(err: unknown): err is MongoServerError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as MongoServerError).code === MONGO_DUPLICATE_KEY_CODE
  );
}

function isDuplicateEmailError(err: MongoServerError): boolean {
  if (err.keyValue && 'email' in err.keyValue) return true;
  // Fallback: parse the error message (e.g. "index: email_1 dup key")
  return (err.message ?? '').includes('email');
}

@Injectable()
export class MongooseUserRepository implements UserRepositoryPort, OnModuleInit {
  private readonly logger = new Logger(MongooseUserRepository.name);

  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    // Drop stale unique indexes left over from previous schema versions.
    // These cause E11000 on null values for fields that no longer exist in the schema.
    for (const indexName of STALE_INDEXES) {
      try {
        await this.userModel.collection.dropIndex(indexName);
        this.logger.warn(`Dropped stale index: ${indexName}`);
      } catch {
        // Index does not exist – nothing to do
      }
    }
  }

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
        if (isDuplicateEmailError(error)) {
          throw new ConflictException('E-mail já cadastrado');
        }
        // Duplicate on a field other than email (e.g. stale index) — log and surface clearly
        this.logger.error(
          { err: error, keyValue: error.keyValue },
          `Unexpected duplicate key violation during user creation for email: ${input.email}`,
        );
        throw new InternalServerErrorException(
          'Erro ao criar usuário: índice obsoleto no banco de dados',
        );
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
