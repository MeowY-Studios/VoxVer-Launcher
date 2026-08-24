<template>
  <div class="instance-detail">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <button class="back-btn" @click="$router.push('/instances')">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {{ $t('instance.backToList') }}
      </button>

      <h2 v-if="instance" class="instance-name">{{ instance.name }}</h2>
      <span v-else class="loading-placeholder">{{ $t('download.loading') }}</span>

      <div v-if="instance" class="header-actions">
        <button class="action-btn" @click="launchGame" :title="$t('instance.launch')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button class="action-btn" @click="openShareModal" :title="$t('instance.share')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        <button
          class="action-btn"
          :class="{ active: instance.isFavorited === 1 }"
          @click="toggleFavorite"
          :title="$t('instance.favorite')"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            :fill="instance.isFavorited ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </button>
        <button class="action-btn" @click="openFolder" :title="$t('instance.openFolder')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </button>
        <button class="action-btn danger" @click="deleteInstance" :title="$t('instance.delete')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="!instance && !error" class="detail-loading">
      <div class="spinner"></div>
      <p>{{ $t('instance.loadingInfo') }}</p>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="detail-error">
      <p>{{ error }}</p>
      <button class="vox-btn vox-btn--primary" @click="fetchDetail">{{ $t('common.retry') }}</button>
    </div>

    <!-- 实例详情内容 -->
    <div v-if="instance" class="detail-content">
      <!-- Tab 导航 -->
      <nav class="tab-nav">
        <button class="tab-btn" :class="{ active: detailTab === 'overview' }" @click="detailTab = 'overview'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          {{ t('instance.tabOverview') }}
        </button>
        <button class="tab-btn" :class="{ active: detailTab === 'mods' }" @click="detailTab = 'mods'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2" />
          </svg>
          {{ t('instance.tabMods') }}
          <span v-if="modUpdatesAvailable > 0" class="tab-badge update">{{ modUpdatesAvailable }}</span>
          <span v-else class="tab-count" v-if="localMods.length > 0">{{ localMods.length }}</span>
        </button>
        <button class="tab-btn" :class="{ active: detailTab === 'resourcepacks' }" @click="detailTab = 'resourcepacks'; loadResourcePacks()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          {{ t('instance.tabResourcePacks') }}
        </button>
        <button class="tab-btn" :class="{ active: detailTab === 'shaderpacks' }" @click="detailTab = 'shaderpacks'; loadShaderPacks()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          {{ t('instance.tabShaderPacks') }}
        </button>
        <button class="tab-btn" :class="{ active: detailTab === 'saves' }" @click="detailTab = 'saves'; loadSaves()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {{ t('instance.tabSaves') }}
        </button>
      </nav>

      <!-- ============================================== -->
      <!-- 概览 Tab：基本信息 + Java/内存 + 磁盘占用      -->
      <!-- ============================================== -->
      <template v-if="detailTab === 'overview'">
      <!-- 基本信息卡片 -->
      <section class="info-section vox-card">
        <div class="section-header">
          <h3 class="section-title">{{ $t('instance.basicInfo') }}</h3>
          <button class="save-btn vox-btn vox-btn--primary" @click="saveBasicInfo" :disabled="savingBasic">
            {{ savingBasic ? $t('common.saving') : $t('common.save') }}
          </button>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>{{ $t('instance.instanceNameLabel') }}</label>
            <input v-model="editForm.name" class="edit-input vox-input" />
          </div>
          <div class="info-item">
            <label>{{ $t('instance.mcVersionLabel') }}</label>
            <input v-model="editForm.mcVersion" class="edit-input vox-input" placeholder="1.20.4" />
          </div>
          <div class="info-item">
            <label>{{ $t('instance.loaderLabel') }}</label>
            <select class="vox-input" v-model="editForm.loaderType">
              <option value="vanilla">{{ $t('instance.vanillaOption') }}</option>
              <option value="fabric">Fabric</option>
              <option value="forge">Forge</option>
              <option value="neoforge">NeoForge</option>
              <option value="quilt">Quilt</option>
            </select>
          </div>
          <div class="info-item">
            <label>{{ $t('instance.loaderVersionLabel') }}</label>
            <input v-model="editForm.loaderVersion" class="edit-input vox-input" placeholder="0.15.11" />
          </div>
          <div class="info-item">
            <label>{{ $t('instance.gameDirectory') }}</label>
            <span class="value path-value" :title="instance.path">{{ instance.path || $t('common.noData') }}</span>
          </div>
          <div class="info-item">
            <label>{{ $t('game.resolution') }}</label>
            <div class="resolution-inputs">
              <input v-model.number="editForm.width" type="number" min="640" class="edit-input number-input vox-input" />
              <span class="resolution-x">x</span>
              <input v-model.number="editForm.height" type="number" min="480" class="edit-input number-input vox-input" />
            </div>
          </div>
          <div class="info-item">
            <label>{{ $t('game.fullscreen') }}</label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="editForm.fullscreen" />
              {{ $t('game.fullscreenEnable') }}
            </label>
          </div>
          <div class="info-item">
            <label>{{ $t('instance.lastPlayed') }}</label>
            <span class="value">{{ formatLastPlayed }}</span>
          </div>
          <div class="info-item">
            <label>{{ $t('instance.playDuration') }}</label>
            <span class="value">{{ playTimeStr }}</span>
          </div>
        </div>
      </section>

      <!-- Java / 内存设置 -->
      <section class="info-section vox-card">
        <h3 class="section-title">{{ $t('settings.gameJava') }} & {{ $t('settings.memory') }}</h3>
        <div class="info-grid">
          <div class="info-item full-width">
            <label>{{ $t('game.javaPath') }}</label>
            <input
              type="text"
              v-model="editForm.javaPath"
              :placeholder="$t('settings.autoSelect')"
              class="edit-input vox-input"
            />
          </div>
          <div class="info-item">
            <label>{{ $t('game.minMemory') }} (MB)</label>
            <input
              type="number"
              v-model.number="editForm.minMemory"
              min="256"
              step="256"
              class="edit-input number-input vox-input"
            />
          </div>
          <div class="info-item">
            <label>{{ $t('game.maxMemory') }} (MB)</label>
            <input
              type="number"
              v-model.number="editForm.maxMemory"
              min="512"
              step="512"
              class="edit-input number-input"
            />
          </div>
          <div class="info-item full-width">
            <label>{{ $t('settings.jvmArgs') }}</label>
            <input
              type="text"
              v-model="editForm.jvmArgs"
              placeholder="-Xmn128m ..."
              class="edit-input"
            />
          </div>
        </div>
        <button class="save-btn" @click="saveSettings" :disabled="saving">
          {{ saving ? $t('common.saving') : $t('instance.saveSettingsBtn') }}
        </button>
      </section>

      <!-- 磁盘占用 + 配置文件 -->
      <section class="info-section vox-card">
        <div class="section-header">
          <h3 class="section-title">{{ t('instance.diskUsage') }}</h3>
          <button class="icon-btn" @click="loadDiskUsage" :title="t('common.refresh')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
        <div v-if="diskUsageLoading" class="mod-loading">
          <div class="spinner-sm"></div>
          <span>{{ t('common.loading') }}</span>
        </div>
        <div v-else class="disk-grid">
          <div class="disk-total">
            <span class="disk-label">{{ t('instance.totalSize') }}</span>
            <span class="disk-big">{{ formatFileSize(diskUsage.total || 0) }}</span>
          </div>
          <div class="disk-bar">
            <div class="disk-bar-fill" :style="{ width: diskPercent.toFixed(1) + '%' }"></div>
          </div>
          <div class="disk-parts">
            <div class="disk-part">
              <span class="dot" style="background: var(--voxver-primary-500)"></span>
              {{ t('instance.modsDir') }}：{{ formatFileSize(diskUsage.mods || 0) }}
            </div>
            <div class="disk-part">
              <span class="dot" style="background: var(--voxver-accent)"></span>
              {{ t('instance.savesDir') }}：{{ formatFileSize(diskUsage.saves || 0) }}
            </div>
            <div class="disk-part">
              <span class="dot" style="background: var(--voxver-warning)"></span>
              {{ t('instance.resourcePacks') }}：{{ formatFileSize(diskUsage.resourcepacks || 0) }}
            </div>
            <div class="disk-part">
              <span class="dot" style="background: var(--voxver-info)"></span>
              {{ t('instance.shaderPacks') }}：{{ formatFileSize(diskUsage.shaderpacks || 0) }}
            </div>
            <div class="disk-part">
              <span class="dot" style="background: var(--voxver-text-muted)"></span>
              {{ t('instance.otherDir') }}：{{ formatFileSize(diskUsage.others || 0) }}
            </div>
          </div>
        </div>
      </section>

      <!-- 配置文件列表（概览 Tab 内快速入口） -->
      <section class="info-section vox-card">
        <div class="section-header">
          <h3 class="section-title">{{ $t('instance.configFiles') }}</h3>
          <div class="section-actions">
            <button class="icon-btn" @click="loadConfigFiles" :title="$t('common.refresh')">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
            </button>
            <button class="icon-btn" @click="openConfigDir" :title="$t('game.configs') + ' ' + $t('game.gameDir')">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="configFilesLoading" class="mod-loading">
          <div class="spinner-sm"></div>
          <span>{{ $t('common.loading') }}</span>
        </div>
        <div v-else-if="configFiles.length === 0" class="empty-state small">
          <p>{{ $t('instance.noConfigFiles') }}</p>
        </div>
        <div v-else class="config-list">
          <div
            v-for="cfg in configFiles"
            :key="cfg.path"
            class="config-item"
            @click="openConfigEditor(cfg)"
          >
            <div class="config-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div class="config-info">
              <span class="config-name">{{ cfg.name }}</span>
              <span class="config-meta"
                >{{ formatFileSize(cfg.size) }} · {{ formatDate(cfg.modified) }}</span
              >
            </div>
            <button class="edit-icon-btn" @click.stop="openConfigEditor(cfg)" :title="$t('instance.editConfig')">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
      </section>
      </template>

      <!-- ============================================== -->
      <!-- Mod Tab：Mod 列表 + Mod 更新检测               -->
      <!-- ============================================== -->
      <template v-if="detailTab === 'mods'">
      <section class="info-section vox-card">
        <div class="section-header">
          <h3 class="section-title">
            {{ $t('instance.installedMods') }}
            <span class="mod-count" v-if="localMods.length > 0"
              >({{ activeModCount }}/{{ localMods.length }})</span
            >
          </h3>
          <div class="section-actions">
            <button
              class="check-update-btn vox-btn vox-btn--ghost"
              :disabled="modsUpdateLoading || localMods.length === 0"
              @click="checkModUpdates"
            >
              <svg v-if="!modsUpdateLoading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              <svg v-else width="14" height="14" class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="9" stroke-opacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" />
              </svg>
              {{ modsUpdateLoading ? t('instance.checkingUpdates') : t('instance.checkUpdates') }}
            </button>
            <button class="icon-btn" @click="refreshMods" :title="$t('common.refresh')">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
            </button>
            <button class="icon-btn" @click="openModsFolder" :title="$t('mod.mods') + ' ' + $t('game.gameDir')">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </button>
            <button class="icon-btn" @click="openConfigDir" :title="$t('game.configs') + ' ' + $t('game.gameDir')">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-if="modsLoading" class="mod-loading">
          <div class="spinner-sm"></div>
          <span>{{ $t('common.loading') }}</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="localMods.length === 0" class="empty-state">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--voxver-text-muted)"
            stroke-width="1.5"
          >
            <path
              d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
            />
          </svg>
          <p>{{ $t('instance.noModsInstalled') }}</p>
          <router-link to="/downloads" class="link-btn">{{ $t('instance.goDownloadMods') }}</router-link>
        </div>

        <!-- Mod 列表 -->
        <div v-else class="mod-list">
          <div
            v-for="mod in localMods"
            :key="mod.filePath"
            class="mod-item"
            :class="{ 'mod-disabled': mod.status === 'disabled', 'mod-outdated': mod.latestVersion && mod.latestVersion !== mod.version }"
          >
            <div class="mod-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2" />
              </svg>
            </div>
            <div class="mod-info">
              <span class="mod-name">{{ mod.displayName || mod.fileName }}</span>
              <span class="mod-meta">
                <span v-if="mod.version" class="mod-version">v{{ mod.version }}</span>
                <span v-if="mod.latestVersion" class="mod-version mod-version-new">→ v{{ mod.latestVersion }}</span>
                <span v-if="mod.author" class="mod-author">{{ mod.author }}</span>
                <span class="mod-size">{{ formatFileSize(mod.fileSize) }}</span>
              </span>
            </div>
            <div class="mod-actions">
              <span class="status-badge" :class="'status-' + mod.status">
                {{ statusLabel(mod.status) }}
              </span>
              <button
                class="toggle-btn"
                @click="toggleMod(mod)"
                :title="mod.status === 'active' ? $t('mod.disable') : $t('mod.enable')"
              >
                <svg
                  v-if="mod.status === 'active'"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg
                  v-else
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                class="toggle-btn delete-btn"
                @click="deleteModItem(mod)"
                :title="$t('instance.delete')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      </template>

      <!-- ============================================== -->
      <!-- 资源包 Tab                                     -->
      <!-- ============================================== -->
      <template v-if="detailTab === 'resourcepacks'">
        <section class="info-section vox-card pack-section">
          <div class="section-header">
            <h3 class="section-title">{{ t('instance.tabResourcePacks') }} <span class="mod-count" v-if="resourcePacks.length">({{ resourcePacks.length }})</span></h3>
            <div class="section-actions">
              <button class="icon-btn" @click="loadResourcePacks" :title="t('common.refresh')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
              <button class="icon-btn" @click="openInstanceSubdir('resourcepacks')" :title="t('instance.openFolder')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="resourcePacksLoading" class="mod-loading">
            <div class="spinner-sm"></div><span>{{ t('common.loading') }}</span>
          </div>
          <div v-else-if="resourcePacks.length === 0" class="empty-state small">
            <p>{{ t('instance.noPacks') }}</p>
          </div>
          <div v-else class="pack-list">
            <div v-for="p in resourcePacks" :key="p.filename" class="pack-item" :class="{ disabled: !p.enabled }">
              <div class="pack-icon" :class="{ dir: p.isDir }">
                <svg v-if="p.isDir" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div class="pack-info">
                <span class="pack-name">{{ p.filename }}</span>
                <span class="pack-meta">{{ formatFileSize(p.size) }} · {{ formatDate(p.modifiedAt) }} · {{ p.isDir ? t('instance.dirPack') : t('instance.zipPack') }}</span>
              </div>
              <div class="pack-actions">
                <span class="status-badge" :class="p.enabled ? 'status-active' : 'status-disabled'">
                  {{ p.enabled ? t('instance.statusActive') : t('instance.statusDisabled') }}
                </span>
                <button class="toggle-btn" @click="togglePack('resourcepacks', p.filename, !p.enabled)"
                  :title="p.enabled ? t('mod.disable') : t('mod.enable')">
                  <svg v-if="p.enabled" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button class="toggle-btn delete-btn" @click="deletePack('resourcepacks', p.filename)" :title="t('instance.delete')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ============================================== -->
      <!-- 光影包 Tab                                     -->
      <!-- ============================================== -->
      <template v-if="detailTab === 'shaderpacks'">
        <section class="info-section vox-card pack-section">
          <div class="section-header">
            <h3 class="section-title">{{ t('instance.tabShaderPacks') }} <span class="mod-count" v-if="shaderPacks.length">({{ shaderPacks.length }})</span></h3>
            <div class="section-actions">
              <button class="icon-btn" @click="loadShaderPacks" :title="t('common.refresh')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
              <button class="icon-btn" @click="openInstanceSubdir('shaderpacks')" :title="t('instance.openFolder')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="shaderPacksLoading" class="mod-loading">
            <div class="spinner-sm"></div><span>{{ t('common.loading') }}</span>
          </div>
          <div v-else-if="shaderPacks.length === 0" class="empty-state small">
            <p>{{ t('instance.noShaders') }}</p>
          </div>
          <div v-else class="pack-list">
            <div v-for="p in shaderPacks" :key="p.filename" class="pack-item" :class="{ disabled: !p.enabled }">
              <div class="pack-icon" :class="{ dir: p.isDir }">
                <svg v-if="p.isDir" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div class="pack-info">
                <span class="pack-name">{{ p.filename }}</span>
                <span class="pack-meta">{{ formatFileSize(p.size) }} · {{ formatDate(p.modifiedAt) }} · {{ p.isDir ? t('instance.dirPack') : t('instance.zipPack') }}</span>
              </div>
              <div class="pack-actions">
                <span class="status-badge" :class="p.enabled ? 'status-active' : 'status-disabled'">
                  {{ p.enabled ? t('instance.statusActive') : t('instance.statusDisabled') }}
                </span>
                <button class="toggle-btn" @click="togglePack('shaderpacks', p.filename, !p.enabled)"
                  :title="p.enabled ? t('mod.disable') : t('mod.enable')">
                  <svg v-if="p.enabled" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button class="toggle-btn delete-btn" @click="deletePack('shaderpacks', p.filename)" :title="t('instance.delete')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ============================================== -->
      <!-- 存档 Tab                                       -->
      <!-- ============================================== -->
      <template v-if="detailTab === 'saves'">
        <section class="info-section vox-card pack-section">
          <div class="section-header">
            <h3 class="section-title">{{ t('instance.tabSaves') }} <span class="mod-count" v-if="saves.length">({{ saves.length }})</span></h3>
            <div class="section-actions">
              <button class="icon-btn" @click="loadSaves" :title="t('common.refresh')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
              <button class="icon-btn" @click="openInstanceSubdir('saves')" :title="t('instance.openFolder')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="savesLoading" class="mod-loading">
            <div class="spinner-sm"></div><span>{{ t('common.loading') }}</span>
          </div>
          <div v-else-if="saves.length === 0" class="empty-state small">
            <p>{{ t('instance.noSaves') }}</p>
          </div>
          <div v-else class="pack-list">
            <div v-for="s in saves" :key="s.filename" class="pack-item save-item">
              <div class="pack-icon save-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div class="pack-info">
                <span v-if="s.renaming" class="save-rename-row">
                  <input v-model="s.renameValue" class="vox-input save-rename-input" @keyup.enter="confirmRenameSave(s)" @keyup.esc="s.renaming = false" />
                  <button class="vox-btn vox-btn--primary vox-btn--sm" @click="confirmRenameSave(s)">{{ t('common.confirm') }}</button>
                </span>
                <span v-else class="pack-name">{{ s.filename }}</span>
                <span class="pack-meta">{{ formatFileSize(s.size) }} · {{ formatDate(s.modifiedAt) }}</span>
              </div>
              <div class="pack-actions">
                <button v-if="!s.renaming" class="toggle-btn" @click="startRenameSave(s)" :title="t('common.rename')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button class="toggle-btn" @click="backupSave(s)" :title="t('instance.backupSave')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button class="toggle-btn delete-btn" @click="deleteSave(s)" :title="t('instance.delete')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- 分享弹窗 -->
    <ShareModal
      v-model="showShareModal"
      :instance-id="instance?.id || ''"
      :instance-name="instance?.name || ''"
      @complete="showShareModal = false"
    />

    <!-- Config 编辑弹窗 -->
    <PxModal
      v-if="editingConfig"
      :model-value="!!editingConfig"
      @close="closeConfigEditor"
      :title="$t('common.edit') + ': ' + editingConfig.name"
      size="lg"
    >
      <div class="config-editor">
        <div class="editor-toolbar">
          <span class="editor-hint">{{ $t('instance.configEditorHint') }}</span>
          <div class="toolbar-actions">
            <button v-if="configDirty" class="reset-btn vox-btn" @click="resetConfig">{{ $t('instance.resetConfigBtn') }}</button>
            <button class="save-config-btn vox-btn vox-btn--primary" @click="saveConfig" :disabled="savingConfig">
              {{ savingConfig ? $t('instance.savingConfig') : $t('common.save') }}
            </button>
          </div>
        </div>
        <textarea
          ref="configTextarea"
          v-model="configContent"
          class="config-textarea"
          spellcheck="false"
          @input="onConfigInput"
        ></textarea>
        <div v-if="configError" class="editor-error">{{ configError }}</div>
      </div>
    </PxModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useInstancesStore } from '../stores/instances.store'
