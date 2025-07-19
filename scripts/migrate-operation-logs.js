#!/usr/bin/env node

/**
 * OperationLog表数据迁移脚本
 * 将现有数据从外键关联模式迁移到独立记录模式
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateOperationLogs() {
  console.log('🔄 开始OperationLog数据迁移...');
  
  try {
    // 1. 获取所有现有的操作日志数据
    const existingLogs = await prisma.operationLog.findMany({
      include: {
        user: true,
        movie: true,
        tvShow: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📋 找到 ${existingLogs.length} 条操作日志记录`);

    // 2. 准备迁移数据
    const migratedData = [];
    let successCount = 0;
    let errorCount = 0;

    for (const log of existingLogs) {
      try {
        const migratedLog = {
          id: log.id,
          userId: log.userId,
          operatorName: log.user?.username || 'Unknown',
          action: log.action,
          entityType: log.entityType,
          description: log.description,
          createdAt: log.createdAt,
          // 新增字段
          resourceId: null,
          resourceName: null,
          resourceType: null,
          metadata: {}
        };

        // 处理电影关联
        if (log.movieId && log.movie) {
          migratedLog.resourceId = log.movieId;
          migratedLog.resourceName = log.movie.title;
          migratedLog.resourceType = 'MOVIE';
          migratedLog.metadata.originalMovieId = log.movieId;
          migratedLog.metadata.tmdbId = log.movie.tmdbId;
        }
        
        // 处理电视剧关联
        if (log.tvShowId && log.tvShow) {
          migratedLog.resourceId = log.tvShowId;
          migratedLog.resourceName = log.tvShow.name;
          migratedLog.resourceType = 'TV_SHOW';
          migratedLog.metadata.originalTvShowId = log.tvShowId;
          migratedLog.metadata.tmdbId = log.tvShow.tmdbId;
        }

        // 如果没有关联的影视内容，基于EntityType设置resourceType
        if (!migratedLog.resourceType) {
          migratedLog.resourceType = log.entityType;
        }

        // 添加一些额外的元数据
        migratedLog.metadata.originalAction = log.action;
        migratedLog.metadata.migrationDate = new Date().toISOString();

        migratedData.push(migratedLog);
        successCount++;

      } catch (error) {
        console.error(`❌ 迁移记录 ${log.id} 失败:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ 成功准备 ${successCount} 条记录`);
    console.log(`❌ 失败 ${errorCount} 条记录`);

    // 3. 保存迁移数据为JSON文件（用于新schema创建后导入）
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');

    const migrationDir = path.join(__dirname, '..', 'backups');
    const migrationFile = path.join(migrationDir, `operation_log_migration_${timestamp}.json`);

    fs.writeFileSync(migrationFile, JSON.stringify({
      migrationDate: new Date().toISOString(),
      originalRecordCount: existingLogs.length,
      migratedRecordCount: successCount,
      errorCount: errorCount,
      data: migratedData
    }, null, 2));

    console.log(`📁 迁移数据已保存: ${migrationFile}`);

    // 4. 生成统计报告
    const stats = {
      total: migratedData.length,
      withMovieResource: migratedData.filter(log => log.resourceType === 'MOVIE').length,
      withTvResource: migratedData.filter(log => log.resourceType === 'TV_SHOW').length,
      withUserResource: migratedData.filter(log => log.resourceType === 'USER').length,
      withActorResource: migratedData.filter(log => log.resourceType === 'ACTOR').length,
      withoutResource: migratedData.filter(log => !log.resourceId).length
    };

    console.log('\n📊 迁移统计:');
    console.log(`  总记录数: ${stats.total}`);
    console.log(`  电影相关: ${stats.withMovieResource}`);
    console.log(`  电视剧相关: ${stats.withTvResource}`);
    console.log(`  用户相关: ${stats.withUserResource}`);
    console.log(`  演员相关: ${stats.withActorResource}`);
    console.log(`  无资源关联: ${stats.withoutResource}`);

    // 5. 生成新schema的插入SQL
    let insertSQL = '-- OperationLog新表数据插入SQL\n';
    insertSQL += '-- 注意：请在新schema创建后执行此脚本\n\n';
    
    migratedData.forEach(log => {
      const values = [
        log.id,
        log.userId,
        `'${log.operatorName.replace(/'/g, "''")}'`,
        `'${log.action.replace(/'/g, "''")}'`,
        `'${log.entityType}'`,
        log.resourceId || 'NULL',
        log.resourceName ? `'${log.resourceName.replace(/'/g, "''")}'` : 'NULL',
        log.resourceType ? `'${log.resourceType}'` : 'NULL',
        log.description ? `'${log.description.replace(/'/g, "''")}'` : 'NULL',
        `'${JSON.stringify(log.metadata).replace(/'/g, "''")}'`,
        `'${log.createdAt.toISOString()}'`
      ];
      
      insertSQL += `INSERT INTO "operation_logs_new" ("id", "userId", "operatorName", "action", "entityType", "resourceId", "resourceName", "resourceType", "description", "metadata", "createdAt") VALUES (${values.join(', ')});\n`;
    });

    const sqlFile = path.join(migrationDir, `operation_log_migration_${timestamp}.sql`);
    fs.writeFileSync(sqlFile, insertSQL);
    console.log(`📁 SQL插入脚本已生成: ${sqlFile}`);

    console.log('\n✅ 数据迁移准备完成!');
    console.log('📝 下一步:');
    console.log('  1. 更新schema.prisma文件');
    console.log('  2. 运行 prisma db push 创建新表结构');
    console.log('  3. 使用生成的SQL文件插入迁移后的数据');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateOperationLogs().catch(console.error);