import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const fileSchema = new Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    size: { type: Number, required: true },
    uploaderId: { type: String, required: true }, // JWT에서 추출한 유저 ID 저장
    description: { type: String, default: "" },
    presidentComment: { type: String, default: "" },
    isEssential: { type: Boolean, default: false },
    category: { 
        type: String, 
        required: true,
        enum: ['수업자료', '수행평가', '기출문제', '행사/공지', '기타'],
        default: '기타'
    },
    uploadDate: { type: Date, default: Date.now }
});

export default model('File', fileSchema);