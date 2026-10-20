<template>
  <div class="instances-page coming-soon-page">
    <div class="coming-soon-placeholder">
      <div class="coming-soon-icon">
        <!-- Minecraft 草方块（等距立方体） -->
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <!-- 顶面：草地 -->
          <polygon points="32,6 60,20 32,34 4,20" fill="#79C05A" />
          <!-- 顶面草色高光 -->
          <polygon points="32,14 42,19 32,24 22,19" fill="#8FCB6A" />
          <!-- 左面：泥土 -->
          <polygon points="4,20 32,34 32,58 4,44" fill="#8B6B47" />
          <!-- 左面草皮边缘 -->
          <polygon points="4,20 32,34 32,40 4,26" fill="#5FA53D" />
          <!-- 左面泥土纹理 -->
          <polygon points="12,32 18,35 18,39 12,36" fill="#7A5C3B" />
          <polygon points="20,41 26,44 26,48 20,45" fill="#7A5C3B" />
          <!-- 右面：泥土（暗面） -->
          <polygon points="32,34 60,20 60,44 32,58" fill="#705234" />
          <!-- 右面草皮边缘 -->
          <polygon points="32,34 60,20 60,26 32,40" fill="#4F8B2F" />
          <!-- 右面泥土纹理 -->
          <polygon points="42,32 48,29 48,33 42,36" fill="#62462C" />
        </svg>
      </div>
      <h2 class="coming-soon-title">{{ $t('instance.manager') }}</h2>
      <p class="coming-soon-desc">{{ $t('instance.comingSoon') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style scoped>
.coming-soon-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.coming-soon-placeholder {
  text-align: center;
  color: var(--voxver-text-secondary);
}

.coming-soon-icon {
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 12px rgb(0 0 0 / 0.18));
}

.coming-soon-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  margin: 0 0 8px;
}

.coming-soon-desc {
  font-size: 14px;
  color: var(--voxver-text-muted);
  margin: 0;
}
</style>