import { useModsStore } from '../stores/mods.store'
import { formatRelativeTime, formatDuration, getLoaderName } from '../utils/format'
import { getCurrentLocale } from '../locale/i18n'
import type { GameInstance, RawGameInstance, LoaderType } from '../types/instance'
import PxModal from '../components/common/PxModal.vue'
import ShareModal from '../components/share/ShareModal.vue'
import type { LocalModStatus } from '../types/mod'
import { useConfirm } from '@/composables/useConfirm'

interface IpcModInfo {
  filePath: string
  fileName: string
  name?: string
  version?: string
  authors?: string | string[]
  size?: number
  enabled?: boolean
}

const { t } = useI18n()
const { confirm: pxConfirm } = useConfirm()
const route = useRoute()
const router = useRouter()
const instancesStore = useInstancesStore()
const modsStore = useModsStore()

// * ====== 状态 ======
const instance = ref<GameInstance | null>(null)
const error = ref<string | null>(null)
const saving = ref(false)
const detailTab = ref<'overview' | 'mods' | 'resourcepacks' | 'shaderpacks' | 'saves'>('overview')

// * 编辑表单
const editForm = ref({
  name: '',
  mcVersion: '',
  loaderType: 'vanilla',
  loaderVersion: '',
  width: 854,
  height: 480,
  fullscreen: false,
  javaPath: '',
  minMemory: 1024,
  maxMemory: 4096,
  jvmArgs: ''
})
const savingBasic = ref(false)

