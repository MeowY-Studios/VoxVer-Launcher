
/**
 * 下载服务配置
 */

import { DownloadConfig, DownloadStatus } from "../types/download.types";
import { join } from "path";

// 默认下载配置
export const DEFAULT_DOWNLOAD_CONFIG: DownloadConfig = {
  maxConcurrentDownloads: 5,
  downloadPath: join(process.env.USERPROFILE || process.env.HOME || ".", "Downloads", "VoxVer"),
  retryAttempts: 3,
  timeout: 30000,
  chunkSize: 1024 * 1024 // 1MB
};

// CurseForge API 配置
export const CURSEFORGE_API_CONFIG = {
  baseUrl: "https://api.curseforge.com/v1",
  apiKey: process.env.CURSEFORGE_API_KEY || "",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.CURSEFORGE_API_KEY || ""
  }
};

// Modrinth API 配置
export const MODRINTH_API_CONFIG = {
  baseUrl: "https://api.modrinth.com/v2",
  headers: {
    "Content-Type": "application/json"
  }
};

// 下载文件类型映射
export const DOWNLOAD_FILE_TYPES = {
  MOD: "mod",
  RESOURCE_PACK: "resourcepack",
  SHADER: "shader",
  WORLD: "world",
  DATA_PACK: "datapack",
  MODPACK: "modpack"
};

// 下载优先级
export const DOWNLOAD_PRIORITY = {
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
};

// 下载状态消息
export const DOWNLOAD_STATUS_MESSAGES: Record<DownloadStatus, string> = {
  'pending': "等待下载",
  'queued': "已加入队列",
  'downloading': "下载中",
  'paused': "已暂停",
  'completed': "下载完成",
  'failed': "下载失败",
  'cancelled': "已取消",
  'error': "下载错误"
};

// 下载错误代码
export const DOWNLOAD_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  INVALID_URL: "INVALID_URL",
  DOWNLOAD_CANCELLED: "DOWNLOAD_CANCELLED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
};

