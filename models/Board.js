import { Schema, model } from 'mongoose';

const boardSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ['공지', '수행', '일반', '파일'],
    default: '일반'
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  deadline: { type: Date, required: false },
  dDayAlarm: { type: Number, default: 3 },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  files: [
    {
      fileName: { type: String, required: true },
      filePath: { type: String, required: true }
    }
  ],
  comments: [
    {
      userId: { type: String, required: true },
      nickname: { type: String, required: true },
      content: { type: String, required: true },
      commentedAt: { type: Date, default: Date.now },
      isDeleted: { type: Boolean, default: false },
    }
  ]
});

export default model('Board', boardSchema);