// * 本地 Mod
const localMods = ref<
  Array<{
    filePath: string
    fileName: string
    displayName: string
    version: string
    author: string
    fileSize: number
    status: LocalModStatus
    latestVersion?: string
  }>
>([])
const modsLoading = ref(false)
const modsUpdateLoading = ref(false)
const modUpdatesAvailable = computed(() => localMods.value.filter((m) => m.latestVersion && m.latestVersion !== m.version).length)

// 配置文件列表
interface ConfigFile {
  name: string
  path: string
  size: number
  modified: string
}
const configFiles = ref<ConfigFile[]>([])
const configFilesLoading = ref(false)

// 资源包 / 光影包 / 存档
interface PackFileInfo {
  filename: string
  size: number
  enabled: boolean
  modifiedAt: string
  isDir: boolean
}
const resourcePacks = ref<PackFileInfo[]>([])
const resourcePacksLoading = ref(false)
const shaderPacks = ref<PackFileInfo[]>([])
const shaderPacksLoading = ref(false)

interface SaveInfo extends PackFileInfo {
  renaming?: boolean
  renameValue?: string
}
const saves = ref<SaveInfo[]>([])
const savesLoading = ref(false)

// 磁盘占用
interface DiskUsage {
  total: number
  mods: number
  saves: number
  resourcepacks: number
  shaderpacks: number
  config: number
  others: number
}
const diskUsage = ref<DiskUsage>({ total: 0, mods: 0, saves: 0, resourcepacks: 0, shaderpacks: 0, config: 0, others: 0 })
const diskUsageLoading = ref(false)
const diskPercent = computed(() => {
  if (!diskUsage.value.total) return 0
  // 相对总量作为 100%（占满自己的条），可用于直观条
  return 100
})

