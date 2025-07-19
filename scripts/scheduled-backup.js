#!/usr/bin/env node

/**
 * 定时数据库备份脚本 - 支持OSS上传
 * 每天凌晨3点执行，备份数据并上传到阿里云OSS
 */

const { PrismaClient } = require('@prisma/client');
const OSS = require('ali-oss');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// OSS配置
const ossClient = new OSS({
  region: process.env.OSS_REGION || 'oss-cn-hongkong',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET_NAME || 'watch-list'
});

// 创建备份目录
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function scheduledBackup() {
  const startTime = new Date();
  console.log(`🕒 [${startTime.toISOString()}] 开始定时备份任务...`);
  
  try {
    // 生成日期标识
    const dateStr = startTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const timestamp = startTime.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');

    // 1. 获取所有数据
    console.log('📊 正在收集数据...');
    const [users, movies, tvShows, actors, movieCast, tvCast, movieReviews, tvReviews, operationLogs] = await Promise.all([
      prisma.user.findMany(),
      prisma.movie.findMany(),
      prisma.tvShow.findMany(),
      prisma.actor.findMany(),
      prisma.movieCast.findMany(),
      prisma.tvCast.findMany(),
      prisma.movieReview.findMany(),
      prisma.tvReview.findMany(),
      prisma.operationLog.findMany()
    ]);

    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
    const jsonBackupFile = path.join(backupDir, `backup_${timestamp}.json`);

    // 2. 生成SQL备份
    console.log('💾 生成SQL备份...');
    let sqlContent = `-- Scheduled Database Backup
-- Created: ${startTime.toISOString()}
-- Date: ${dateStr}

SET session_replication_role = replica;

-- Clear existing data
TRUNCATE TABLE "operation_logs", "tv_reviews", "movie_reviews", "tv_cast", "movie_cast", "actors", "tv_shows", "movies", "users" RESTART IDENTITY CASCADE;

`;

    // 转义和格式化函数
    const escapeSQLString = (str) => {
      if (str === null || str === undefined) return 'NULL';
      return `'${str.toString().replace(/'/g, "''")}'`;
    };

    const formatDate = (date) => {
      if (!date) return 'NULL';
      return `'${new Date(date).toISOString()}'`;
    };

    const formatArray = (arr) => {
      if (!arr || arr.length === 0) return "'{}'";
      return `'{${arr.map(item => `"${item.replace(/"/g, '\\"')}"`).join(',')}}'`;
    };

    const formatJSON = (obj) => {
      if (!obj) return 'NULL';
      return `'${JSON.stringify(obj).replace(/'/g, "''")}'`;
    };

    // 插入Users
    if (users.length > 0) {
      sqlContent += '-- Insert Users\n';
      users.forEach(user => {
        sqlContent += `INSERT INTO "users" ("id", "username", "email", "name", "password", "role", "isActive", "lastLoginAt", "createdAt", "updatedAt") VALUES (${user.id}, ${escapeSQLString(user.username)}, ${escapeSQLString(user.email)}, ${escapeSQLString(user.name)}, ${escapeSQLString(user.password)}, ${escapeSQLString(user.role)}, ${user.isActive}, ${formatDate(user.lastLoginAt)}, ${formatDate(user.createdAt)}, ${formatDate(user.updatedAt)});\n`;
      });
      sqlContent += '\n';
    }

    // 插入Movies
    if (movies.length > 0) {
      sqlContent += '-- Insert Movies\n';
      movies.forEach(movie => {
        sqlContent += `INSERT INTO "movies" ("id", "tmdbId", "title", "originalTitle", "overview", "releaseDate", "runtime", "genres", "posterPath", "backdropPath", "posterUrl", "backdropUrl", "imdbId", "doubanRating", "tmdbRating", "watchStatus", "summary", "playUrl", "isVisible", "createdAt", "updatedAt") VALUES (${movie.id}, ${movie.tmdbId}, ${escapeSQLString(movie.title)}, ${escapeSQLString(movie.originalTitle)}, ${escapeSQLString(movie.overview)}, ${formatDate(movie.releaseDate)}, ${movie.runtime || 'NULL'}, ${formatArray(movie.genres)}, ${escapeSQLString(movie.posterPath)}, ${escapeSQLString(movie.backdropPath)}, ${escapeSQLString(movie.posterUrl)}, ${escapeSQLString(movie.backdropUrl)}, ${escapeSQLString(movie.imdbId)}, ${movie.doubanRating || 'NULL'}, ${movie.tmdbRating || 'NULL'}, ${escapeSQLString(movie.watchStatus)}, ${escapeSQLString(movie.summary)}, ${escapeSQLString(movie.playUrl)}, ${movie.isVisible}, ${formatDate(movie.createdAt)}, ${formatDate(movie.updatedAt)});\n`;
      });
      sqlContent += '\n';
    }

    // 插入TV Shows
    if (tvShows.length > 0) {
      sqlContent += '-- Insert TV Shows\n';
      tvShows.forEach(tv => {
        sqlContent += `INSERT INTO "tv_shows" ("id", "tmdbId", "name", "originalName", "overview", "firstAirDate", "lastAirDate", "numberOfSeasons", "numberOfEpisodes", "genres", "posterPath", "backdropPath", "posterUrl", "backdropUrl", "imdbId", "doubanRating", "tmdbRating", "watchStatus", "summary", "playUrl", "isVisible", "createdAt", "updatedAt") VALUES (${tv.id}, ${tv.tmdbId}, ${escapeSQLString(tv.name)}, ${escapeSQLString(tv.originalName)}, ${escapeSQLString(tv.overview)}, ${formatDate(tv.firstAirDate)}, ${formatDate(tv.lastAirDate)}, ${tv.numberOfSeasons || 'NULL'}, ${tv.numberOfEpisodes || 'NULL'}, ${formatArray(tv.genres)}, ${escapeSQLString(tv.posterPath)}, ${escapeSQLString(tv.backdropPath)}, ${escapeSQLString(tv.posterUrl)}, ${escapeSQLString(tv.backdropUrl)}, ${escapeSQLString(tv.imdbId)}, ${tv.doubanRating || 'NULL'}, ${tv.tmdbRating || 'NULL'}, ${escapeSQLString(tv.watchStatus)}, ${escapeSQLString(tv.summary)}, ${escapeSQLString(tv.playUrl)}, ${tv.isVisible}, ${formatDate(tv.createdAt)}, ${formatDate(tv.updatedAt)});\n`;
      });
      sqlContent += '\n';
    }

    // 插入Actors
    if (actors.length > 0) {
      sqlContent += '-- Insert Actors\n';
      actors.forEach(actor => {
        sqlContent += `INSERT INTO "actors" ("id", "tmdbId", "name", "originalName", "biography", "birthday", "deathday", "gender", "profilePath", "profileUrl", "createdAt", "updatedAt") VALUES (${actor.id}, ${actor.tmdbId}, ${escapeSQLString(actor.name)}, ${escapeSQLString(actor.originalName)}, ${escapeSQLString(actor.biography)}, ${formatDate(actor.birthday)}, ${formatDate(actor.deathday)}, ${actor.gender || 'NULL'}, ${escapeSQLString(actor.profilePath)}, ${escapeSQLString(actor.profileUrl)}, ${formatDate(actor.createdAt)}, ${formatDate(actor.updatedAt)});\n`;
      });
      sqlContent += '\n';
    }

    // 插入Movie Cast
    if (movieCast.length > 0) {
      sqlContent += '-- Insert Movie Cast\n';
      movieCast.forEach(cast => {
        sqlContent += `INSERT INTO "movie_cast" ("id", "movieId", "actorId", "character", "order") VALUES (${cast.id}, ${cast.movieId}, ${cast.actorId}, ${escapeSQLString(cast.character)}, ${cast.order || 'NULL'});\n`;
      });
      sqlContent += '\n';
    }

    // 插入TV Cast
    if (tvCast.length > 0) {
      sqlContent += '-- Insert TV Cast\n';
      tvCast.forEach(cast => {
        sqlContent += `INSERT INTO "tv_cast" ("id", "tvShowId", "actorId", "character", "order") VALUES (${cast.id}, ${cast.tvShowId}, ${cast.actorId}, ${escapeSQLString(cast.character)}, ${cast.order || 'NULL'});\n`;
      });
      sqlContent += '\n';
    }

    // 插入Movie Reviews
    if (movieReviews.length > 0) {
      sqlContent += '-- Insert Movie Reviews\n';
      movieReviews.forEach(review => {
        sqlContent += `INSERT INTO "movie_reviews" ("id", "movieId", "userId", "rating", "review", "createdAt", "updatedAt") VALUES (${review.id}, ${review.movieId}, ${review.userId}, ${review.rating || 'NULL'}, ${escapeSQLString(review.review)}, ${formatDate(review.createdAt)}, ${formatDate(review.updatedAt)});\n`;
      });
      sqlContent += '\n';
    }

    // 插入TV Reviews
    if (tvReviews.length > 0) {
      sqlContent += '-- Insert TV Reviews\n';
      tvReviews.forEach(review => {
        sqlContent += `INSERT INTO "tv_reviews" ("id", "tvShowId", "userId", "rating", "review", "createdAt", "updatedAt") VALUES (${review.id}, ${review.tvShowId}, ${review.userId}, ${review.rating || 'NULL'}, ${escapeSQLString(review.review)}, ${formatDate(review.createdAt)}, ${formatDate(review.updatedAt)});\n`;
      });
      sqlContent += '\n';
    }

    // 插入Operation Logs (新字段结构)
    if (operationLogs.length > 0) {
      sqlContent += '-- Insert Operation Logs\n';
      operationLogs.forEach(log => {
        sqlContent += `INSERT INTO "operation_logs" ("id", "userId", "operatorName", "action", "entityType", "resourceId", "resourceName", "resourceType", "description", "metadata", "createdAt") VALUES (${log.id}, ${log.userId}, ${escapeSQLString(log.operatorName)}, ${escapeSQLString(log.action)}, ${escapeSQLString(log.entityType)}, ${log.resourceId || 'NULL'}, ${escapeSQLString(log.resourceName)}, ${escapeSQLString(log.resourceType)}, ${escapeSQLString(log.description)}, ${formatJSON(log.metadata)}, ${formatDate(log.createdAt)});\n`;
      });
      sqlContent += '\n';
    }

    // 更新序列
    sqlContent += `-- Update sequences
SELECT setval('"users_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "users"));
SELECT setval('"movies_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "movies"));
SELECT setval('"tv_shows_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "tv_shows"));
SELECT setval('"actors_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "actors"));
SELECT setval('"movie_cast_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "movie_cast"));
SELECT setval('"tv_cast_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "tv_cast"));
SELECT setval('"movie_reviews_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "movie_reviews"));
SELECT setval('"tv_reviews_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "tv_reviews"));
SELECT setval('"operation_logs_id_seq"', (SELECT COALESCE(MAX("id"), 1) FROM "operation_logs"));

SET session_replication_role = DEFAULT;
`;

    // 3. 写入本地文件
    fs.writeFileSync(backupFile, sqlContent);

    // 4. 创建JSON备份
    const jsonData = {
      backupDate: startTime.toISOString(),
      version: '2.0',
      schema: 'refactored',
      stats: {
        users: users.length,
        movies: movies.length,
        tvShows: tvShows.length,
        actors: actors.length,
        movieCast: movieCast.length,
        tvCast: tvCast.length,
        movieReviews: movieReviews.length,
        tvReviews: tvReviews.length,
        operationLogs: operationLogs.length
      },
      data: {
        users, movies, tvShows, actors, movieCast, tvCast, movieReviews, tvReviews, operationLogs
      }
    };
    fs.writeFileSync(jsonBackupFile, JSON.stringify(jsonData, null, 2));

    // 5. 上传到OSS
    console.log('☁️  上传备份到OSS...');
    
    const ossDir = `backup/${dateStr}`;
    const sqlFileName = `backup_${timestamp}.sql`;
    const jsonFileName = `backup_${timestamp}.json`;

    try {
      // 上传SQL文件
      const sqlUploadResult = await ossClient.put(`${ossDir}/${sqlFileName}`, backupFile);
      console.log(`✅ SQL备份上传成功: ${sqlUploadResult.url}`);

      // 上传JSON文件
      const jsonUploadResult = await ossClient.put(`${ossDir}/${jsonFileName}`, jsonBackupFile);
      console.log(`✅ JSON备份上传成功: ${jsonUploadResult.url}`);

      // 6. 记录备份操作到操作日志
      await prisma.operationLog.create({
        data: {
          userId: 1, // 系统用户
          operatorName: 'SYSTEM',
          action: 'SCHEDULED_BACKUP',
          entityType: 'SYSTEM',
          resourceType: 'DATABASE',
          description: `定时备份完成，包含 ${jsonData.stats.movies} 部电影，${jsonData.stats.tvShows} 部电视剧，${jsonData.stats.actors} 位演员`,
          metadata: {
            backupDate: dateStr,
            sqlFile: `${ossDir}/${sqlFileName}`,
            jsonFile: `${ossDir}/${jsonFileName}`,
            stats: jsonData.stats,
            duration: new Date() - startTime
          }
        }
      });

      // 7. 清理本地文件（可选，保留最近3天的备份）
      const localFiles = fs.readdirSync(backupDir);
      const backupFiles = localFiles.filter(file => 
        file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.json'))
      );

      if (backupFiles.length > 6) { // 保留最近3天的备份（SQL + JSON）
        const sortedFiles = backupFiles
          .map(file => ({
            name: file,
            path: path.join(backupDir, file),
            mtime: fs.statSync(path.join(backupDir, file)).mtime
          }))
          .sort((a, b) => b.mtime - a.mtime);

        const filesToDelete = sortedFiles.slice(6);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️  已删除旧备份: ${file.name}`);
        });
      }

      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log(`🎉 定时备份任务完成!`);
      console.log(`📊 备份统计:`);
      console.log(`  用户: ${users.length} 条`);
      console.log(`  电影: ${movies.length} 条`);
      console.log(`  电视剧: ${tvShows.length} 条`);
      console.log(`  演员: ${actors.length} 条`);
      console.log(`  操作日志: ${operationLogs.length} 条`);
      console.log(`⏱️  总耗时: ${duration} 秒`);

    } catch (ossError) {
      console.error('❌ OSS上传失败:', ossError.message);
      throw ossError;
    }

  } catch (error) {
    console.error('❌ 备份任务失败:', error);
    
    // 记录错误到操作日志
    try {
      await prisma.operationLog.create({
        data: {
          userId: 1,
          operatorName: 'SYSTEM',
          action: 'BACKUP_FAILED',
          entityType: 'SYSTEM',
          resourceType: 'DATABASE',
          description: `定时备份失败: ${error.message}`,
          metadata: {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.error('❌ 记录错误日志失败:', logError);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 检查是否直接执行
if (require.main === module) {
  scheduledBackup().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { scheduledBackup };