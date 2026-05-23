import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema({
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true,
        enum: ['일반', '반장', '부반장', '선생님', '1인1역할', '관리자'] 
    },
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default model('User', userSchema);