// Config 编辑器状态
const editingConfig = ref<ConfigFile | null>(null)
const configContent = ref('')
const configOriginal = ref('')
const configDirty = ref(false)
const savingConfig = ref(false)
const configError = ref('')
const configTextarea = ref<HTMLTextAreaElement | null>(null)

// 分享弹窗状态
const showShareModal = ref(false)

// ====== 计算属性 ======
const instanceId = computed(() => route.params.id as string)
const activeModCount = computed(() => localMods.value.filter((m) => m.status === 'active').length)

const loaderLabel = computed(() => {
  if (!instance.value) return '-'
  if (instance.value.loaderType === 'vanilla') return t('game.vanilla') as string
  return `${getLoaderName(instance.value.loaderType)} ${instance.value.loaderVersion}`.trim()
})

const formatLastPlayed = computed(() => {
  if (!instance.value?.lastPlayed) return t('instance.neverPlayed') as string
  return formatRelativeTime(instance.value.lastPlayed)
})

const playTimeStr = computed(() => {
  if (!instance.value) return t('instance.zeroMinutes') as string
  return formatDuration(instance.value.playTime)
})

const modsStats = computed(() => modsStore.stats)

// ====== 方法 ======
async function fetchDetail() {
  error.value = null
  try {
    // 优先直接从 IPC 拿最新数据（不走 store，避免路径字段不一致）
    const raw = await window.electronAPI?.instance.getById(instanceId.value) as RawGameInstance | null
    if (raw) {
      instance.value = {
        id: raw.id,
        name: raw.name,
        path: raw.path,
        mcVersion: raw.mc_version,
        loaderType: (raw.loader_type || 'vanilla') as LoaderType,
        loaderVersion: raw.loader_version || '',
        icon: raw.icon || '',
        javaPath: raw.java_path || '',
        jvmArgs: raw.jvm_args || '',
        minMemory: raw.min_memory || 1024,
        maxMemory: raw.max_memory || 4096,
        width: raw.width || 854,
        height: raw.height || 480,
        fullscreen: (raw.fullscreen || 0) as 0 | 1,
        isFavorited: (raw.is_favorited || 0) as 0 | 1,
        lastPlayed: raw.last_played || null,
        playTime: raw.play_time || 0,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at
      }
      editForm.value.name = instance.value!.name
      editForm.value.mcVersion = instance.value!.mcVersion
      editForm.value.loaderType = instance.value!.loaderType
      editForm.value.loaderVersion = instance.value!.loaderVersion
      editForm.value.width = instance.value!.width
      editForm.value.height = instance.value!.height
      editForm.value.fullscreen = instance.value!.fullscreen === 1
      editForm.value.javaPath = instance.value!.javaPath
      editForm.value.minMemory = instance.value!.minMemory
      editForm.value.maxMemory = instance.value!.maxMemory
      editForm.value.jvmArgs = instance.value!.jvmArgs
    }

    // 并行加载：Mod 列表 + 配置列表 + 磁盘占用
    await Promise.all([loadMods(), loadConfigFiles(), loadDiskUsage()])
  } catch (e: unknown) {
    error.value = (e as Error).message || t('instance.loadFailed') as string
  }
}

