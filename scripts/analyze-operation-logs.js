#!/usr/bin/env node

/**
 * OperationLog表重构方案分析
 * 分析当前OperationLog的使用情况，制定重构计划
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function analyzeOperationLogs() {
  console.log('📊 分析OperationLog表的使用情况...');
  
  try {
    // 1. 获取所有操作日志
    const allLogs = await prisma.operationLog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 总操作日志数量: ${allLogs.length}`);

    // 2. 按操作类型分组统计
    const actionStats = {};
    const entityTypeStats = {};
    const linkedStats = {
      withMovieId: 0,
      withTvShowId: 0,
      withBoth: 0,
      withNone: 0
    };

    allLogs.forEach(log => {
      // 操作类型统计
      actionStats[log.action] = (actionStats[log.action] || 0) + 1;
      
      // 实体类型统计
      entityTypeStats[log.entityType] = (entityTypeStats[log.entityType] || 0) + 1;
      
      // 关联统计
      if (log.movieId && log.tvShowId) {
        linkedStats.withBoth++;
      } else if (log.movieId) {
        linkedStats.withMovieId++;
      } else if (log.tvShowId) {
        linkedStats.withTvShowId++;
      } else {
        linkedStats.withNone++;
      }
    });

    console.log('\n📈 操作类型统计:');
    Object.entries(actionStats).forEach(([action, count]) => {
      console.log(`  ${action}: ${count} 次`);
    });

    console.log('\n📈 实体类型统计:');
    Object.entries(entityTypeStats).forEach(([entityType, count]) => {
      console.log(`  ${entityType}: ${count} 次`);
    });

    console.log('\n📈 关联情况统计:');
    console.log(`  仅关联电影: ${linkedStats.withMovieId} 条`);
    console.log(`  仅关联电视剧: ${linkedStats.withTvShowId} 条`);
    console.log(`  同时关联两者: ${linkedStats.withBoth} 条`);
    console.log(`  无关联: ${linkedStats.withNone} 条`);

    // 3. 分析具体的日志内容
    console.log('\n🔍 分析具体日志内容...');
    
    // 获取最近10条日志作为样本
    const recentLogs = allLogs.slice(0, 10);
    console.log('\n📝 最近10条日志样本:');
    recentLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.createdAt.toISOString().substring(0, 10)} | ${log.action} | ${log.entityType} | ${log.description || 'No description'}`);
    });

    // 4. 分析哪些描述包含了具体的影视剧信息
    const descriptionsWithTitles = allLogs.filter(log => 
      log.description && (
        log.description.includes('电影') || 
        log.description.includes('电视剧') ||
        log.description.includes('剧集') ||
        log.description.includes('《') ||
        log.description.includes('影片')
      )
    );

    console.log(`\n📚 包含影视剧信息的描述: ${descriptionsWithTitles.length} 条`);

    // 5. 生成重构方案
    const refactorPlan = {
      current_schema: {
        problems: [
          "movieId和tvShowId字段直接关联具体影视剧",
          "删除影视剧时可能导致操作日志关联失效",
          "操作日志应该是历史记录，不应该受影视剧删除影响"
        ]
      },
      proposed_schema: {
        changes: [
          "移除movieId和tvShowId外键关联",
          "在description中包含影视剧名称和ID信息",
          "添加resourceId和resourceName字段存储被操作对象的标识",
          "保持action、entityType、description字段用于记录操作详情"
        ],
        new_fields: {
          resourceId: "被操作资源的ID（不作为外键）",
          resourceName: "被操作资源的名称（电影/电视剧标题）",
          resourceType: "资源类型（MOVIE, TV_SHOW, ACTOR等）",
          operatorId: "操作员ID（保持外键关联到User）",
          operatorName: "操作员名称（冗余字段，避免用户删除后信息丢失）"
        }
      },
      migration_steps: [
        "1. 备份当前OperationLog数据",
        "2. 创建新的schema结构",
        "3. 迁移现有数据到新结构",
        "4. 更新应用代码以使用新的字段",
        "5. 移除旧的外键字段"
      ]
    };

    // 6. 保存分析报告
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');

    const reportData = {
      analysis_date: new Date().toISOString(),
      total_logs: allLogs.length,
      action_stats: actionStats,
      entity_type_stats: entityTypeStats,
      linked_stats: linkedStats,
      recent_logs_sample: recentLogs.slice(0, 5).map(log => ({
        action: log.action,
        entityType: log.entityType,
        description: log.description,
        movieId: log.movieId,
        tvShowId: log.tvShowId,
        createdAt: log.createdAt
      })),
      refactor_plan: refactorPlan
    };

    const reportDir = path.join(__dirname, '..', 'backups');
    const reportFile = path.join(reportDir, `operation_log_analysis_${timestamp}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

    console.log(`\n📋 分析报告已保存: ${reportFile}`);
    console.log('\n✅ OperationLog分析完成!');

    return refactorPlan;

  } catch (error) {
    console.error('❌ 分析失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

analyzeOperationLogs().catch(console.error);