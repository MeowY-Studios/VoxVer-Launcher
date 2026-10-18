/**
 * PxConfirm 组件 Props 类型（独立文件以便外部具名导入）
 */
export interface PxConfirmProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}