async function loadMods() {
  if (!instance.value?.path) return
  modsLoading.value = true
  try {
    const res = await window.electronAPI?.mod.list(instance.value.path)
    if (res?.ok) {
      localMods.value = (res.data as IpcModInfo[] || []).map((m) => ({
        filePath: m.filePath,
        fileName: m.fileName,
        displayName: m.name || m.fileName.replace('.jar', ''),
        version: m.version || '',
        author: (Array.isArray(m.authors) ? m.authors.join(', ') : m.authors) || '',
        fileSize: m.size || 0,
        status: m.enabled ? 'active' : 'disabled'
      }))
    }
  } catch (e) {
    // ignore
  } finally {
    modsLoading.value = false
  }
}

async function loadConfigFiles() {
  if (!instance.value?.path) return
  configFilesLoading.value = true
  try {
    const res = await window.electronAPI?.mod.listConfigs(instance.value.path)
    if (res?.ok && res.data) {
      configFiles.value = res.data as ConfigFile[]
    }
  } catch (e) {
    // ignore
  } finally {
    configFilesLoading.value = false
  }
}

async function refreshMods() {
  await loadMods()
}

// ===== 新增：资源包/光影/存档/磁盘/Mod 更新 =====
async function loadDiskUsage() {
  if (!instance.value?.id) return
  diskUsageLoading.value = true
  try {
    const data = await window.electronAPI?.instance?.diskUsage?.(instance.value.id)
    if (data) diskUsage.value = data as DiskUsage
  } catch {
    // ignore
  } finally {
    diskUsageLoading.value = false
  }
}

async function openInstanceSubdir(sub: 'resourcepacks' | 'shaderpacks' | 'saves' | 'mods' | 'config') {
  if (!instance.value?.path) return
  window.electronAPI?.shell.openPath(instance.value.path + '/' + sub)
}

async function loadResourcePacks() {
  if (!instance.value?.id) return
  resourcePacksLoading.value = true
  try {
    const data = await window.electronAPI?.instance?.listResourcePacks?.(instance.value.id)
    if (Array.isArray(data)) resourcePacks.value = data
  } catch {
    // ignore
  } finally {
    resourcePacksLoading.value = false
  }
}

async function loadShaderPacks() {
  if (!instance.value?.id) return
  shaderPacksLoading.value = true
  try {
    const data = await window.electronAPI?.instance?.listShaderPacks?.(instance.value.id)
    if (Array.isArray(data)) shaderPacks.value = data
  } catch {
    // ignore
  } finally {
    shaderPacksLoading.value = false
  }
}

async function loadSaves() {
  if (!instance.value?.id) return
  savesLoading.value = true
  try {
    const data = await window.electronAPI?.instance?.listSaves?.(instance.value.id)
    if (Array.isArray(data)) saves.value = data.map((s) => ({ ...s }))
  } catch {
    // ignore
  } finally {
    savesLoading.value = false
  }
}

type PackKind = 'resourcepacks' | 'shaderpacks'

async function togglePack(kind: PackKind, filename: string, enabled: boolean) {
  if (!instance.value?.id) return
  try {
    const fn = kind === 'resourcepacks'
      ? window.electronAPI?.instance?.toggleResourcePack
      : window.electronAPI?.instance?.toggleShaderPack
    const ok = await fn?.(instance.value.id, filename, enabled)
    if (ok) {
      if (kind === 'resourcepacks') {
        const p = resourcePacks.value.find((x) => x.filename === filename)
        if (p) p.enabled = enabled
      } else {
        const p = shaderPacks.value.find((x) => x.filename === filename)
        if (p) p.enabled = enabled
      }
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: (e as Error).message, type: 'error' })
  }
}

async function deletePack(kind: PackKind, filename: string) {
  if (!instance.value?.id) return
  if (!await pxConfirm({ title: t('common.warning'), message: t('instance.deletePackConfirm', { name: filename }), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    const fn = kind === 'resourcepacks'
      ? window.electronAPI?.instance?.deleteResourcePack
      : window.electronAPI?.instance?.deleteShaderPack
    const ok = await fn?.(instance.value.id, filename)
    if (ok) {
      if (kind === 'resourcepacks') resourcePacks.value = resourcePacks.value.filter((p) => p.filename !== filename)
      else shaderPacks.value = shaderPacks.value.filter((p) => p.filename !== filename)
      loadDiskUsage()
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: (e as Error).message, type: 'error' })
  }
}

function startRenameSave(s: SaveInfo) {
  s.renameValue = s.filename
  s.renaming = true
}

async function confirmRenameSave(s: SaveInfo) {
  if (!instance.value?.id || !s.renameValue || s.renameValue === s.filename) {
    s.renaming = false
    return
  }
  try {
    const ok = await window.electronAPI?.instance?.renameSave?.(instance.value.id, s.filename, s.renameValue)
    if (ok) {
      s.filename = s.renameValue
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: (e as Error).message, type: 'error' })
  } finally {
    s.renaming = false
    s.renameValue = undefined
  }
}

