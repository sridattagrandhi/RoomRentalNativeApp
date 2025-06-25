// backend/src/models/Chat.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

// The Chat document represents a conversation thread
export interface IChat extends Document {
    _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: { // lastMessage is now optional
    text: string;
    timestamp: Date;
    sender: Types.ObjectId;
  };
  unreadCountByUser: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: {
      text: { type: String },
      timestamp: { type: Date },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    // Map from Mongo User ID -> number of unread messages
    unreadCountByUser: {
        type: Schema.Types.Mixed,
        default: {},
      },
  },
  { timestamps: true }
);

// Index for efficiently finding chats by participants
ChatSchema.index({ participants: 1 });

export default mongoose.model<IChat>('Chat', ChatSchema);
