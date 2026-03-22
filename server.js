import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { unlink } from 'fs';

const { json, urlencoded } = express;
const { connect } = mongoose;
const { schedule } = cron;

import File from './models/File.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';

const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));

// 라우터 연결
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notices', noticeRoutes);

// MongoDB 연결 (class_website라는 이름의 DB 사용)
console.log(process.env.MONGODB_URL);
connect(process.env.MONGODB_URL ?? "")
    .then(() => console.log('✅ MongoDB 연결 성공'))
    .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 6개월 자동 삭제 스케줄러 (매일 자정 실행)
schedule('0 0 * * *', async () => {
    console.log("🧹 자동 삭제 스케줄러 실행 중...");
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const filesToDelete = await File.find({
            uploadDate: { $lte: sixMonthsAgo },
            isEssential: false
        });

        for (const file of filesToDelete) {
            unlink(file.filePath, async (err) => {
                if (err && err.code !== 'ENOENT') return;
                await File.findByIdAndDelete(file._id);
                console.log(`자동 삭제 완료: ${file.filename}`);
            });
        }
    } catch (error) {
        console.error("자동 삭제 오류:", error);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});