async function backupSave(s: SaveInfo) {
  if (!instance.value?.id) return
  try {
    const out = await window.electronAPI?.instance?.backupSave?.(instance.value.id, s.filename)
    if (out) {
      window.electronAPI?.notification?.send({ title: t('instance.backupSave'), body: t('instance.backupSaveSuccess', { file: out }), type: 'success' })
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: (e as Error).message, type: 'error' })
  }
}

async function deleteSave(s: SaveInfo) {
  if (!instance.value?.id) return
  if (!await pxConfirm({ title: t('common.warning'), message: t('instance.deleteSaveConfirm', { name: s.filename }), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    const ok = await window.electronAPI?.instance?.deleteSave?.(instance.value.id, s.filename)
    if (ok) {
      saves.value = saves.value.filter((x) => x.filename !== s.filename)
      loadDiskUsage()
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: (e as Error).message, type: 'error' })
  }
}

// ===== Mod 更新检测（走 Modrinth 版本搜索 / fingerprint 匹配，这里走文件名 + 版本启发式）=====
interface ModrinthVersion { version_number: string }
async function checkModUpdates() {
  if (!instance.value || localMods.value.length === 0) return
  modsUpdateLoading.value = true
  try {
    const mc = instance.value.mcVersion
    const loader = instance.value.loaderType
    // 并发限制 5，避免超时
    const queue = [...localMods.value]
    const worker = async () => {
      while (queue.length) {
        const mod = queue.shift()!
        try {
          // 以 displayName 作为 slug 搜索项目
          const slug = (mod.displayName || mod.fileName.replace(/\.jar$/i, '')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
          if (!slug) continue
          const project = await fetch(`https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
          if (!project?.id) continue
          const versions: ModrinthVersion[] = await fetch(
            `https://api.modrinth.com/v2/project/${project.id}/version?game_versions=["${mc}"]&loaders=["${loader}"]`
          ).then((r) => (r.ok ? r.json() : [])).catch(() => [])
          if (!versions || !versions.length) continue
          const latest = versions[0]?.version_number
          if (latest && latest !== mod.version) {
            mod.latestVersion = latest
          }
        } catch {
          // 单个失败忽略
        }
      }
    }
    await Promise.all(Array.from({ length: 5 }, () => worker()))
    if (modUpdatesAvailable.value > 0) {
      window.electronAPI?.notification?.send({
        title: t('instance.checkUpdates'),
        body: t('instance.modUpdatesFound', { count: modUpdatesAvailable.value }),
        type: 'info'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('instance.checkUpdates'),
        body: t('instance.modNoUpdates'),
        type: 'success'
      })
    }
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: (e as Error).message, type: 'error' })
  } finally {
    modsUpdateLoading.value = false
  }
}

async function openModsFolder() {
  if (!instance.value?.path) return
  const modsDir = instance.value.path + '/mods'
  window.electronAPI?.shell.openPath(modsDir)
}

async function openConfigDir() {
  if (!instance.value?.path) return
  const res = await window.electronAPI?.mod.openConfigDir(instance.value.path)
  if (res?.ok && res.data) {
    window.electronAPI?.shell.openPath(res.data)
  }
}

async function toggleMod(mod: (typeof localMods.value)[0]) {
  const action = mod.status === 'active' ? 'disable' : 'enable'
  const res = await window.electronAPI?.mod[action](mod.filePath)
  if (res?.ok) {
    mod.status = mod.status === 'active' ? 'disabled' : 'active'
  }
}

async function openConfigEditor(cfg: ConfigFile) {
  configError.value = ''
  editingConfig.value = cfg
  const res = await window.electronAPI?.mod.getConfigContent(cfg.path)
  if (res?.ok && res.data) {
    configContent.value = res.data
    configOriginal.value = res.data
    configDirty.value = false
    await nextTick()
    configTextarea.value?.focus()
  } else {
    configError.value = res?.error || t('instance.readFailed') as string
  }
}

function onConfigInput() {
  configDirty.value = configContent.value !== configOriginal.value
}

function resetConfig() {
  configContent.value = configOriginal.value
  configDirty.value = false
}

async function saveConfig() {
  if (!editingConfig.value) return
  savingConfig.value = true
  configError.value = ''
  try {
    const res = await window.electronAPI?.mod.saveConfigContent(
      editingConfig.value.path,
      configContent.value
    )
    if (res?.ok) {
      configOriginal.value = configContent.value
      configDirty.value = false
      editingConfig.value = null
    } else {
      configError.value = res?.error || t('instance.saveFailed') as string
    }
  } finally {
    savingConfig.value = false
  }
}

async function closeConfigEditor() {
  if (configDirty.value) {
    if (!await pxConfirm({ title: t('common.warning'), message: t('instance.unsavedChangesWarning'), type: 'warning', confirmText: t('common.confirm') })) return
  }
  editingConfig.value = null
  configDirty.value = false
}

async function toggleFavorite() {
  if (instance.value) {
    await instancesStore.toggleFavorite(instance.value.id)
    fetchDetail()
  }
}

function openFolder() {
  if (instance.value?.path) {
    window.electronAPI?.shell.openPath(instance.value.path)
  }
}

function openShareModal() {
  showShareModal.value = true
}

async function saveSettings() {
  if (!instance.value) return
  saving.value = true
  try {
    await instancesStore.updateInstance(instance.value.id, {
      javaPath: editForm.value.javaPath,
      minMemory: editForm.value.minMemory,
      maxMemory: editForm.value.maxMemory,
      jvmArgs: editForm.value.jvmArgs
    })
  } finally {
    saving.value = false
  }
}

// 保存基本信息
async function saveBasicInfo() {
  if (!instance.value) return
  savingBasic.value = true
  try {
    await instancesStore.updateInstance(instance.value.id, {
      name: editForm.value.name,
      mcVersion: editForm.value.mcVersion,
      loaderType: editForm.value.loaderType as LoaderType,
      loaderVersion: editForm.value.loaderVersion,
      width: editForm.value.width,
      height: editForm.value.height,
      fullscreen: editForm.value.fullscreen ? 1 : 0
    })
    // 更新本地数据
    instance.value.name = editForm.value.name
    instance.value.mcVersion = editForm.value.mcVersion
    instance.value.loaderType = editForm.value.loaderType as LoaderType
    instance.value.loaderVersion = editForm.value.loaderVersion
    instance.value.width = editForm.value.width
    instance.value.height = editForm.value.height
    instance.value.fullscreen = editForm.value.fullscreen ? 1 : 0
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.saveFailed'), type: 'error' })
  } finally {
    savingBasic.value = false
  }
}

