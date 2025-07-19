#!/usr/bin/env node

/**
 * 清理孤立Actor记录的脚本
 * 删除没有关联任何影视作品的演员记录
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanupOrphanedActors() {
  console.log('🧹 开始清理孤立的Actor记录...');
  
  try {
    // 1. 再次查找孤立的Actor记录以确认
    const orphanedActors = await prisma.actor.findMany({
      where: {
        AND: [
          {
            movieRoles: {
              none: {}
            }
          },
          {
            tvRoles: {
              none: {}
            }
          }
        ]
      }
    });

    console.log(`🎭 发现 ${orphanedActors.length} 个孤立的Actor记录:`);
    
    if (orphanedActors.length === 0) {
      console.log('✅ 没有发现孤立的Actor记录，无需清理');
      return;
    }

    // 2. 显示要删除的记录
    orphanedActors.forEach((actor, index) => {
      console.log(`  ${index + 1}. ID: ${actor.id}, Name: ${actor.name}, TMDB ID: ${actor.tmdbId}`);
    });

    // 3. 创建清理日志
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');

    const logDir = path.join(__dirname, '..', 'backups');
    const logFile = path.join(logDir, `cleanup_log_${timestamp}.json`);

    const cleanupLog = {
      timestamp: new Date().toISOString(),
      action: 'DELETE_ORPHANED_ACTORS',
      deletedActors: orphanedActors.map(actor => ({
        id: actor.id,
        name: actor.name,
        tmdbId: actor.tmdbId,
        createdAt: actor.createdAt
      })),
      totalDeleted: orphanedActors.length
    };

    // 4. 执行删除操作
    console.log('\n🗑️  开始删除孤立的Actor记录...');
    
    const deleteResult = await prisma.actor.deleteMany({
      where: {
        id: {
          in: orphanedActors.map(actor => actor.id)
        }
      }
    });

    console.log(`✅ 成功删除 ${deleteResult.count} 个孤立的Actor记录`);

    // 5. 保存清理日志
    fs.writeFileSync(logFile, JSON.stringify(cleanupLog, null, 2));
    console.log(`📋 清理日志已保存: ${logFile}`);

    // 6. 验证清理结果
    const remainingOrphanedActors = await prisma.actor.findMany({
      where: {
        AND: [
          {
            movieRoles: {
              none: {}
            }
          },
          {
            tvRoles: {
              none: {}
            }
          }
        ]
      }
    });

    console.log(`\n🔍 验证结果: 剩余孤立Actor记录 ${remainingOrphanedActors.length} 个`);
    
    // 7. 更新数据库统计
    const finalStats = {
      actors: await prisma.actor.count(),
      movieCast: await prisma.movieCast.count(),
      tvCast: await prisma.tvCast.count()
    };

    console.log('\n📊 清理后统计:');
    console.log(`  演员总数: ${finalStats.actors}`);
    console.log(`  电影演员关联: ${finalStats.movieCast}`);
    console.log(`  电视剧演员关联: ${finalStats.tvCast}`);

  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 确认清理操作
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  cleanupOrphanedActors().catch(console.error);
} else {
  console.log('⚠️  这是一个危险操作，会永久删除孤立的Actor记录');
  console.log('如果确认要执行清理，请使用参数 --confirm');
  console.log('例如: node scripts/cleanup-orphaned-actors.js --confirm');
}