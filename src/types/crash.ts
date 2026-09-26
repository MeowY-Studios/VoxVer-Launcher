/**
 * 崩溃报告类型定义
 * 前后端统一使用此类型
 */
export interface CrashReport {
  id: string
  instanceId: string
  time: string // ISO string
  minecraftVersion: string
  javaVersion: string
  operatingSystem: string

  // 崩溃原因
  crashCause: {
    exception: string
    message: string
    stackTrace: string[]
  }

  // 附加信息
  description: string
  possibleCauses: string[]
  suggestedSolutions: string[]

  // 原始数据
  rawContent: string
}

/**
 * 崩溃分析诊断报告
 */
export interface CrashDiagnosis {
  report: CrashReport
  diagnosis: {
    summary: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
    recommendations: string[]
  }
  similarCrashes?: CrashReport[]
}

/**
 * 崩溃历史列表项（简化版）
 */
export interface CrashHistoryItem {
  id: string
  instanceId: string
  time: string
  minecraftVersion: string
  cause: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}