// 启动游戏
function launchGame() {
  if (!instance.value) return
  window.electronAPI?.game?.launch?.(instance.value.id, '', instance.value.mcVersion)
  window.electronAPI?.notification?.send({
    title: t('instance.launch'),
    body: t('instance.launching', { name: instance.value.name }),
    type: 'info'
  })
}

// 删除实例
async function deleteInstance() {
  if (!instance.value) return
  const inst = instance.value
  if (!await pxConfirm({ title: t('instance.delete'), message: t('instance.deleteConfirm') + `「${inst.name}」？`, type: 'danger', confirmText: t('common.confirm') })) return
  const deleteFiles = await pxConfirm({ title: t('instance.delete'), message: t('instance.deleteFilesHint') + '\n\n' + t('instance.deleteFilesAlso') + '？', type: 'warning', confirmText: t('common.confirm') })
  try {
    await window.electronAPI?.instance?.delete(inst.id, deleteFiles)
    window.electronAPI?.notification?.send({
      title: t('instance.delete'),
      body: t('instance.deleteSuccess', { name: inst.name }),
      type: 'success'
    })
    router.push('/instances')
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.deleteFailed'), type: 'error' })
  }
}

// 删除 Mod
async function deleteModItem(mod: { filePath: string; fileName: string }) {
  if (!await pxConfirm({ title: t('common.warning'), message: t('mod.deleteConfirm', { name: mod.fileName }), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    await window.electronAPI?.mod?.uninstall?.(mod.filePath)
    await loadMods()
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('mod.deleteFailed'), type: 'error' })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(getCurrentLocale().replace('-', '_'))
}

function statusLabel(status: LocalModStatus): string {
  const map: Record<LocalModStatus, string> = {
    active: t('instance.statusActive') as string,
    disabled: t('instance.statusDisabled') as string,
    incompatible: t('instance.statusIncompatible') as string,
    error: t('instance.statusError') as string
  }
  return map[status] || status
}

// ====== 生命周期 ======
onMounted(fetchDetail)
watch(instanceId, () => {
  fetchDetail()
})
</script>

<style scoped lang="scss">
.instance-detail {
  padding: 20px 28px;
  max-width: 860px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  .back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid var(--voxver-border-color);
    border-radius: var(--voxver-radius-md);
    color: var(--voxver-text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all var(--voxver-transition-fast);

    &:hover {
      color: var(--voxver-primary);
      border-color: var(--voxver-primary-400);
      background: var(--voxver-primary-light);
    }
  }

  .instance-name {
    font-size: 22px;
    font-weight: 700;
    color: var(--voxver-text-primary);
    flex: 1;
  }

  .header-actions {
    display: flex;
    gap: 6px;

    .action-btn {
      padding: 7px 10px;
      border: 1px solid var(--voxver-border-color);
      border-radius: var(--voxver-radius-md);
      background: transparent;
      color: var(--voxver-text-muted);
      cursor: pointer;
      transition: all var(--voxver-transition-fast);

      &:hover {
        color: var(--voxver-primary);
        border-color: var(--voxver-primary-300);
      }
      &.active {
        color: var(--voxver-warning);
        border-color: var(--voxver-warning);
        background: color-mix(in oklab, var(--voxver-warning) 8%, transparent);
      }
      &.danger {
        &:hover {
          color: var(--voxver-error);
          border-color: var(--voxver-error);
          background: var(--voxver-error-light);
        }
      }
    }
  }
}

.detail-loading,
.detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  color: var(--voxver-text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}


.info-section {
  padding: 20px 24px;
  margin-bottom: 16px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;

    .mod-count {
      font-size: 12px;
      color: var(--voxver-text-muted);
      font-weight: 400;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.full-width {
      grid-column: 1 / -1;
    }

    label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--voxver-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .value {
      font-size: 14px;
      color: var(--voxver-text-primary);
      font-weight: 400;
    }

    .version-badge {
      display: inline-block;
      padding: 2px 10px;
      background: var(--voxver-info-light);
      color: var(--voxver-info);
      border-radius: var(--voxver-radius-sm);
      font-weight: 600;
      font-size: 13px;
    }

    .loader-badge {
      display: inline-block;
      padding: 2px 10px;
      background: var(--voxver-success-light);
      color: var(--voxver-success);
      border-radius: var(--voxver-radius-sm);
      font-weight: 600;
      font-size: 13px;
    }

    .path-value {
      font-family: var(--voxver-font-mono);
      font-size: 13px;
      word-break: break-all;
      color: var(--voxver-text-secondary);
    }

    .edit-input {
      &.number-input {
        width: 100px;
      }
    }

    .resolution-inputs {
      display: flex;
      align-items: center;
      gap: 6px;

      .resolution-x {
        color: var(--voxver-text-muted);
        font-weight: 600;
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--voxver-text-primary);
      cursor: pointer;

      input[type='checkbox'] {
        width: 16px;
        height: 16px;
        accent-color: var(--voxver-primary);
      }
    }
  }
}

.save-btn {
  margin-top: 14px;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--voxver-text-muted);

  p {
    margin: 12px 0 16px;
  }

  .link-btn {
    display: inline-block;
    padding: 8px 20px;
    color: var(--voxver-primary-500);
    font-size: 13.5px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid var(--voxver-primary-300);
    border-radius: var(--voxver-radius-md);
    transition: all var(--voxver-transition-fast);

    &:hover {
      background: var(--voxver-primary-light);
    }
  }
}

.hint-text {
  color: var(--voxver-text-muted);
  font-size: 13px;
  text-align: center;
  padding: 20px;
}

