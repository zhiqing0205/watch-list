#!/usr/bin/env node

/**
 * 定时任务管理器
 * 管理所有的定时任务，包括数据库备份
 */

const cron = require('node-cron');
const { scheduledBackup } = require('./scheduled-backup');

class TaskScheduler {
  constructor() {
    this.tasks = new Map();
  }

  // 启动所有定时任务
  start() {
    console.log('🚀 启动定时任务管理器...');

    // 数据库备份任务 - 每天凌晨3点执行
    const backupTask = cron.schedule('0 3 * * *', async () => {
      console.log('⏰ 开始执行定时备份任务...');
      try {
        await scheduledBackup();
        console.log('✅ 定时备份任务执行完成');
      } catch (error) {
        console.error('❌ 定时备份任务失败:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.tasks.set('backup', backupTask);

    // 启动任务
    backupTask.start();
    console.log('📅 数据库备份任务已启动 (每天凌晨3点执行)');

    // 可以添加更多定时任务
    // 例如：清理临时文件、同步TMDB数据等

    return this;
  }

  // 停止所有任务
  stop() {
    console.log('🛑 停止所有定时任务...');
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`⏹️  已停止任务: ${name}`);
    });
  }

  // 手动执行备份任务
  async runBackupNow() {
    console.log('🔧 手动执行备份任务...');
    try {
      await scheduledBackup();
      console.log('✅ 手动备份完成');
    } catch (error) {
      console.error('❌ 手动备份失败:', error.message);
      throw error;
    }
  }

  // 获取任务状态
  getStatus() {
    const status = {};
    this.tasks.forEach((task, name) => {
      status[name] = {
        running: task.running || false,
        options: task.options || {}
      };
    });
    return status;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const scheduler = new TaskScheduler();
  
  // 处理命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--backup-now')) {
    // 立即执行备份
    scheduler.runBackupNow().catch(error => {
      console.error('备份失败:', error);
      process.exit(1);
    });
  } else if (args.includes('--start')) {
    // 启动定时任务
    scheduler.start();
    
    // 保持进程运行
    process.on('SIGINT', () => {
      console.log('\n📛 收到停止信号，正在关闭定时任务...');
      scheduler.stop();
      process.exit(0);
    });
    
    console.log('✅ 定时任务管理器正在运行中... (按 Ctrl+C 停止)');
  } else {
    console.log('📖 使用说明:');
    console.log('  node scripts/task-scheduler.js --start        # 启动定时任务');
    console.log('  node scripts/task-scheduler.js --backup-now  # 立即执行备份');
  }
}

module.exports = TaskScheduler;