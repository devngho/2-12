import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const calendarEventSchema = new Schema({
  date: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  authorId: { type: String, required: true },
  source: { type: String, enum: ['manual', 'assessment'], default: 'manual' },
  boardId: { type: Schema.Types.ObjectId, ref: 'Board' },
  createdAt: { type: Date, default: Date.now }
});

export default model('CalendarEvent', calendarEventSchema);
