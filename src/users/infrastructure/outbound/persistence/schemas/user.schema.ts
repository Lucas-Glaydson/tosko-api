import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserSchemaClass>;

@Schema({ timestamps: true })
export class UserSchemaClass {
  @Prop({ required: true, unique: true, index: true })
  googleSub: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email: string;

  @Prop({ required: true, trim: true })
  givenName: string;

  @Prop({ required: true, trim: true })
  familyName: string;

  @Prop({ trim: true })
  picture?: string;

  @Prop({ trim: true })
  locale?: string;

  @Prop({ default: Date.now })
  lastLoginAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserSchemaClass);
