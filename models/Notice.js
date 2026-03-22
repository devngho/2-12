import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const noticeSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ['performance', 'supplies', 'event', 'general'],
    default: 'general'
  },
  content: { type: String, required: true },
  deadline: { type: Date, required: true },
  dDayAlarm: { type: Number, default: 3 },
  authorId: { type: String, required: true },
  authorRole: { type: String, required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default model('Notice', noticeSchema);
