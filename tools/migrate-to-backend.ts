/**
 * 数据迁移工具
 * 将浏览器 IndexedDB 数据迁移到后端服务器
 * 
 * 使用方法:
 * 1. 在前端控制台运行此脚本，导出数据为 JSON
 * 2. 将 JSON 文件上传到后端
 * 3. 后端批量导入数据
 */

// ============================================
// 前端数据导出脚本（在浏览器控制台运行）
// ============================================

/*
// Step 1: 在浏览器控制台运行此代码，导出所有数据

async function exportAllData() {
  const Dexie = window.Dexie; // 假设 Dexie 已加载
  
  // 打开数据库
  const db = new Dexie('LifeRecorderDB');
  db.version(2).stores({
    diaries: 'id, date, createdAt, mood, wordCount, type, isDeleted, isPinned, [date+createdAt]',
  });
  
  await db.open();
  
  // 导出日记
  const diaries = await db.diaries
    .filter(record => record.isDeleted !== true)
    .toArray();
  
  // 从 localStorage 导出记录
  const records = [];
  const recordsStore = localStorage.getItem('records-storage');
  if (recordsStore) {
    const parsed = JSON.parse(recordsStore);
    if (parsed.state && parsed.state.records) {
      records.push(...parsed.state.records);
    }
  }
  
  // 导出聊天会话
  const chatSessions = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('chat_')) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          chatSessions.push({
            id: key.replace('chat_', ''),
            data: JSON.parse(data),
          });
        } catch (e) {
          console.error('Failed to parse chat session:', key);
        }
      }
    }
  }
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      records,
      diaries,
      chatSessions,
    },
    stats: {
      recordCount: records.length,
      diaryCount: diaries.length,
      chatSessionCount: chatSessions.length,
    },
  };
  
  // 下载 JSON 文件
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-recorder-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Data exported successfully!');
  console.log('Stats:', exportData.stats);
  
  return exportData;
}

// 运行导出
exportAllData();
*/

// ============================================
// 后端数据导入脚本（Node.js）
// ============================================

import { readFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ExportData {
  version: string
  exportedAt: string
  data: {
    records: any[]
    diaries: any[]
    chatSessions: any[]
  }
  stats: {
    recordCount: number
    diaryCount: number
    chatSessionCount: number
  }
}

/**
 * 导入数据到数据库
 */
async function importData(userId: string, filePath: string) {
  console.log('📦 Loading export file...')
  const fileContent = readFileSync(filePath, 'utf-8')
  const exportData: ExportData = JSON.parse(fileContent)
  
  console.log('📊 Export Stats:')
  console.log('  - Records:', exportData.stats.recordCount)
  console.log('  - Diaries:', exportData.stats.diaryCount)
  console.log('  - Chat Sessions:', exportData.stats.chatSessionCount)
  
  // 导入记录
  console.log('\n📝 Importing records...')
  let importedRecords = 0
  
  for (const record of exportData.data.records) {
    try {
      await prisma.record.create({
        data: {
          id: record.id,
          userId,
          content: record.content,
          location: record.location,
          audioUrl: record.audioData ? undefined : record.audioUrl, // Base64 音频需要先上传到 R2
          audioDuration: record.audioDuration,
          audioFormat: record.audioFormat,
          timestamp: record.timestamp,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt || record.createdAt),
        },
      })
      importedRecords++
      
      if (importedRecords % 10 === 0) {
        console.log(`  ✓ Imported ${importedRecords}/${exportData.stats.recordCount} records`)
      }
    } catch (error) {
      console.error(`  ✗ Failed to import record ${record.id}:`, error)
    }
  }
  
  console.log(`✅ Imported ${importedRecords} records`)
  
  // 导入日记
  console.log('\n📔 Importing diaries...')
  let importedDiaries = 0
  
  for (const diary of exportData.data.diaries) {
    try {
      await prisma.diary.create({
        data: {
          id: diary.id,
          userId,
          date: new Date(diary.date),
          diaryData: diary.diary,
          mood: diary.mood,
          wordCount: diary.wordCount,
          type: diary.type === 'auto' ? 'AUTO' : 'MANUAL',
          excerpt: diary.excerpt,
          title: diary.title,
          isDeleted: false,
          isPinned: diary.isPinned || false,
          createdAt: new Date(diary.createdAt),
          updatedAt: new Date(diary.updatedAt || diary.createdAt),
        },
      })
      importedDiaries++
      
      if (importedDiaries % 5 === 0) {
        console.log(`  ✓ Imported ${importedDiaries}/${exportData.stats.diaryCount} diaries`)
      }
    } catch (error) {
      console.error(`  ✗ Failed to import diary ${diary.id}:`, error)
    }
  }
  
  console.log(`✅ Imported ${importedDiaries} diaries`)
  
  // 导入聊天会话
  console.log('\n💬 Importing chat sessions...')
  let importedSessions = 0
  
  for (const session of exportData.data.chatSessions) {
    try {
      await prisma.chatSession.create({
        data: {
          id: session.id,
          userId,
          title: session.data.title || 'Untitled Chat',
          model: session.data.model || 'gpt-4o-mini',
          messages: session.data,
          createdAt: new Date(session.data.createdAt || Date.now()),
          updatedAt: new Date(session.data.updatedAt || Date.now()),
        },
      })
      importedSessions++
      
      if (importedSessions % 5 === 0) {
        console.log(`  ✓ Imported ${importedSessions}/${exportData.stats.chatSessionCount} sessions`)
      }
    } catch (error) {
      console.error(`  ✗ Failed to import session ${session.id}:`, error)
    }
  }
  
  console.log(`✅ Imported ${importedSessions} chat sessions`)
  
  console.log('\n✨ Migration completed!')
  console.log('Summary:')
  console.log(`  - Records: ${importedRecords}/${exportData.stats.recordCount}`)
  console.log(`  - Diaries: ${importedDiaries}/${exportData.stats.diaryCount}`)
  console.log(`  - Chat Sessions: ${importedSessions}/${exportData.stats.chatSessionCount}`)
}

/**
 * 使用示例
 */
async function main() {
  const userId = process.argv[2]
  const filePath = process.argv[3]
  
  if (!userId || !filePath) {
    console.error('Usage: tsx tools/migrate-to-backend.ts <userId> <exportFilePath>')
    console.error('Example: tsx tools/migrate-to-backend.ts user-uuid-123 ./export.json')
    process.exit(1)
  }
  
  // 验证用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  
  if (!user) {
    console.error(`❌ User not found: ${userId}`)
    process.exit(1)
  }
  
  console.log(`👤 Importing data for user: ${user.email}`)
  
  await importData(userId, filePath)
  
  await prisma.$disconnect()
}

// 运行迁移
main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})

export { importData }

