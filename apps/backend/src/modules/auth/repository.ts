import mongoose, { Document, Schema } from 'mongoose';
import { User, UserRole } from './types';

interface IUserDocument extends Omit<User, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    uid: { type: String, required: true },
    email: { type: String, required: true },
    displayName: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['owner', 'admin', 'project_manager', 'field_worker', 'subcontractor', 'viewer'] as UserRole[],
      default: 'viewer',
    },
    orgId: { type: String, required: true },
    fcmTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.index({ orgId: 1 });
userSchema.index({ uid: 1 }, { unique: true });
userSchema.index({ orgId: 1, createdAt: -1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);

export async function findUserByUid(uid: string): Promise<IUserDocument | null> {
  return UserModel.findOne({ uid }).exec();
}

export async function findUserByUidAndOrg(
  uid: string,
  orgId: string
): Promise<IUserDocument | null> {
  return UserModel.findOne({ uid, orgId }).exec();
}

export async function upsertUser(data: {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  orgId: string;
  fcmToken?: string;
}): Promise<IUserDocument> {
  const update: Record<string, unknown> = {
    email: data.email,
    displayName: data.displayName,
    orgId: data.orgId,
  };

  if (data.fcmToken) {
    update['$addToSet'] = { fcmTokens: data.fcmToken };
  }

  const existing = await UserModel.findOne({ uid: data.uid }).exec();
  if (!existing) {
    update['role'] = data.role;
    update['uid'] = data.uid;
    return UserModel.create(update);
  }

  Object.assign(existing, {
    email: data.email,
    displayName: data.displayName,
    orgId: data.orgId,
  });

  if (data.fcmToken && !existing.fcmTokens.includes(data.fcmToken)) {
    existing.fcmTokens.push(data.fcmToken);
  }

  return existing.save();
}

export async function updateUserRole(
  uid: string,
  orgId: string,
  role: UserRole
): Promise<IUserDocument | null> {
  return UserModel.findOneAndUpdate({ uid, orgId }, { role }, { new: true }).exec();
}
