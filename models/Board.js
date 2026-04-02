import { Schema, model } from 'mongoose';

const boardSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ['공지', '수행평가', '일반'],
    default: '일반'
  },
  content: { type: String, required: true },
  deadline: { type: Date, required: false },
  dDayAlarm: { type: Number, default: 3 },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default model('Board', boardSchema);
