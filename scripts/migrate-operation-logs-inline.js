#!/usr/bin/env node

/**
 * 在线数据迁移脚本
 * 填充OperationLog的新字段，并移除外键关联
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function performInPlaceMigration() {
  console.log('🔄 开始在线数据迁移...');
  
  try {
    // 1. 获取所有需要迁移的记录
    const logs = await prisma.operationLog.findMany({
      where: {
        operatorName: null // 只处理未迁移的记录
      },
      include: {
        user: true
      }
    });

    console.log(`📋 找到 ${logs.length} 条需要迁移的记录`);

    let successCount = 0;
    let errorCount = 0;

    // 2. 逐条更新记录
    for (const log of logs) {
      try {
        const updateData = {
          operatorName: log.user?.username || 'Unknown'
        };

        // 处理资源信息
        if (log.movieId) {
          // 获取电影信息
          const movie = await prisma.movie.findUnique({
            where: { id: log.movieId }
          });
          
          if (movie) {
            updateData.resourceId = log.movieId;
            updateData.resourceName = movie.title;
            updateData.resourceType = 'MOVIE';
            updateData.metadata = {
              originalMovieId: log.movieId,
              tmdbId: movie.tmdbId,
              migrationDate: new Date().toISOString()
            };
          }
        }

        if (log.tvShowId) {
          // 获取电视剧信息
          const tvShow = await prisma.tvShow.findUnique({
            where: { id: log.tvShowId }
          });
          
          if (tvShow) {
            updateData.resourceId = log.tvShowId;
            updateData.resourceName = tvShow.name;
            updateData.resourceType = 'TV_SHOW';
            updateData.metadata = {
              originalTvShowId: log.tvShowId,
              tmdbId: tvShow.tmdbId,
              migrationDate: new Date().toISOString()
            };
          }
        }

        // 如果没有影视剧关联，基于entityType设置resourceType
        if (!updateData.resourceType) {
          updateData.resourceType = log.entityType;
          updateData.metadata = {
            originalEntityId: log.entityId,
            migrationDate: new Date().toISOString()
          };
        }

        // 更新记录
        await prisma.operationLog.update({
          where: { id: log.id },
          data: updateData
        });

        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`⏳ 已处理 ${successCount} 条记录...`);
        }

      } catch (error) {
        console.error(`❌ 迁移记录 ${log.id} 失败:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ 迁移完成: ${successCount} 成功, ${errorCount} 失败`);

    // 3. 验证迁移结果
    const unmigratedCount = await prisma.operationLog.count({
      where: {
        operatorName: null
      }
    });

    console.log(`🔍 验证结果: ${unmigratedCount} 条记录仍未迁移`);

    // 4. 统计迁移后的数据
    const stats = {
      total: await prisma.operationLog.count(),
      withMovie: await prisma.operationLog.count({
        where: { resourceType: 'MOVIE' }
      }),
      withTvShow: await prisma.operationLog.count({
        where: { resourceType: 'TV_SHOW' }
      }),
      withUser: await prisma.operationLog.count({
        where: { resourceType: 'USER' }
      }),
      withActor: await prisma.operationLog.count({
        where: { resourceType: 'ACTOR' }
      })
    };

    console.log('\n📊 迁移后统计:');
    console.log(`  总记录数: ${stats.total}`);
    console.log(`  电影相关: ${stats.withMovie}`);
    console.log(`  电视剧相关: ${stats.withTvShow}`);
    console.log(`  用户相关: ${stats.withUser}`);
    console.log(`  演员相关: ${stats.withActor}`);

    console.log('\n✅ 在线数据迁移完成!');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

performInPlaceMigration().catch(console.error);