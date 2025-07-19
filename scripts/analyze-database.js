#!/usr/bin/env node

/**
 * 使用Prisma查询和分析数据库的脚本
 * 备份关键数据并找出孤立记录
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 开始数据分析和备份...');
  
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');

  try {
    // 1. 备份所有数据
    console.log('📊 收集数据统计...');
    
    const stats = {
      movies: await prisma.movie.count(),
      tvShows: await prisma.tvShow.count(),
      actors: await prisma.actor.count(),
      movieCast: await prisma.movieCast.count(),
      tvCast: await prisma.tvCast.count(),
      movieReviews: await prisma.movieReview.count(),
      tvReviews: await prisma.tvReview.count(),
      operationLogs: await prisma.operationLog.count(),
      users: await prisma.user.count()
    };
    
    console.log('📈 数据库统计:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} 条记录`);
    });

    // 2. 导出所有数据
    console.log('\n💾 导出数据...');
    
    const allData = {
      movies: await prisma.movie.findMany(),
      tvShows: await prisma.tvShow.findMany(),
      actors: await prisma.actor.findMany(),
      movieCast: await prisma.movieCast.findMany(),
      tvCast: await prisma.tvCast.findMany(),
      movieReviews: await prisma.movieReview.findMany(),
      tvReviews: await prisma.tvReview.findMany(),
      operationLogs: await prisma.operationLog.findMany(),
      users: await prisma.user.findMany()
    };

    const backupFile = path.join(backupDir, `data_backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(allData, null, 2));
    console.log(`✅ 数据备份完成: ${backupFile}`);

    // 3. 查找孤立的Actor记录
    console.log('\n🔍 查找孤立的Actor记录...');
    
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

    console.log(`🎭 找到 ${orphanedActors.length} 个孤立的Actor记录:`);
    orphanedActors.forEach(actor => {
      console.log(`  - ID: ${actor.id}, Name: ${actor.name}, TMDB ID: ${actor.tmdbId}`);
    });

    // 4. 查找有问题的Cast记录 - 实际上数据库的级联删除应该已经处理了这些
    console.log('\n🔍 检查Cast记录完整性...');
    
    // 由于外键约束和级联删除，理论上不应该有无效的Cast记录
    // 但我们可以通过计数来验证数据一致性
    const movieCastCount = await prisma.movieCast.count();
    const tvCastCount = await prisma.tvCast.count();
    const movieCastWithMovies = await prisma.movieCast.count({
      where: {
        movie: {
          id: { not: undefined }
        }
      }
    });
    const tvCastWithTvShows = await prisma.tvCast.count({
      where: {
        tvShow: {
          id: { not: undefined }
        }
      }
    });

    console.log(`🎬 MovieCast记录总数: ${movieCastCount}`);
    console.log(`🎬 有效的MovieCast记录: ${movieCastWithMovies}`);
    console.log(`📺 TvCast记录总数: ${tvCastCount}`);
    console.log(`📺 有效的TvCast记录: ${tvCastWithTvShows}`);

    // 5. 检查OperationLog的新字段状态
    console.log('\n🔍 检查OperationLog新字段状态...');
    
    const logStats = {
      total: await prisma.operationLog.count(),
      withOperatorName: await prisma.operationLog.count({
        where: { 
          operatorName: { 
            not: null 
          } 
        }
      }),
      withResourceId: await prisma.operationLog.count({
        where: { 
          resourceId: { 
            not: null 
          } 
        }
      }),
      withResourceName: await prisma.operationLog.count({
        where: { 
          resourceName: { 
            not: null 
          } 
        }
      }),
      withMetadata: await prisma.operationLog.count({
        where: { 
          metadata: { 
            not: null 
          } 
        }
      })
    };

    console.log(`📋 OperationLog统计:`);
    console.log(`  总记录数: ${logStats.total}`);
    console.log(`  有操作员名称: ${logStats.withOperatorName}`);
    console.log(`  有资源ID: ${logStats.withResourceId}`);
    console.log(`  有资源名称: ${logStats.withResourceName}`);
    console.log(`  有元数据: ${logStats.withMetadata}`);

    // 6. 生成清理脚本
    const cleanupData = {
      orphanedActors: orphanedActors.map(a => a.id),
      operationLogStats: logStats,
      stats
    };

    const cleanupFile = path.join(backupDir, `cleanup_plan_${timestamp}.json`);
    fs.writeFileSync(cleanupFile, JSON.stringify(cleanupData, null, 2));
    console.log(`\n📋 清理计划已生成: ${cleanupFile}`);

    console.log('\n✅ 数据分析完成!');
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);