/* ====== Mod 列表 ====== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .section-title {
    margin-bottom: 0;
  }
}

.section-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  color: var(--voxver-text-muted);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    color: var(--voxver-primary);
    border-color: var(--voxver-primary-300);
    background: var(--voxver-primary-light);
  }
}

.mod-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  color: var(--voxver-text-muted);
  font-size: 13px;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.mod-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--voxver-border-color);
    border-radius: 2px;
  }
}

.mod-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--voxver-bg-input);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  transition: all var(--voxver-transition-fast);

  &:hover {
    border-color: var(--voxver-border-color-focus);
    background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  }

  &.mod-disabled {
    opacity: 0.6;
  }
}

.mod-icon {
  color: var(--voxver-text-muted);
  flex-shrink: 0;
}

.mod-info {
  flex: 1;
  min-width: 0;

  .mod-name {
    display: block;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mod-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
    font-size: 11px;
    color: var(--voxver-text-muted);

    .mod-version {
      color: var(--voxver-info);
    }
  }
}

.mod-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-badge {
  padding: 2px 8px;
  border-radius: var(--voxver-radius-sm);
  font-size: 11px;
  font-weight: 600;

  &.status-active {
    background: var(--voxver-success-light);
    color: var(--voxver-success);
  }

  &.status-disabled {
    background: var(--voxver-bg-input);
    color: var(--voxver-text-muted);
    border: 1px solid var(--voxver-border-color);
  }

  &.status-incompatible {
    background: color-mix(in oklab, var(--voxver-error) 10%, transparent);
    color: var(--voxver-error);
  }

  &.status-error {
    background: color-mix(in oklab, var(--voxver-error) 10%, transparent);
    color: var(--voxver-error);
  }
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  color: var(--voxver-text-muted);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    color: var(--voxver-primary);
    border-color: var(--voxver-primary-300);
  }

  &.delete-btn:hover {
    color: var(--voxver-error);
    border-color: var(--voxver-error);
    background: var(--voxver-error-light);
  }
}

/* ====== 配置文件列表 ====== */
.config-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--voxver-radius-md);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    background: var(--voxver-bg-input);
  }
}

.config-icon {
  color: var(--voxver-text-muted);
  flex-shrink: 0;
}

.config-info {
  flex: 1;
  min-width: 0;

  .config-name {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    font-family: var(--voxver-font-mono);
  }

  .config-meta {
    font-size: 11px;
    color: var(--voxver-text-muted);
  }
}

.edit-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--voxver-radius-sm);
  color: var(--voxver-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all var(--voxver-transition-fast);

  .config-item:hover & {
    opacity: 1;
    border-color: var(--voxver-border-color);
  }

  &:hover {
    color: var(--voxver-primary);
    border-color: var(--voxver-primary-300);
  }
}

/* ====== Config 编辑器弹窗 ====== */
.config-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editor-hint {
  font-size: 12px;
  color: var(--voxver-text-muted);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.reset-btn {
  &:hover {
    color: var(--voxver-text-primary);
    border-color: var(--voxver-text-muted);
  }
}

.config-textarea {
  width: 100%;
  height: 400px;
  padding: 14px 16px;
  background: var(--voxver-bg-input);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  color: var(--voxver-text-primary);
  font-family: var(--voxver-font-mono);
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color var(--voxver-transition-fast);

  &:focus {
    border-color: var(--voxver-border-color-focus);
  }
}

.editor-error {
  color: var(--voxver-error);
  font-size: 12px;
  padding: 8px 12px;
  background: color-mix(in oklab, var(--voxver-error) 10%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid color-mix(in oklab, var(--voxver-error) 20%, transparent);
}

.empty-state.small {
  padding: 24px 0;
}

/* ========== Tab 导航 ========== */
.tab-nav {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 20px;
  background: var(--voxver-bg-tertiary);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-lg);
  overflow-x: auto;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--voxver-text-secondary);
  border-radius: var(--voxver-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--voxver-transition-fast);
  position: relative;

  &:hover {
    color: var(--voxver-text-primary);
    background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  }

  &.active {
    background: var(--voxver-primary);
    color: #fff;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
}

.tab-count {
  font-size: 11px;
  font-family: var(--voxver-font-mono);
  padding: 1px 7px;
  background: color-mix(in oklab, currentColor 12%, transparent);
  border-radius: var(--voxver-radius-full);
  line-height: 1.4;
}

.tab-badge {
  min-width: 18px;
  padding: 0 6px;
  font-size: 11px;
  font-family: var(--voxver-font-mono);
  border-radius: var(--voxver-radius-full);
  line-height: 1.4;
  text-align: center;

  &.update {
    background: var(--voxver-success);
    color: #fff;
  }
}

.check-update-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 12px;
  border-radius: var(--voxver-radius-md);
  color: var(--voxver-primary);
  border-color: color-mix(in oklab, var(--voxver-primary) 40%, var(--voxver-border-color));

  &:hover:not(:disabled) {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.spin {
  animation: spin 0.8s linear infinite;
}

/* ========== 磁盘占用 ========== */
.disk-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.disk-total {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.disk-label {
  font-size: 13px;
  color: var(--voxver-text-secondary);
}

.disk-big {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--voxver-font-mono);
  color: var(--voxver-text-primary);
}

.disk-bar {
  height: 8px;
  background: var(--voxver-bg-tertiary);
  border-radius: var(--voxver-radius-full);
  overflow: hidden;
  border: 1px solid var(--voxver-border-color-light);
}

.disk-bar-fill {
  height: 100%;
  border-radius: var(--voxver-radius-full);
  background: linear-gradient(90deg, var(--voxver-primary-500), var(--voxver-accent));
  transition: width 0.4s ease;
}

.disk-parts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px 14px;
  font-size: 12px;
  color: var(--voxver-text-secondary);
}

.disk-part {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
}

/* ========== 资源包/光影/存档 公共 ========== */
.pack-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pack-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  background: var(--voxver-bg-tertiary);
  transition: all var(--voxver-transition-fast);

  &:hover {
    border-color: var(--voxver-border-color);
    background: color-mix(in oklab, var(--voxver-text) 2%, transparent);
  }

  &.disabled {
    opacity: 0.55;
  }
}

.pack-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
  color: var(--voxver-primary);
  border-radius: var(--voxver-radius-md);

  &.dir {
    background: color-mix(in oklab, var(--voxver-warning) 12%, transparent);
    color: var(--voxver-warning);
  }

  &.save-icon {
    background: color-mix(in oklab, var(--voxver-success) 12%, transparent);
    color: var(--voxver-success);
  }
}

.pack-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pack-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--voxver-text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.pack-meta {
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-family: var(--voxver-font-mono);
}

.pack-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.save-rename-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.save-rename-input {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
}

.mod-outdated {
  border-color: color-mix(in oklab, var(--voxver-success) 35%, var(--voxver-border-color));
  background: color-mix(in oklab, var(--voxver-success) 4%, var(--voxver-bg-tertiary));
}

.mod-version-new {
  color: var(--voxver-success);
  font-weight: 600;
}
</style>
