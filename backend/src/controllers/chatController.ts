// backend/src/controllers/chatController.ts
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import User, { IUser } from '../models/User';
import Chat, { IChat } from '../models/Chat';
import Message, { IMessage } from '../models/Message';
import { Server as IOServer } from 'socket.io';

// Custom Express Request interface to include Socket.IO server instance
interface IRequest extends Request {
  user?: { uid: string };
  io?: IOServer;
}

// GET /api/chat/threads
export const getThreads = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const me = await User.findOne({ firebaseUID: req.user!.uid });
    if (!me) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const threads = await Chat.find({ participants: me._id })
      .populate('participants', 'name profileImageUrl firebaseUID')
      .sort({ updatedAt: -1 })
      .lean();

    const result = threads
      .map(thread => {
        const otherParticipant = (thread.participants as any[]).find(
          (p: any) => !p._id.equals(me._id)
        );

        if (!otherParticipant) return null;

        const unreadCount =
          (thread.unreadCountByUser as Record<string, number>)?.[
            me._id.toString()
          ] || 0;

        return {
          chatId: thread._id.toString(),
          recipientId: otherParticipant._id.toString(),
          recipientFirebaseUID: otherParticipant.firebaseUID,
          recipientName: otherParticipant.name || 'Unknown User',
          recipientAvatar: otherParticipant.profileImageUrl,
          lastMessageText: thread.lastMessage?.text || 'No messages yet',
          lastMessageTimestamp: thread.lastMessage?.timestamp?.toISOString() || new Date().toISOString(),
          unreadCount,
          updatedAt: thread.updatedAt.toISOString(),
        };
      })
      .filter(Boolean);

    res.status(200).json(result);
  } catch (err) {
    console.error('Error getting threads:', err);
    next(err);
  }
};

// GET /api/chat/:chatId/messages
export const getMessages = async (
  req: IRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const me = await User.findOne({ firebaseUID: req.user!.uid });
    if (!me) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { chatId } = req.params;
    if (!Types.ObjectId.isValid(chatId)) {
      res.status(400).json({ message: 'Invalid chat ID' });
      return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(pId => pId.equals(me._id));
    if (!isParticipant) {
      res.status(403).json({ message: 'Access denied to this chat' });
      return;
    }

    const messages = await Message.find({ chatId: chat._id })
      .sort({ timestamp: 1 })
      .populate('sender', 'name profileImageUrl firebaseUID')
      .lean();

    // Mark messages as read
    await Chat.updateOne(
        { _id: chat._id },
        { $set: { [`unreadCountByUser.${me._id}`]: 0 } }
    );

    // Emit messages read event
    req.io?.to(chatId).emit('messagesRead', {
      chatId,
      readerId: req.user!.uid,
    });

    const transformedMessages = messages.map(msg => {
      const sender = msg.sender as any;
      return {
        _id: msg._id.toString(),
        chatId: msg.chatId.toString(),
        text: msg.text,
        timestamp: msg.timestamp.toISOString(),
        sender: {
          _id: sender.firebaseUID,
          name: sender.name,
          profileImageUrl: sender.profileImageUrl,
        },
      };
    });

    res.status(200).json(transformedMessages);
  } catch (err) {
    console.error('Error getting messages:', err);
    next(err);
  }
};

// POST /api/chat/messages
export const postMessage = async (
    req: Request & { user?: { uid: string }; io?: any },
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { text, otherUserId, chatId: maybeChatId } = req.body as {
        text: string;
        otherUserId: string;   // recipient’s Firebase UID or Mongo ID
        chatId?: string;       // optional existing chat ID
      };
  
      // 1) Validate input
      if (!text?.trim() || !otherUserId) {
        res.status(400).json({ message: 'Recipient and text are required' });
        return;
      }
  
      // 2) Lookup sender by Firebase UID
      const me = await User.findOne({ firebaseUID: req.user!.uid });
      if (!me) {
        res.status(404).json({ message: 'Sender not found' });
        return;
      }
  
      // 3) Lookup recipient (handle Firebase UID or Mongo _id)
      const recipient = Types.ObjectId.isValid(otherUserId)
        ? await User.findById(otherUserId)
        : await User.findOne({ firebaseUID: otherUserId });
      if (!recipient) {
        res.status(404).json({ message: 'Recipient not found' });
        return;
      }
  
      // 4) Find existing chat by ID or by participant-pair
      let chat = maybeChatId && Types.ObjectId.isValid(maybeChatId)
        ? await Chat.findById(maybeChatId)
        : null;
  
      if (chat && !chat.participants.includes(me._id)) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
  
      if (!chat) {
        chat = await Chat.findOne({
          participants: { $all: [me._id, recipient._id], $size: 2 }
        });
      }
  
      // Prepare the lastMessage payload
      const lastMessageData = {
        text:      text.trim(),
        timestamp: new Date(),
        sender:    me._id,
      };
  
      // 5) Create new chat if none found
      if (!chat) {
        chat = new Chat({
          participants:      [me._id, recipient._id],
          lastMessage:      lastMessageData,
          unreadCountByUser: { [recipient._id.toString()]: 1 },
        });
        await chat.save();
      } else {
        // 6) Update existing chat using Mongo operators
        await Chat.updateOne(
          { _id: chat._id },
          {
            $set: { lastMessage: lastMessageData },
            $inc: { [`unreadCountByUser.${recipient._id}`]: 1 },
          }
        );
      }
  
      // 7) Save the new message
      const message = await Message.create({
        chatId:    chat._id,
        sender:    me._id,
        text:      text.trim(),
        timestamp: new Date(),
      });
  
      // 8) Populate and broadcast via Socket.IO
      await message.populate('sender', 'name profileImageUrl firebaseUID');
      const sp = message.sender as any;
      const payload = {
        _id:       message._id.toString(),
        chatId:    chat._id.toString(),
        text:      message.text,
        timestamp: message.timestamp.toISOString(),
        sender: {
          _id:             sp.firebaseUID,
          name:            sp.name,
          profileImageUrl: sp.profileImageUrl,
        },
      };
  
      // send to chat room
      req.io?.to(chat._id.toString()).emit('message', payload);
      // notify inbox listeners
      chat.participants.forEach(pid =>
        req.io?.to(`user-inbox-${pid.toString()}`)
           .emit('chat-activity', { chatId: chat._id.toString() })
      );
  
      // 9) Respond
      res.status(201).json(payload);
    } catch (err) {
      console.error('postMessage error:', err);
      next(err);
    }
  };
  