import { Schema, model } from 'mongoose';

const timeTableSchema = new Schema({
    studentId: { type: String, required: true, unique: true },
    selects: [{
        name: { type: String, required: true },
        subject: { type: String, required: true },
        teacher: { type: String, required: true },
        room: { type: String, required: true }
    }]
});

export default model('TimeTable', timeTableSchema);