#!/bin/bash

# 定时任务配置脚本
# 设置每天凌晨3点执行备份任务

# 检查是否已经设置过定时任务
if crontab -l | grep -q "watch-list.*backup"; then
    echo "⚠️  定时任务已存在，正在更新..."
    # 移除现有的备份任务
    crontab -l | grep -v "watch-list.*backup" | crontab -
else
    echo "🔧 正在设置新的定时任务..."
fi

# 获取当前目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 创建cron job条目
CRON_JOB="0 3 * * * cd $PROJECT_DIR && node scripts/task-scheduler.js --backup-now >> /var/log/watch-list-backup.log 2>&1"

# 添加到现有的crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ 定时任务设置完成！"
echo "📅 备份任务将在每天凌晨3点执行"
echo "📁 日志文件：/var/log/watch-list-backup.log"
echo "🔧 手动执行: cd $PROJECT_DIR && node scripts/task-scheduler.js --backup-now"

# 显示当前的crontab
echo ""
echo "📋 当前定时任务："
crontab -l | grep -E "(watch-list|backup|#)"