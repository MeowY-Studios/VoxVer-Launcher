<template>
  <div class="settings-page" :class="{ 'is-kor-page': appStore.skin === 'koring' }" ref="pageRef">
    <!-- Koring 皮肤：设置页自带侧栏导航（KorPageShell 仅导航模式） -->
    <KorPageShell
      v-if="appStore.skin === 'koring'"
      v-model="activeCategory"
      sidebar-only
      :groups="korSettingGroups"
      nav-label="设置导航"
      class="settings-kor-nav"
    >
      <template #sidebar-header>
        <KorAccountCard
          :name="$t('settings.home.accountTitle')"
          :desc="$t('settings.home.accountTitleDesc')"
          @select="activeCategory = 'account'"
        />
      </template>
    </KorPageShell>
    <!-- Koring 皮肤：其余分类的统一页头 -->
    <div
      v-if="appStore.skin === 'koring' && activeCategory !== 'home' && activeCategory !== 'personalize'"
      class="kor-page-header"
    >
      <h2 class="kor-page-title">{{ korHeaderTitle }}</h2>
    </div>

    <!-- ========== 主页 ========== -->
    <template v-if="activeCategory === 'home'">
      <!-- Koring 皮肤：页头 + 版本卡（Kor 组件层） -->
      <template v-if="appStore.skin === 'koring'">
        <KorPageHeader :title="$t('settings.home.korTitle')" :desc="$t('settings.home.korDesc')" />
        <KorVersionCard
          :label="$t('settings.home.korOfficial')"
          :version="appVersion"
          :commit="appCommit"
          :action-text="$t('settings.home.korCheckUpdate')"
          @update="router.push('/update')"
        />
      </template>

      <!-- 查找设置 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {{ $t('settings.home.searchTitle') }}
        </h3>
        <div class="search-box">
          <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            class="search-box-input"
            :placeholder="$t('settings.home.searchPlaceholder')"
            @input="onSearchInput"
          />
        </div>
      </section>

      <!-- 快速浏览 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          {{ $t('settings.home.quickBrowse') }}
        </h3>
        <div class="quick-grid">
          <button class="quick-grid-item" @click="switchCategory('account')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.accountTitle') }}
              <small class="quick-grid-desc">{{ $t('settings.home.accountTitleDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('advanced')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickAdvanced') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickAdvancedDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('personalize')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickPersonalize') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickPersonalizeDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('download-net')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickDownload') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickDownloadDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('launcher')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickLauncher') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickLauncherDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
        </div>
      </section>

      <!-- 常用设置 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          {{ $t('settings.home.commonSettings') }}
        </h3>
        <div class="quick-grid">
          <button class="quick-grid-item" @click="switchCategory('launch')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickJavaMemory') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickJavaMemoryDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('language')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickLanguage') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickLanguageDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('personalize')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickTheme') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickThemeDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('about')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <span class="quick-grid-label">
              {{ $t('settings.home.quickAbout') }}
              <small class="quick-grid-desc">{{ $t('settings.home.quickAboutDesc') }}</small>
            </span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
        </div>
      </section>
    </template>

    <!-- ========== 账户 ========== -->
    <template v-if="activeCategory === 'account'">
      <div v-if="appStore.skin !== 'koring'" class="coming-soon">
        <div class="coming-soon-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 class="coming-soon-title">{{ $t('settings.home.accountTitle') }}</h3>
        <p class="coming-soon-desc">{{ $t('settings.home.comingSoonDesc') }}</p>
        <span class="coming-soon-badge">{{ $t('more.notAvailable') }}</span>
      </div>

      <!-- Koring 排版：账户卡（沿用 Koring 的「未登录 / 已登录」单卡布局） -->
      <div v-else class="kor-account-panel kor-section">
        <span class="kor-account-panel__avatar">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
            <path d="M10 8l4 4-4 4" />
            <path d="M14 12H3" />
          </svg>
        </span>
        <h3 class="kor-account-panel__title">{{ $t('settings.koringAccountGuest') }}</h3>
        <p class="kor-account-panel__desc">{{ $t('settings.koringAccountGuestDesc') }}</p>
        <KorButton variant="primary" size="md" @click="onVoxverAccountAction">
          {{ $t('settings.koringAccountSignIn') }}
        </KorButton>
      </div>
    </template>

    <!-- ========== 关于 ========== -->
    <template v-if="activeCategory === 'about'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          {{ $t('more.aboutSection') }}
        </h3>
        <p class="sec-desc" style="margin-bottom:0">{{ $t('more.aboutSubtitle') }}</p>
      </section>

      <div style="height:4px"></div>
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <div class="about-card">
          <div class="about-logo">
            <img src="/Alogo.png" alt="VoxVer" />
          </div>
          <p class="about-ver is-tappable" @click="handleVersionTap">{{ $t('more.currentVersion') }}{{ appVersion }}</p>
          <!-- 权限警告 -->
          <div v-if="permWarning" class="perm-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{{ $t('settings.permWarning') }}</span>
          </div>
          <!-- 已管理员运行 -->
          <div v-if="permInfo?.isAdmin" class="perm-info-ok">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{{ $t('settings.permAdminOk') }}</span>
          </div>
          <div class="about-update-row">
            <div class="about-update-actions">
              <button class="action-btn small outline" @click="checkForUpdate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {{ $t('more.checkUpdate') }}
              </button>
              <a class="action-btn small ghost" href="https://github.com/MeowY-Studios/VoxVer-Launcher" target="_blank">
                {{ $t('more.viewSource') }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 更新错误弹窗 -->
      <div v-if="showUpdateErrModal" class="modal-overlay">
        <div class="modal-box update-error-modal">
          <div class="modal-header">
            <h4>{{ $t('update.checkFailed') }}</h4>
            <button class="modal-close" @click="showUpdateErrModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p class="update-err-msg">{{ updateStatus.error }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn vox-btn vox-btn--secondary" @click="showUpdateErrModal = false">{{ $t('common.close') }}</button>
          </div>
        </div>
      </div>

      <!-- 更新可用弹窗 -->
      <div v-if="showUpdateAvailableModal" class="modal-overlay">
        <div class="modal-box update-available-modal">
          <div class="modal-header">
            <h4>{{ $t('update.newVersion') }}</h4>
            <button class="modal-close" @click="showUpdateAvailableModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="update-version-row">
              <span class="update-version-label">{{ $t('update.versionLabel') }}</span>
              <span class="update-version-num">v{{ updateStatus.version }}</span>
            </div>
            <div v-if="updateStatus.releaseNotes" class="update-release-notes">
              <div class="update-notes-md" v-html="renderMarkdownSafe(updateStatus.releaseNotes)"></div>
            </div>
            <!-- 下载进度 -->
            <div v-if="updateStatus.downloading" class="update-progress-section">
              <div class="update-progress-bar">
                <div class="update-progress-fill" :style="{ width: Math.round(updateStatus.downloadProgress) + '%' }"></div>
              </div>
              <span class="update-progress-text">{{ Math.round(updateStatus.downloadProgress) }}%</span>
            </div>
            <div v-if="updateStatus.downloaded" class="update-downloaded-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{{ $t('update.downloaded') }}</span>
            </div>
            <div v-if="updateStatus.error && !updateStatus.downloading && !updateStatus.downloaded" class="update-error-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{{ $t('update.downloadFailed') }}: {{ updateStatus.error }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button v-if="!updateStatus.downloading && !updateStatus.downloaded"
            class="btn vox-btn vox-btn--secondary" @click="showUpdateAvailableModal = false">
            {{ $t('common.cancel') }}
          </button>
            <button v-if="!updateStatus.downloading && !updateStatus.downloaded && !updateStatus.error"
              class="btn vox-btn vox-btn--primary" @click="startDownloadFromModal">
              {{ $t('update.download') }}
            </button>
            <button v-if="updateStatus.error && !updateStatus.downloading && !updateStatus.downloaded"
              class="btn vox-btn vox-btn--primary" @click="startDownloadFromModal">
              {{ $t('update.retry') }}
            </button>
            <button v-if="updateStatus.downloaded"
              class="btn vox-btn vox-btn--primary" @click="installUpdate">
              {{ $t('update.install') }}
            </button>
            <button v-if="updateStatus.downloading"
              class="btn vox-btn vox-btn--secondary" disabled>
              {{ $t('update.downloading') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 项目信息 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">{{ $t('settings.aboutSection.projectInfo') }}</h3>
        <p class="sec-desc">{{ $t('settings.aboutSection.projectDesc') }}</p>
        <div class="credit-list">
          <div class="credit-item">
            <div class="credit-avatar">V</div>
            <div class="credit-info">
              <span class="credit-name">VoxVer Launcher Team</span>
              <span class="credit-role">{{ $t('settings.aboutSection.teamRole') }}</span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#e74c3c 14%,transparent);color:#e74c3c">G</div>
            <div class="credit-info">
              <span class="credit-name">GNU General Public License 3.0</span>
              <span class="credit-role">{{ $t('settings.aboutSection.licenseRole') }}</span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#6366f1 14%,transparent);color:#6366f1">L</div>
            <div class="credit-info">
              <span class="credit-name">Lumin UI/UX</span>
              <span class="credit-role">
                <a href="https://github.com/MeowY-Studios/Lumin-UI-UX" target="_blank" style="color:var(--voxver-primary);text-decoration:none;font-size:12px">{{ $t('settings.aboutSection.luminUiux') }}</a>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 鸣谢 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {{ $t('settings.aboutSection.acknowledgements') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.aboutSection.acknowledgementsDesc') }}</p>
        <div class="credit-list">
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#34c759 14%,transparent);color:#34c759">M</div>
            <div class="credit-info">
              <span class="credit-name">Mojang Studios</span>
              <span class="credit-role">{{ $t('settings.aboutSection.minecraftCreator') }}</span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#0078d4 14%,transparent);color:#0078d4">M</div>
            <div class="credit-info">
              <span class="credit-name">Microsoft</span>
              <span class="credit-role">{{ $t('settings.aboutSection.msSupport') }}</span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#9333ea 14%,transparent);color:#9333ea">O</div>
            <div class="credit-info">
              <span class="credit-name">Open Source Community</span>
              <span class="credit-role">{{ $t('settings.aboutSection.ossCommunity') }}</span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#f59e0b 14%,transparent);color:#f59e0b">K</div>
            <div class="credit-info">
              <span class="credit-name">{{ $t('settings.aboutSection.koringUi') }}</span>
              <span class="credit-role">
                <a href="https://github.com/dream-pep" target="_blank" style="color:var(--voxver-primary);text-decoration:none;font-size:12px">dream-pep</a>
              </span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#0ea5e9 14%,transparent);color:#0ea5e9">S</div>
            <div class="credit-info">
              <span class="credit-name">StarLight.Core</span>
              <span class="credit-role">
                <a href="https://github.com/Conlux-Studio/StarLight.Core" target="_blank" style="color:var(--voxver-primary);text-decoration:none;font-size:12px">{{ $t('settings.aboutSection.archReference') }}</a>
              </span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#10b981 14%,transparent);color:#10b981">X</div>
            <div class="credit-info">
              <span class="credit-name">{{ $t('settings.aboutSection.xmcl') }}</span>
              <span class="credit-role">
                <a href="https://www.xmcl.app/zh/" target="_blank" style="color:var(--voxver-primary);text-decoration:none;font-size:12px">{{ $t('settings.aboutSection.xmclRole') }}</a>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 相关链接 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">{{ $t('settings.aboutSection.relatedLinks') }}</h3>
        <p class="sec-desc">{{ $t('settings.aboutSection.relatedDesc') }}</p>
        <div class="link-grid">
          <a class="link-item" href="https://github.com/MeowY-Studios/VoxVer-Launcher" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
            </svg>
            <span class="link-text">GitHub</span>
            <span class="link-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
            </span>
          </a>
          <a class="link-item" href="https://voxver.meow-studio.tech" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span class="link-text">{{ $t('settings.aboutSection.docs') }}</span>
            <span class="link-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
            </span>
          </a>
          <a class="link-item" href="https://github.com/MeowY-Studios/VoxVer-Launcher/releases" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span class="link-text">{{ $t('settings.aboutSection.releases') }}</span>
            <span class="link-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
            </span>
          </a>
          <a class="link-item" href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span class="link-text">{{ $t('settings.aboutSection.gplv3') }}</span>
            <span class="link-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
            </span>
          </a>
        </div>
      </section>
      <!-- Koring：关于 -->
      <div v-if="appStore.skin === 'koring'" class="kor-section">
        <KorSettingCard>
          <KorSettingRow :label="$t('more.currentVersion')" :desc="$t('settings.aboutSection.projectDesc')">
            <span class="kor-value is-tappable" @click="handleVersionTap">v{{ appVersion }}</span>
          </KorSettingRow>
          <KorSettingRow :label="$t('more.projectLicense')" :desc="'GNU General Public License v3.0'">
            <KorButton variant="outline" size="sm" @click="openExternal('https://www.gnu.org/licenses/gpl-3.0.html')">{{ $t('more.viewGplv3') }}</KorButton>
          </KorSettingRow>
          <KorSettingRow :label="$t('more.checkUpdate')">
            <KorButton variant="outline" size="sm" @click="checkForUpdate">{{ $t('more.checkUpdate') }}</KorButton>
          </KorSettingRow>
          <KorSettingRow :label="$t('more.viewSource')">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://github.com/MeowY-Studios/VoxVer-Launcher')">GitHub</KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle class="kor-inline-title">{{ $t('settings.aboutSection.projectInfo') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow label="VoxVer Launcher Team" :desc="$t('settings.aboutSection.teamRole')" />
          <KorSettingRow label="GNU General Public License 3.0" :desc="$t('settings.aboutSection.licenseRole')" />
          <KorSettingRow label="Lumin UI/UX">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://github.com/MeowY-Studios/Lumin-UI-UX')">{{ $t('settings.aboutSection.luminUiux') }}</KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle class="kor-inline-title">{{ $t('settings.aboutSection.acknowledgements') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow label="Mojang Studios" :desc="$t('settings.aboutSection.minecraftCreator')" />
          <KorSettingRow label="Microsoft" :desc="$t('settings.aboutSection.msSupport')" />
          <KorSettingRow label="Open Source Community" :desc="$t('settings.aboutSection.ossCommunity')" />
          <KorSettingRow :label="$t('settings.aboutSection.koringUi')">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://github.com/dream-pep')">dream-pep</KorButton>
          </KorSettingRow>
          <KorSettingRow label="StarLight.Core">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://github.com/Conlux-Studio/StarLight.Core')">{{ $t('settings.aboutSection.archReference') }}</KorButton>
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.aboutSection.xmcl')">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://www.xmcl.app/zh/')">{{ $t('settings.aboutSection.xmclRole') }}</KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle class="kor-inline-title">{{ $t('settings.aboutSection.relatedLinks') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow label="GitHub">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://github.com/MeowY-Studios/VoxVer-Launcher')">{{ $t('settings.aboutSection.relatedLinks') }}</KorButton>
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.aboutSection.docs')">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://voxver.meow-studio.tech')">voxver.meow-studio.tech</KorButton>
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.aboutSection.releases')">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://github.com/MeowY-Studios/VoxVer-Launcher/releases')">{{ $t('settings.aboutSection.releases') }}</KorButton>
          </KorSettingRow>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 启动器设置 ========== -->
    <template v-if="activeCategory === 'launcher'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          {{ $t('settings.updateChannel.title') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.updateChannel.desc') }}</p>
        <div class="setting-row">
          <div class="segmented-group">
            <button class="vox-chip vox-chip--stable" :class="{ 'vox-chip--active': updateChannel === 'stable' }" @click="onUpdateChannelChange('stable')">
              {{ $t('settings.updateChannel.stable') }}
            </button>
            <button class="vox-chip vox-chip--beta" :class="{ 'vox-chip--active': updateChannel === 'beta' }" @click="onUpdateChannelChange('beta')">
              {{ $t('settings.updateChannel.beta') }}
            </button>
          </div>
          <span class="setting-status">
            <span class="status-dot" :class="updateChannel === 'stable' ? 'status-dot--stable' : 'status-dot--beta'" />
            {{ $t('settings.currentChannel') }}：{{ updateChannel === 'stable' ? $t('settings.updateChannel.stable') : $t('settings.updateChannel.beta') }}
          </span>
        </div>
      </section>

      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          {{ $t('settings.autoCheckUpdate') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.autoCheckUpdateDesc') }}</p>
        <div class="setting-row">
          <div class="segmented-group">
            <button class="vox-chip vox-chip--on" :class="{ 'vox-chip--active': autoCheckUpdate }" @click="autoCheckUpdate = true; onAutoCheckChange()">
              {{ $t('settings.autoCheckEnable') }}
            </button>
            <button class="vox-chip vox-chip--off" :class="{ 'vox-chip--active': !autoCheckUpdate }" @click="autoCheckUpdate = false; onAutoCheckChange()">
              {{ $t('settings.autoCheckDisable') }}
            </button>
          </div>
          <span class="setting-status">
            <span class="status-dot" :class="autoCheckUpdate ? 'status-dot--on' : 'status-dot--off'" />
            {{ autoCheckUpdate ? $t('settings.autoCheckOn') : $t('settings.autoCheckOff') }}
          </span>
        </div>
      </section>

      <!-- Koring 排版 -->
      <section v-else class="kor-section">
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.updateChannel.title')" :desc="$t('settings.updateChannel.desc')">
            <KorSettingSelect
              :model-value="updateChannel"
              :options="korChannelOptions"
              :width="180"
              @update:model-value="onUpdateChannelChange"
            />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.autoCheckUpdate')" :desc="$t('settings.autoCheckUpdateDesc')">
            <KorSettingSwitch
              :model-value="autoCheckUpdate"
              @update:model-value="(v: boolean) => { autoCheckUpdate = v; onAutoCheckChange() }"
            />
          </KorSettingRow>
        </KorSettingCard>
      </section>
    </template>

    <!-- ========== 版权声明 ========== -->
    <template v-if="activeCategory === 'copyright'">
      <!-- 版权声明 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9a4 4 0 100 6" />
          </svg>
          {{ $t('more.copyright') }}
        </h3>
        <div class="copyright-card">
          <div class="copyright-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9a4 4 0 100 6" />
            </svg>
          </div>
          <p class="copyright-text">{{ $t('more.copyrightText1') }}</p>
          <p class="copyright-text">{{ $t('more.copyrightText2') }}</p> 
        </div>
      </section>

      <!-- 项目协议 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {{ $t('more.projectLicense') }}
        </h3>
        <div class="license-card">
          <div class="license-badge">GPLv3</div>
          <div class="license-info">
            <h4 class="license-name">GNU General Public License v3.0</h4>
            <p class="license-desc">{{ $t('more.licenseDesc') }}</p>
          </div>
          <a class="action-btn outline license-action" href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {{ $t('more.viewGplv3') }}
          </a>
        </div>
      </section>

      <!-- 开源依赖 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          {{ $t('more.ossDependencies') }}
        </h3>
        <div class="oss-grid">
          <div class="oss-item">
            <div class="oss-left">
              <span class="oss-name">Electron</span>
              <span class="oss-version">v33</span>
            </div>
            <span class="oss-license">MIT</span>
          </div>
          <div class="oss-item">
            <div class="oss-left">
              <span class="oss-name">Vue.js</span>
              <span class="oss-version">v3.5</span>
            </div>
            <span class="oss-license">MIT</span>
          </div>
          <div class="oss-item">
            <div class="oss-left">
              <span class="oss-name">Vue Router</span>
              <span class="oss-version">v4</span>
            </div>
            <span class="oss-license">MIT</span>
          </div>
          <div class="oss-item">
            <div class="oss-left">
              <span class="oss-name">electron-vite</span>
              <span class="oss-version">—</span>
            </div>
            <span class="oss-license">MIT</span>
          </div>
          <div class="oss-item">
            <div class="oss-left">
              <span class="oss-name">TypeScript</span>
              <span class="oss-version">v5.5</span>
            </div>
            <span class="oss-license">Apache-2.0</span>
          </div>
          <div class="oss-item">
            <div class="oss-left">
              <span class="oss-name">Lucide Icons</span>
              <span class="oss-version">—</span>
            </div>
            <span class="oss-license">MIT</span>
          </div>
          <div class="oss-item">
            <div class="oss-left">
              <span class="oss-name">Node.js</span>
              <span class="oss-version">v20+</span>
            </div>
            <span class="oss-license">MIT</span>
          </div>
        </div>
      </section>

      <!-- 字体授权 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
          {{ $t('more.fontLicense') }}
        </h3>
        <div class="copyright-card copyright-card--row">
          <p class="copyright-text">{{ $t('more.fontLicenseText') }}</p>
          <a class="action-btn outline" href="https://scripts.sil.org/OFL" target="_blank">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {{ $t('more.viewSilLicense') }}
          </a>
        </div>
      </section>

      <!-- VoxVer 归属 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          {{ $t('more.voxverAttribution') }}
        </h3>
        <div class="copyright-card">
          <p class="copyright-text">{{ $t('more.attributionText1') }}</p>
          <p class="copyright-text">{{ $t('more.attributionText2') }}</p>
        </div>
      </section>

      <!-- Koring：版权 -->
      <div v-if="appStore.skin === 'koring'" class="kor-section">
        <KorSettingCard>
          <p class="kor-copy">{{ $t('more.copyrightText1') }}</p>
          <p class="kor-copy">{{ $t('more.copyrightText2') }}</p>
        </KorSettingCard>

        <KorSectionTitle class="kor-inline-title">{{ $t('more.projectLicense') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow label="GNU General Public License v3.0" :desc="$t('more.licenseDesc')">
            <KorButton variant="outline" size="sm" @click="openExternal('https://www.gnu.org/licenses/gpl-3.0.html')">{{ $t('more.viewGplv3') }}</KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle class="kor-inline-title">{{ $t('more.ossDependencies') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow label="Electron" desc="v33"><span class="kor-value">MIT</span></KorSettingRow>
          <KorSettingRow label="Vue.js" desc="v3.5"><span class="kor-value">MIT</span></KorSettingRow>
          <KorSettingRow label="Vue Router" desc="v4"><span class="kor-value">MIT</span></KorSettingRow>
          <KorSettingRow label="electron-vite"><span class="kor-value">MIT</span></KorSettingRow>
          <KorSettingRow label="TypeScript" desc="v5.5"><span class="kor-value">Apache-2.0</span></KorSettingRow>
          <KorSettingRow label="Lucide Icons"><span class="kor-value">MIT</span></KorSettingRow>
          <KorSettingRow label="Node.js" desc="v20+"><span class="kor-value">MIT</span></KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle class="kor-inline-title">{{ $t('more.fontLicense') }}</KorSectionTitle>
        <KorSettingCard>
          <p class="kor-copy">{{ $t('more.fontLicenseText') }}</p>
          <KorSettingRow :label="$t('more.fontLicense')">
            <KorButton variant="ghost" size="sm" @click="openExternal('https://scripts.sil.org/OFL')">{{ $t('more.viewSilLicense') }}</KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle class="kor-inline-title">{{ $t('more.voxverAttribution') }}</KorSectionTitle>
        <KorSettingCard>
          <p class="kor-copy">{{ $t('more.attributionText1') }}</p>
          <p class="kor-copy">{{ $t('more.attributionText2') }}</p>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 游戏档案 ========== -->
    <template v-if="activeCategory === 'profile'">
      <div class="account-settings-wrapper">
        <AccountPage embedded />
      </div>
    </template>

    <!-- ========== 启动选项 ========== -->
    <!-- ========== Java虚拟机与内存 ========== -->
    <template v-if="activeCategory === 'java-memory'">
      <div v-if="appStore.skin !== 'koring'">
      <!-- Java 环境 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 5v14l11-7z" />
          </svg>
          {{ $t('settings.gameJava') }}
        </h3>
        <div class="sec-body">
          <div class="java-alloc-card">
            <p class="sec-desc" style="margin-bottom:8px">{{ $t('settings.gameJavaDesc') }}</p>
            <div class="java-select-row">
              <PxSelect v-model="selectedJavaPreset" :options="javaPresetOptions" />
              <button class="btn-sm java-detect-btn" @click="detectJava" :disabled="isDetectingJava">
                <svg v-if="isDetectingJava" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
                </svg>
                {{ isDetectingJava ? $t('settings.detecting') : $t('settings.detectJava') }}
              </button>
            </div>
            <div v-if="s.javaPreset === 'custom'" class="java-path-row">
              <input type="text" class="inp java-path-inp" v-model="s.javaPath" placeholder="C:\Program Files\Java\..." />
              <button class="btn-sm java-browse-btn" @click="browseJava">{{ $t('settings.browse') }}</button>
            </div>
            <div class="java-detection" style="margin-top:8px">
                <div v-if="isDetectingJava" class="java-progress">
                  <div class="progress-info">
                    <span class="progress-step">{{ currentStep }}</span>
                    <span class="progress-text">{{ progressText }}</span>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
                  </div>
                </div>
                <div v-if="detectionComplete && detectedJava.length === 0" class="java-not-found">
                  <div class="java-not-found-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div class="java-not-found-text">
                    <h4>{{ $t('settings.noJavaDetected') }}</h4>
                    <p>{{ $t('settings.noJavaDetectedDesc') }}</p>
                  </div>
                  <div class="java-not-found-actions">
                    <a href="https://adoptium.net/" target="_blank" class="btn-outline">{{ $t('settings.downloadEclipseTemurin') }}</a>
                    <a href="https://www.oracle.com/java/technologies/downloads/" target="_blank" class="btn-outline">{{ $t('settings.downloadOracleJava') }}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      <!-- 内存分配 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h.01M10 12h.01" />
          </svg>
          {{ $t('settings.javaMemory.memoryAllocation') }}
        </h3>
        <div class="sec-body">
            <div class="memory-alloc-card">
              <div class="mem-options">
                <label class="radio-item-k" :class="{ active: s.memoryMode === 'auto' }">
                  <input type="radio" name="memoryMode" value="auto" v-model="s.memoryMode" />
                  {{ $t('settings.javaMemory.autoConfig') }}
                </label>
                <label class="radio-item-k" :class="{ active: s.memoryMode === 'custom' }">
                  <input type="radio" name="memoryMode" value="custom" v-model="s.memoryMode" />
                  {{ $t('settings.javaMemory.custom') }}
                </label>
              </div>
              <div v-if="s.memoryMode === 'custom'" class="mem-custom-row">
                  <label class="mem-custom-label">{{ $t('settings.javaMemory.allocateMemory') }}</label>
                  <div class="mem-slider-wrap">
                    <input type="range" class="mem-slider" v-model.number="s.memoryCustomGB" min="1" max="32" step="0.5" />
                    <span class="mem-slider-val">{{ s.memoryCustomGB }} GB</span>
                  </div>
                  <div class="mem-slider-info">
                    <span>1 GB</span>
                    <span>{{ systemTotalGB }} GB</span>
                  </div>
                </div>
            </div>
          </div>
      </section>

      <!-- JVM 参数 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
          {{ $t('settings.javaMemory.jvmExtraArgs') }}
        </h3>
        <div class="sec-body">
          <p class="sec-desc" style="margin-bottom:8px">{{ $t('settings.jvmArgsDesc') }}</p>
          <textarea class="textarea" v-model="s.jvmArgs" rows="3" placeholder="-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions ..." style="width:100%"></textarea>
        </div>
      </section>

      <!-- 内存管理（垃圾回收） -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" />
          </svg>
          {{ $t('settings.memoryManagement') }}
        </h3>
        <div class="sec-body">
          <div class="memory-alloc-card">
            <div class="mem-options">
              <label class="radio-item-k" :class="{ active: s.memoryManage === 'g1gc' }">
                <input type="radio" name="memoryManage" value="g1gc" v-model="s.memoryManage" />
                {{ $t('settings.g1gc') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.memoryManage === 'zgc' }">
                <input type="radio" name="memoryManage" value="zgc" v-model="s.memoryManage" />
                {{ $t('settings.zgc') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.memoryManage === 'parallel' }">
                <input type="radio" name="memoryManage" value="parallel" v-model="s.memoryManage" />
                {{ $t('settings.parallelGc') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.memoryManage === 'none' }">
                <input type="radio" name="memoryManage" value="none" v-model="s.memoryManage" />
                {{ $t('settings.noOptimize') }}
              </label>
            </div>
          </div>
        </div>
      </section>
      </div>

      <!-- Koring：Java 环境 / 内存 / JVM 参数 / 垃圾回收 -->
      <div v-else class="kor-c2">
        <KorSectionTitle>{{ $t('settings.gameJava') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.gameJava')" :desc="$t('settings.gameJavaDesc')">
            <div class="kor-inline">
              <KorSettingSelect v-model="selectedJavaPreset" :options="javaPresetOptions" :width="200" />
              <KorButton
                variant="outline"
                size="sm"
                :loading="isDetectingJava"
                @click="detectJava"
              >
                {{ isDetectingJava ? $t('settings.detecting') : $t('settings.detectJava') }}
              </KorButton>
            </div>
          </KorSettingRow>
          <KorSettingRow v-if="s.javaPreset === 'custom'" :label="$t('settings.custom')">
            <div class="kor-inline">
              <KorInput v-model="s.javaPath" placeholder="C:\Program Files\Java\..." class="kor-input--wide" />
              <KorButton variant="outline" size="sm" @click="browseJava">{{ $t('settings.browse') }}</KorButton>
            </div>
          </KorSettingRow>
          <KorSettingRow v-if="isDetectingJava" :label="currentStep" :desc="progressText">
            <div class="kor-inline">
              <KorProgress :value="progressPercent" :max="100" />
              <span class="kor-value">{{ progressPercent }}%</span>
            </div>
          </KorSettingRow>
          <KorSettingRow
            v-if="detectionComplete && detectedJava.length === 0"
            :label="$t('settings.noJavaDetected')"
            :desc="$t('settings.noJavaDetectedDesc')"
          >
            <KorButton variant="outline" size="sm" @click="openExternal('https://adoptium.net/')">
              {{ $t('settings.downloadEclipseTemurin') }}
            </KorButton>
          </KorSettingRow>
          <KorSettingRow
            v-for="java in detectedJava"
            :key="java.id"
            :label="`Java ${java.version}${java.vendor ? ' · ' + java.vendor : ''}`"
            :desc="java.path"
          >
            <KorButton variant="outline" size="sm" @click="selectJava(java)">
              {{ $t('settings.apply') }}
            </KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.javaMemory.memoryAllocation') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.javaMemory.autoConfig')">
            <KorSwitch
              :model-value="s.memoryMode === 'auto'"
              @update:model-value="(v: boolean) => (s.memoryMode = v ? 'auto' : 'custom')"
            />
          </KorSettingRow>
          <KorSettingRow
            v-if="s.memoryMode === 'custom'"
            :label="$t('settings.javaMemory.allocateMemory')"
            :desc="`1 GB - ${systemTotalGB} GB`"
          >
            <div class="kor-inline">
              <KorSlider
                v-model="s.memoryCustomGB"
                :min="1"
                :max="32"
                :step="0.5"
              />
              <span class="kor-value">{{ s.memoryCustomGB }} GB</span>
            </div>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.javaMemory.jvmExtraArgs') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.javaMemory.jvmExtraArgs')" :desc="$t('settings.jvmArgsDesc')">
            <template #below>
              <textarea
                class="textarea"
                v-model="s.jvmArgs"
                rows="3"
                placeholder="-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions ..."
                style="width: 100%"
              ></textarea>
            </template>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.memoryManagement') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.memoryManagement')">
            <KorSettingSelect v-model="s.memoryManage" :options="korGcOptions" :width="200" />
          </KorSettingRow>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 游戏目录 ========== -->
    <template v-if="activeCategory === 'game-dir'">
      <div v-if="appStore.skin !== 'koring'">
      <!-- 文件夹列表 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          {{ $t('component.folderList') }}
        </h3>
        <div class="sec-body">
          <div class="folder-list-container">
            <!-- 标题行：左边是文件夹列表标题，右边是操作按钮 -->
            <div class="folder-list-header">
              <h4 class="sidebar-subtitle">{{ $t('component.addOrImport') }}</h4>
              <div class="action-list">
                <button class="action-item" @click="addGameFolder">
                  <span class="action-icon add">＋</span>
                  <span>{{ $t('component.addExistingFolder') }}</span>
                </button>
                <button class="action-item" @click="importModpackFromSettings">
                  <span class="action-icon import">⬇</span>
                  <span>{{ $t('component.importModpack') }}</span>
                </button>
                <button v-if="!folderItems.some((f) => f.name === '.minecraft')" class="action-item"
                  @click="createMinecraftFolderHere">
                  <span class="action-icon create">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                  </span>
                  <span>{{ $t('component.createMinecraft') }}</span>
                </button>
              </div>
            </div>

            <!-- 有文件夹时：显示当前选中 + 列表 -->
            <template v-if="folderItems.length > 0">
              <div class="folder-content">
                <div class="current-folder">
                  <div class="cf-label">{{ $t('component.currentFolder') }}</div>
                  <div class="cf-top">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    <span class="cf-name">{{ currentFolderName || '/' }}</span>
                  </div>
                  <div class="cf-path">{{ currentFolderPath }}</div>
                  <span class="folder-remove cf-remove" @click.stop="removeFolder(currentFolderPath)"
                    :title="$t('component.remove')">✕</span>
                </div>

                <div v-for="folder in folderItems.filter((f) => !f.isActive)" :key="folder.path" class="folder-item"
                  @click="switchFolder(folder.path)">
                  <div class="fi-top">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    <span class="fi-name">{{ folder.name }}</span>
                  </div>
                  <div class="fi-path">{{ folder.path }}</div>
                  <span class="folder-remove" @click.stop="removeFolder(folder.path)"
                    :title="$t('component.remove')">✕</span>
                </div>
              </div>

              <div class="sidebar-divider"></div>
            </template>
          </div>
        </div>
      </section>

      <!-- 版本隔离 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          {{ $t('settings.versionIsolation') }}
        </h3>
        <div class="sec-body">
          <div class="row">
            <div class="row-main">
              <p class="row-desc">{{ $t('settings.versionIsolationDesc') }}</p>
            </div>
            <div class="row-control">
              <PxSelect v-model="s.versionIsolation" :options="versionIsolationOptions" />
            </div>
          </div>
        </div>
      </section>
      </div>

      <!-- Koring：文件夹列表 / 版本隔离 -->
      <div v-else class="kor-c2">
        <KorSectionTitle>{{ $t('component.folderList') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow
            v-for="folder in folderItems"
            :key="folder.path"
            :label="folder.name"
            :desc="folder.path"
          >
            <div class="kor-inline">
              <span v-if="folder.isActive" class="kor-hint">{{ $t('component.currentFolder') }}</span>
              <KorButton v-else variant="outline" size="sm" @click="switchFolder(folder.path)">
                {{ $t('settings.apply') }}
              </KorButton>
              <KorButton variant="danger" size="sm" @click="removeFolder(folder.path)">
                {{ $t('component.remove') }}
              </KorButton>
            </div>
          </KorSettingRow>
          <KorSettingRow v-if="folderItems.length === 0" :label="$t('component.addOrImport')">
            <KorButton variant="outline" size="sm" @click="addGameFolder">
              {{ $t('component.addExistingFolder') }}
            </KorButton>
          </KorSettingRow>
        </KorSettingCard>
        <div class="kor-inline kor-inline--end">
          <KorButton v-if="folderItems.length > 0" variant="outline" size="sm" @click="addGameFolder">
            {{ $t('component.addExistingFolder') }}
          </KorButton>
          <KorButton variant="outline" size="sm" @click="importModpackFromSettings">
            {{ $t('component.importModpack') }}
          </KorButton>
          <KorButton
            v-if="!folderItems.some((f) => f.name === '.minecraft')"
            variant="outline"
            size="sm"
            @click="createMinecraftFolderHere"
          >
            {{ $t('component.createMinecraft') }}
          </KorButton>
        </div>

        <KorSectionTitle>{{ $t('settings.versionIsolation') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.versionIsolation')" :desc="$t('settings.versionIsolationDesc')">
            <KorSettingSelect v-model="s.versionIsolation" :options="versionIsolationOptions" :width="200" />
          </KorSettingRow>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 高级设置 ========== -->
    <template v-if="activeCategory === 'advanced'">
      <div v-if="appStore.skin !== 'koring'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          {{ $t('settings.sidebar.advanced') }}
        </h3>
        <p class="sec-desc" style="margin:8px 0 0">{{ $t('settings.advancedSection.desc') }}</p>
      </section>
      <!-- 启动行为 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {{ $t('settings.advancedSection.launchBehavior') }}
        </h3>
        <div class="sec-body">
          <div class="memory-alloc-card" style="margin-bottom:12px">
            <div class="row" style="margin-bottom:0;padding:0;background:transparent;border:none;">
              <div class="row-main">
                <label class="row-label">{{ $t('settings.whenLaunching') }}</label>
              </div>
              <div class="row-control row-control--right-center">
                <div class="select-fit select-fit--wide">
                  <PxSelect v-model="launchVisibilityModel" :options="launchVisibilityOptions" />
                </div>
              </div>
            </div>
          </div>
          <div class="memory-alloc-card">
            <div class="row" style="margin-bottom:0;padding:0;background:transparent;border:none;">
              <div class="row-main">
                <label class="row-label">{{ $t('settings.processPriority') }}</label>
                <p class="row-desc" style="margin-bottom:0">{{ $t('settings.processPriorityDesc') }}</p>
              </div>
              <div class="row-control row-control--right-center">
                <div class="select-fit select-fit--wide">
                  <PxSelect v-model="processPriorityModel" :options="processPriorityOptions" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 窗口设置 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="8" x2="22" y2="8" />
          </svg>
          {{ $t('settings.advancedSection.windowSettings') }}
        </h3>
        <div class="sec-body">
          <div class="game-param-group" style="margin-bottom:16px">
            <label class="row-label" style="margin-bottom:4px">{{ $t('settings.windowTitle') }}</label>
            <p class="row-desc" style="margin-bottom:8px">{{ $t('settings.windowTitleDesc') }}</p>
            <input type="text" class="inp" v-model="s.windowTitle" placeholder="Minecraft {version}" style="width:100%" />
          </div>
          <div class="memory-alloc-card">
            <div class="row" style="margin-bottom:0;padding:0;background:transparent;border:none;">
              <div class="row-main">
                <label class="row-label">{{ $t('settings.windowSize') }}</label>
              </div>
              <div class="row-control row-control--right-center">
                <div class="select-fit select-fit--wide">
                  <PxSelect v-model="windowPresetModel" :options="windowPresetOptions" />
                </div>
              </div>
            </div>
            <div v-if="s.windowPreset === 'custom'" class="mem-custom-row" style="margin-top:8px">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="sep">{{ $t('settings.advancedSection.width') }}</span>
                <input type="number" class="inp short" v-model="s.winW" placeholder="854" min="1" style="width:80px" />
                <span class="sep">&times;</span>
                <span class="sep">{{ $t('settings.advancedSection.height') }}</span>
                <input type="number" class="inp short" v-model="s.winH" placeholder="480" min="1" style="width:80px" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 游戏参数 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 17 10 11 4 5" /><polyline points="12 19 20 19" />
          </svg>
          {{ $t('settings.advancedSection.gameParams') }}
        </h3>
        <div class="sec-body">
          <div class="game-param-group" style="margin-bottom:16px">
            <label class="row-label" style="margin-bottom:4px">{{ $t('settings.gameArgs') }}</label>
            <p class="row-desc" style="margin-bottom:8px">{{ $t('settings.gameArgsDesc') }}</p>
            <textarea class="textarea" v-model="s.gameArgs" rows="2" placeholder="--tweakClass com.example.Tweak" style="width:100%"></textarea>
          </div>
          <div class="game-param-group">
            <label class="row-label" style="margin-bottom:4px">{{ $t('settings.preLaunchCmd') }}</label>
            <p class="row-desc" style="margin-bottom:8px">{{ $t('settings.preLaunchCmdDesc') }}</p>
            <input type="text" class="inp" v-model="s.preLaunchCmd" placeholder="taskkill /f /im java.exe" style="width:100%" />
          </div>
        </div>
      </section>

      <!-- 启动命令预览 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          {{ $t('settings.advancedSection.launchCommand') }}
        </h3>
        <div class="sec-body">
          <div class="row">
            <div class="row-control full">
              <textarea class="textarea" rows="4" readonly :value="launchCommandPreview" :placeholder="$t('settings.advancedSection.launchCommandPlaceholder')" style="font-family:var(--font-mono,monospace);font-size:12px"></textarea>
            </div>
          </div>
        </div>
      </section>

      <!-- 调试 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          {{ $t('settings.advancedSection.debug') }}
        </h3>
        <div class="sec-body">
          <div class="debug-mode-row">
            <div class="debug-mode-info">
              <span class="debug-mode-label">{{ $t('settings.debugMode') }}</span>
              <p class="debug-mode-desc">{{ $t('settings.advancedSection.debugModeDesc') }}</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="s.debugMode" @change="toggleDebugMode" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div v-if="s.debugMode" class="debug-card">
            <div class="skin-radio-group">
              <label class="skin-radio-item" :class="{ active: s.disableJavaLaunchWrapper }" @click="s.disableJavaLaunchWrapper = !s.disableJavaLaunchWrapper">
                <span class="skin-radio-dot" :class="{ checked: s.disableJavaLaunchWrapper }"></span>
                {{ $t('settings.disableJavaLaunchWrapper') }}
              </label>
              <label class="skin-radio-item" :class="{ active: s.disableLwjglUnsafeAgent }" @click="s.disableLwjglUnsafeAgent = !s.disableLwjglUnsafeAgent">
                <span class="skin-radio-dot" :class="{ checked: s.disableLwjglUnsafeAgent }"></span>
                {{ $t('settings.disableLwjglUnsafeAgent') }}
              </label>
              <label class="skin-radio-item" :class="{ active: s.useHighPerformanceGPU }" @click="s.useHighPerformanceGPU = !s.useHighPerformanceGPU">
                <span class="skin-radio-dot" :class="{ checked: s.useHighPerformanceGPU }"></span>
                {{ $t('settings.useHighPerformanceGPU') }}
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- 离线皮肤 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          {{ $t('settings.offlineSkin') }}
        </h3>
        <div class="sec-body">
          <div class="skin-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {{ $t('settings.skinWarning') }}
          </div>
          <div class="skin-radio-group">
            <label class="skin-radio-item" v-for="opt in skinOptions" :key="opt.value" :class="{ active: s.offlineSkin === opt.value }" @click="onSkinSelect(opt.value)">
              <span class="skin-radio-dot" :class="{ checked: s.offlineSkin === opt.value }"></span>
              {{ opt.label }}
            </label>
          </div>
          <div class="skin-expand" v-if="s.offlineSkin === 'official'">
            <div class="skin-expand-row">
              <label class="skin-expand-label">{{ $t('settings.officialPlayerName') }}</label>
              <input type="text" class="inp skin-expand-inp" v-model="s.officialSkinName" placeholder="" />
            </div>
            <div class="skin-expand-actions">
              <button class="btn-outline" @click="saveSkin">{{ $t('settings.skinSave') }}</button>
              <button class="btn-outline" @click="refreshSkin">{{ $t('settings.skinRefresh') }}</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 全局快捷键 -->
      <div class="memory-alloc-card">
        <div style="margin-bottom: 12px">
          <div class="debug-mode-label">{{ $t('settings.globalHotkeys') }}</div>
          <div class="debug-mode-desc">{{ $t('settings.hotkeyDesc') }} <code>Ctrl+Shift+L</code>、<code>Alt+F12</code></div>
        </div>
        <div class="mem-custom-row" style="margin-bottom:10px">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.launchGame') }}</label>
            <p class="row-desc">{{ $t('settings.launchGameDesc') }}</p>
          </div>
          <div class="input-group compact" style="flex:1;max-width:260px">
            <input type="text" class="inp" v-model="s.hotkeyLaunch" placeholder="Ctrl+Shift+L" />
            <button class="btn-sm" @click="updateHotkey('launch-game', s.hotkeyLaunch)">{{ $t('settings.save') }}</button>
          </div>
        </div>
        <div class="mem-custom-row" style="margin-bottom:10px">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.toggleWindow') }}</label>
            <p class="row-desc">{{ $t('settings.toggleWindowDesc') }}</p>
          </div>
          <div class="input-group compact" style="flex:1;max-width:260px">
            <input type="text" class="inp" v-model="s.hotkeyToggleWindow" placeholder="Ctrl+Shift+H" />
            <button class="btn-sm" @click="updateHotkey('toggle-window', s.hotkeyToggleWindow)">{{ $t('settings.save') }}</button>
          </div>
        </div>
        <div class="mem-custom-row" style="margin-bottom:10px">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.openHome') }}</label>
            <p class="row-desc">{{ $t('settings.openHomeDesc') }}</p>
          </div>
          <div class="input-group compact" style="flex:1;max-width:260px">
            <input type="text" class="inp" v-model="s.hotkeyOpenHome" placeholder="Ctrl+Shift+O" />
            <button class="btn-sm" @click="updateHotkey('open-home', s.hotkeyOpenHome)">{{ $t('settings.save') }}</button>
          </div>
        </div>
        <div class="mem-custom-row" style="margin-bottom:10px">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.openSettings') }}</label>
            <p class="row-desc">{{ $t('settings.openSettingsDesc') }}</p>
          </div>
          <div class="input-group compact" style="flex:1;max-width:260px">
            <input type="text" class="inp" v-model="s.hotkeyOpenSettings" placeholder="Ctrl+," />
            <button class="btn-sm" @click="updateHotkey('open-settings', s.hotkeyOpenSettings)">{{ $t('settings.save') }}</button>
          </div>
        </div>
        <div class="btn-row" style="padding-top:6px">
          <button class="action-btn outline" @click="reloadHotkeys">{{ $t('settings.reloadHotkeys') }}</button>
        </div>
      </div>
      </div>

      <!-- Koring：高级设置 -->
      <div v-else class="kor-c2">
        <KorSectionTitle>{{ $t('settings.advancedSection.launchBehavior') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.whenLaunching')">
            <KorSettingSelect v-model="launchVisibilityModel" :options="launchVisibilityOptions" :width="200" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.processPriority')" :desc="$t('settings.processPriorityDesc')">
            <KorSettingSelect v-model="processPriorityModel" :options="processPriorityOptions" :width="200" />
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.advancedSection.windowSettings') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.windowTitle')" :desc="$t('settings.windowTitleDesc')">
            <KorInput v-model="s.windowTitle" class="kor-input--wide" placeholder="Minecraft {version}" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.windowSize')">
            <KorSettingSelect v-model="windowPresetModel" :options="windowPresetOptions" :width="200" />
          </KorSettingRow>
          <KorSettingRow v-if="s.windowPreset === 'custom'" :label="$t('settings.advancedSection.width')">
            <div class="kor-inline">
              <KorSettingNumberField v-model="s.winW" :min="1" />
              <span class="kor-hint">×</span>
              <KorSettingNumberField v-model="s.winH" :min="1" />
            </div>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.advancedSection.gameParams') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.gameArgs')" :desc="$t('settings.gameArgsDesc')">
            <template #below>
              <textarea class="textarea" v-model="s.gameArgs" rows="2" placeholder="--tweakClass com.example.Tweak" style="width: 100%"></textarea>
            </template>
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.preLaunchCmd')" :desc="$t('settings.preLaunchCmdDesc')">
            <KorInput v-model="s.preLaunchCmd" class="kor-input--wide" placeholder="taskkill /f /im java.exe" />
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.advancedSection.launchCommand') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.advancedSection.launchCommand')">
            <template #below>
              <textarea
                class="textarea kor-mono"
                rows="4"
                readonly
                :value="launchCommandPreview"
                :placeholder="$t('settings.advancedSection.launchCommandPlaceholder')"
              ></textarea>
            </template>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.advancedSection.debug') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.debugMode')" :desc="$t('settings.advancedSection.debugModeDesc')">
            <KorSwitch v-model="s.debugMode" @update:model-value="toggleDebugMode" />
          </KorSettingRow>
          <KorSettingRow v-if="s.debugMode" :label="$t('settings.disableJavaLaunchWrapper')">
            <KorSwitch v-model="s.disableJavaLaunchWrapper" />
          </KorSettingRow>
          <KorSettingRow v-if="s.debugMode" :label="$t('settings.disableLwjglUnsafeAgent')">
            <KorSwitch v-model="s.disableLwjglUnsafeAgent" />
          </KorSettingRow>
          <KorSettingRow v-if="s.debugMode" :label="$t('settings.useHighPerformanceGPU')">
            <KorSwitch v-model="s.useHighPerformanceGPU" />
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.offlineSkin') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.offlineSkin')" :desc="$t('settings.skinWarning')">
            <KorSettingSelect
              :model-value="s.offlineSkin"
              :options="skinOptions"
              :width="180"
              @update:model-value="onSkinSelect"
            />
          </KorSettingRow>
          <KorSettingRow v-if="s.offlineSkin === 'official'" :label="$t('settings.officialPlayerName')">
            <div class="kor-inline">
              <KorInput v-model="s.officialSkinName" class="kor-input--wide" />
              <KorButton variant="outline" size="sm" @click="saveSkin">{{ $t('settings.skinSave') }}</KorButton>
              <KorButton variant="outline" size="sm" @click="refreshSkin">{{ $t('settings.skinRefresh') }}</KorButton>
            </div>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.globalHotkeys') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.launchGame')" :desc="$t('settings.launchGameDesc')">
            <div class="kor-inline">
              <KorInput v-model="s.hotkeyLaunch" placeholder="Ctrl+Shift+L" class="kor-input--short" />
              <KorButton variant="outline" size="sm" @click="updateHotkey('launch-game', s.hotkeyLaunch)">
                {{ $t('settings.save') }}
              </KorButton>
            </div>
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.toggleWindow')" :desc="$t('settings.toggleWindowDesc')">
            <div class="kor-inline">
              <KorInput v-model="s.hotkeyToggleWindow" placeholder="Ctrl+Shift+H" class="kor-input--short" />
              <KorButton variant="outline" size="sm" @click="updateHotkey('toggle-window', s.hotkeyToggleWindow)">
                {{ $t('settings.save') }}
              </KorButton>
            </div>
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.openHome')" :desc="$t('settings.openHomeDesc')">
            <div class="kor-inline">
              <KorInput v-model="s.hotkeyOpenHome" placeholder="Ctrl+Shift+O" class="kor-input--short" />
              <KorButton variant="outline" size="sm" @click="updateHotkey('open-home', s.hotkeyOpenHome)">
                {{ $t('settings.save') }}
              </KorButton>
            </div>
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.openSettings')" :desc="$t('settings.openSettingsDesc')">
            <div class="kor-inline">
              <KorInput v-model="s.hotkeyOpenSettings" placeholder="Ctrl+," class="kor-input--short" />
              <KorButton variant="outline" size="sm" @click="updateHotkey('open-settings', s.hotkeyOpenSettings)">
                {{ $t('settings.save') }}
              </KorButton>
            </div>
          </KorSettingRow>
        </KorSettingCard>
        <div class="kor-inline kor-inline--end">
          <KorButton variant="outline" size="sm" @click="reloadHotkeys">{{ $t('settings.reloadHotkeys') }}</KorButton>
        </div>
      </div>
    </template>

    <!-- ========== 个性化 ========== -->
    <template v-if="activeCategory === 'personalize'">

      <!-- Koring 排版：整套 Koring 风格（在「主题预设」中选择 Koring 并重启后生效） -->
      <div v-if="appStore.skin === 'koring'" class="kor-page">
        <KorPageHeader :title="$t('settings.themeBg')" :desc="$t('settings.themeBgDesc')" />

        <section class="kor-section">
          <KorSectionTitle>{{ $t('settings.darkMode') }}</KorSectionTitle>
          <KorSettingCard flush>
          <div class="kor-theme-row">
              <ThemeModeCard
                v-for="opt in themePreviewOptions"
                :key="opt.value"
                :mode="opt.value"
                :selected="appStore.theme === opt.value"
                @select="onSelectThemeMode(opt.value)"
              />
            </div>
          </KorSettingCard>
        </section>

        <section class="kor-section">
          <KorSectionTitle>{{ $t('settings.skinSection') }}</KorSectionTitle>
          <KorSettingCard flush>
          <div class="kor-theme-row">
              <SkinPresetCard
                v-for="opt in layoutOptions"
                :key="opt.value"
                :skin="opt.value"
                :selected="appStore.skin === opt.value"
                @select="onSelectSkin(opt.value)"
              />
            </div>
          </KorSettingCard>
        </section>

        <section class="kor-section">
          <KorSectionTitle>{{ $t('settings.customThemeColor') }}</KorSectionTitle>
          <div class="kor-cards">
            <KorSettingCard>
              <div class="kor-row">
                <div class="kor-row-main">
                  <div class="kor-row-label">{{ $t('settings.themePresets') }}</div>
                  <div class="kor-row-desc">{{ $t('settings.themePresetsDesc') }}</div>
                </div>
              </div>
              <div class="kor-swatch-group" style="margin-top: 12px">
                <button
                  v-for="p in themePresets"
                  :key="p.id"
                  type="button"
                  class="kor-swatch"
                  :class="{ 'is-active': isPresetColorActive(p.themeColor) }"
                  :style="{ background: p.themeColor }"
                  :title="p.name"
                  @click="selectPresetColor(p.themeColor, p.accentColor)"
                />
                <button
                  type="button"
                  class="kor-swatch"
                  :class="{ 'is-active': isCustomColorActive }"
                  :style="{ background: s.themeCustomColor }"
                  :title="$t('settings.customPreset')"
                  @click="focusCustomColorInput"
                >
                  <span class="kor-swatch-custom-dot">+</span>
                </button>
              </div>
              <div class="kor-custom-row">
                <div class="kor-inline">
                  <span class="kor-color-chip" :style="{ background: s.themeCustomColor }" />
                  <input
                    ref="customColorInputRef"
                    v-model="s.themeCustomColor"
                    class="kor-input"
                    type="text"
                    maxlength="7"
                    style="width: 104px"
                    @input="previewThemeColor(s.themeCustomColor)"
                  />
                  <button type="button" class="kor-btn kor-btn--primary" @click="applyCustomThemeColor(s.themeCustomColor)">
                    {{ $t('settings.apply') }}
                  </button>
                </div>
                <div class="kor-preview-bar">
                  <span v-for="(c, i) in pendingColorScale" :key="i" class="kor-preview-chip" :style="{ background: c }" />
                </div>
              </div>
            </KorSettingCard>
            <KorSettingCard>
              <div class="kor-row">
                <div class="kor-row-main">
                  <div class="kor-row-label">{{ $t('settings.themeFile') }}</div>
                  <div class="kor-row-desc">{{ $t('settings.themeFileDesc') }}</div>
                </div>
                <div class="kor-row-control kor-inline">
                  <button type="button" class="kor-btn" @click="exportCurrentTheme">{{ $t('settings.exportTheme') }}</button>
                  <button type="button" class="kor-btn" @click="importThemeFile">{{ $t('settings.importTheme') }}</button>
                </div>
              </div>
            </KorSettingCard>
          </div>
        </section>

        <section class="kor-section">
          <KorSectionTitle>{{ $t('settings.background') }}</KorSectionTitle>
          <div class="kor-cards">
            <KorSettingCard>
              <KorSettingRow :label="$t('settings.bgMode')" :desc="$t('settings.bgModeDesc')">
                <KorSelect v-model="bgImageModeModel" :options="bgImageOptions" />
              </KorSettingRow>
            </KorSettingCard>
            <KorSettingCard v-if="appStore.bgImageMode === 'custom'">
              <KorSettingRow :label="$t('settings.bgImage')" :desc="$t('settings.bgImageDesc')">
                <button type="button" class="kor-btn" @click="browseBgImage">{{ $t('settings.selectImageBtn') }}</button>
              </KorSettingRow>
              <div v-if="bgImagePreviewUrl" class="kor-preview">
                <img :src="bgImagePreviewUrl" alt="" @error="onBgPreviewError" />
              </div>
              <div v-else class="kor-empty">{{ $t('settings.noBgImageSelected') }}</div>
            </KorSettingCard>
            <KorSettingCard v-if="appStore.bgImageMode === 'custom'">
              <KorSettingRow :label="$t('settings.bgBlur')" :desc="`${$t('settings.bgBlurDesc')} · ${appStore.themeBgBlur}px`">
                <KorSlider
                  :model-value="appStore.themeBgBlur"
                  :min="0"
                  :max="20"
                  @update:model-value="appStore.setThemeBgBlur($event)"
                />
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.bgDim')" :desc="`${$t('settings.bgDimDesc')} · ${appStore.bgDimAmount}%`">
                <KorSlider
                  :model-value="appStore.bgDimAmount"
                  :min="0"
                  :max="100"
                  :step="5"
                  @update:model-value="appStore.setBgDimAmount($event)"
                />
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.colorOverlay')">
                <div class="kor-inline">
                  <input
                    v-if="appStore.bgColorOverlay"
                    type="color"
                    class="kor-color-input"
                    :value="appStore.bgOverlayColor"
                    @input="appStore.setBgOverlayColor(($event.target as HTMLInputElement).value)"
                  />
                  <KorSettingSwitch
                    :model-value="appStore.bgColorOverlay"
                    @update:model-value="appStore.setBgColorOverlay($event)"
                  />
                </div>
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.bgParallax')" :desc="$t('settings.bgParallaxDesc')">
                <KorSettingSwitch
                  :model-value="appStore.bgParallax"
                  @update:model-value="appStore.setBgParallax($event)"
                />
              </KorSettingRow>
            </KorSettingCard>
            <KorSettingCard>
              <KorSettingRow :label="$t('settings.bgMusic')" :desc="$t('settings.bgMusicDesc')">
                <KorSelect v-model="s.bgMusicMode" :options="bgMusicOptions" />
              </KorSettingRow>
            </KorSettingCard>
            <KorSettingCard>
              <KorSettingRow :label="$t('settings.restoreDefaultBg')" :desc="$t('settings.restoreDefaultBgDesc')">
                <button type="button" class="kor-btn kor-btn--danger" @click="onResetBackground">
                  {{ $t('settings.restoreDefaultBg') }}
                </button>
              </KorSettingRow>
            </KorSettingCard>
          </div>
        </section>

      </div>

      <template v-else>
      <!-- 外观（显示模式） -->
      <div class="memory-alloc-card" style="margin-top: 12px">
        <div style="margin-bottom: 12px">
          <div class="debug-mode-label">{{ $t('settings.appearance') }}</div>
        </div>

        <!-- 主题模式（仅切换界面明暗，不涉及排版） -->
        <div style="margin-top: 14px">
          <label class="row-label" style="margin-bottom:6px;display:block">{{ $t('settings.themeMode') }}</label>
          <p class="row-desc" style="margin-bottom:10px">{{ $t('settings.themeModeDesc') }}</p>
          <div class="kor-theme-row kor-theme-row--start">
            <ThemeModeCard
              v-for="opt in themePreviewOptions"
              :key="opt.value"
              :mode="opt.value"
              :selected="appStore.theme === opt.value"
              @select="onSelectThemeMode(opt.value)"
            />
          </div>
        </div>
      </div>

      <!-- 主题预设（整体排版） -->
      <div class="memory-alloc-card" style="margin-top: 12px">
        <div style="margin-bottom: 12px">
          <div class="debug-mode-label">{{ $t('settings.skinSection') }}</div>
        </div>

        <p class="row-desc" style="margin-bottom:10px">{{ $t('settings.skinSectionDesc') }}</p>
        <div class="kor-theme-row kor-theme-row--start">
          <SkinPresetCard
            v-for="opt in layoutOptions"
            :key="opt.value"
            :skin="opt.value"
            :selected="appStore.skin === opt.value"
            @select="onSelectSkin(opt.value)"
          />
        </div>

        <!-- 导入/导出主题 -->
        <div style="margin-top:14px;display:flex;gap:8px">
          <button class="btn vox-btn vox-btn--secondary btn-sm" @click="exportCurrentTheme">{{ $t('settings.exportTheme') }}</button>
          <button class="btn vox-btn vox-btn--secondary btn-sm" @click="importThemeFile">{{ $t('settings.importTheme') }}</button>
        </div>
      </div>

      <!-- 自定义主题颜色 -->
      <div class="memory-alloc-card" style="margin-top: 12px">
        <div style="margin-bottom: 12px">
          <div class="debug-mode-label">{{ $t('settings.customThemeColor') }}</div>
        </div>

        <p class="row-desc" style="margin-bottom:10px">{{ $t('settings.themePresetsDesc') }}</p>
        <div class="preset-gallery">
          <button
            v-for="p in themePresets"
            :key="p.id"
            class="preset-card"
            :class="{ active: isPresetColorActive(p.themeColor) }"
            @click="selectPresetColor(p.themeColor, p.accentColor)"
          >
            <span class="preset-swatch" :style="{ background: p.themeColor }"></span>
            <span class="preset-name">{{ p.name }}</span>
          </button>
          <!-- 自定义：手动输入色号后高亮到这里 -->
          <button
            class="preset-card"
            :class="{ active: isCustomColorActive }"
            @click="focusCustomColorInput"
          >
            <span class="preset-swatch preset-swatch--custom" :style="{ background: s.themeCustomColor }"></span>
            <span class="preset-name">{{ $t('settings.customPreset') }}</span>
          </button>
        </div>

        <!-- 取色器/色号 与 主色预览：左右排版 -->
        <div class="theme-custom-row">
          <div class="input-group compact" style="align-items:center;gap:8px">
            <div ref="customColorSwatchRef" class="color-swatch" :style="{ background: s.themeCustomColor }">
              <input
                type="color"
                v-model="s.themeCustomColor"
                @input="onCustomColorInput(s.themeCustomColor)"
                class="color-picker-input"
              />
            </div>
            <input
              ref="customColorInputRef"
              type="text"
              class="inp"
              v-model="s.themeCustomColor"
              style="width:80px;font-family:var(--voxver-font-mono)"
              @input="previewThemeColor(s.themeCustomColor)"
              @change="previewThemeColor(s.themeCustomColor)"
            />
            <button class="btn-sm vox-btn--primary" @click="applyCustomThemeColor(s.themeCustomColor)">
              {{ $t('settings.apply') }}
            </button>
          </div>

          <div class="theme-preview-bar">
            <div class="preview-chip" v-for="(c, i) in pendingColorScale" :key="i" :style="{ background: c }"></div>
          </div>
        </div>
      </div>


      <!-- 背景（Koring 风格卡片布局） -->
      <div class="memory-alloc-card" style="margin-top: 12px">
        <div style="margin-bottom: 12px">
          <div class="debug-mode-label">{{ $t('settings.background') }}</div>
        </div>

        <div class="bg-card-list">
          <!-- 背景图片 -->
          <div class="bg-card-row">
            <div class="bg-card-main">
              <div class="row-label">{{ $t('settings.bgImage') }}</div>
              <div class="row-desc">{{ $t('settings.bgImageDesc') }}</div>
            </div>
            <div class="bg-card-control">
              <PxSelect v-model="bgImageModeModel" :options="bgImageOptions" />
              <button v-if="appStore.bgImageMode === 'custom'" class="btn-sm" @click="browseBgImage">
                {{ $t('settings.selectImageBtn') }}
              </button>
            </div>
          </div>

          <!-- 背景预览图 -->
          <div v-if="appStore.bgImageMode === 'custom' && appStore.bgImagePath" class="bg-preview-wrap">
            <img :src="bgImagePreviewUrl" :alt="$t('settings.bgPreview')" class="bg-preview-img" @error="onBgPreviewError" />
          </div>

          <!-- 背景模糊 -->
          <div v-if="appStore.bgImageMode === 'custom'" class="bg-card-row">
            <div class="bg-card-main">
              <div class="row-label">{{ $t('settings.bgBlur') }}</div>
              <div class="row-desc">{{ $t('settings.bgBlurDesc') }}，{{ appStore.themeBgBlur }}px</div>
            </div>
            <div class="bg-card-control" style="flex:1;max-width:220px">
              <input type="range" class="range" style="width:100%" :value="appStore.themeBgBlur" @input="appStore.setThemeBgBlur(Number(($event.target as HTMLInputElement).value))" min="0" max="20" step="1" />
            </div>
          </div>

          <!-- 背景暗化 -->
          <div v-if="appStore.bgImageMode === 'custom'" class="bg-card-row">
            <div class="bg-card-main">
              <div class="row-label">{{ $t('settings.bgDim') }}</div>
              <div class="row-desc">{{ $t('settings.bgDimDesc') }}，{{ appStore.bgDimAmount }}%</div>
            </div>
            <div class="bg-card-control" style="flex:1;max-width:220px">
              <input type="range" class="range" style="width:100%" :value="appStore.bgDimAmount" @input="appStore.setBgDimAmount(Number(($event.target as HTMLInputElement).value))" min="0" max="100" step="5" />
            </div>
          </div>

          <!-- 颜色叠加 -->
          <div v-if="appStore.bgImageMode === 'custom'" class="bg-card-row">
            <div class="bg-card-main">
              <div class="row-label">{{ $t('settings.colorOverlay') }}</div>
            </div>
            <div class="bg-card-control">
              <label class="toggle-switch">
                <input type="checkbox" :checked="appStore.bgColorOverlay" @change="appStore.setBgColorOverlay(($event.target as HTMLInputElement).checked)" />
                <span class="toggle-slider"></span>
              </label>
              <input
                v-if="appStore.bgColorOverlay"
                type="color"
                class="color-picker"
                :value="appStore.bgOverlayColor"
                @input="appStore.setBgOverlayColor(($event.target as HTMLInputElement).value)"
                style="width: 36px; height: 36px; border: none; border-radius: var(--voxver-radius-sm); cursor: pointer; flex-shrink: 0"
              />
            </div>
          </div>

          <!-- 背景图片视差 -->
          <div v-if="appStore.bgImageMode === 'custom'" class="bg-card-row">
            <div class="bg-card-main">
              <div class="row-label">{{ $t('settings.bgParallax') }}</div>
              <div class="row-desc">{{ $t('settings.bgParallaxDesc') }}</div>
            </div>
            <div class="bg-card-control">
              <label class="toggle-switch">
                <input type="checkbox" :checked="appStore.bgParallax" @change="appStore.setBgParallax(($event.target as HTMLInputElement).checked)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 背景音乐 -->
          <div class="bg-card-row">
            <div class="bg-card-main">
              <div class="row-label">{{ $t('settings.bgMusic') }}</div>
              <div class="row-desc">{{ $t('settings.bgMusicDesc') }}</div>
            </div>
            <div class="bg-card-control">
              <PxSelect v-model="s.bgMusicMode" :options="bgMusicOptions" />
              <button v-if="s.bgMusicMode === 'custom'" class="btn-sm">{{ $t('settings.selectFolder') }}</button>
            </div>
          </div>

          <!-- 恢复默认 -->
          <div class="bg-card-row">
            <div class="bg-card-main">
              <div class="row-label">{{ $t('settings.restoreDefaultBg') }}</div>
              <div class="row-desc">{{ $t('settings.restoreDefaultBgDesc') }}</div>
            </div>
            <div class="bg-card-control">
              <button class="btn-sm btn-destructive" @click="onResetBackground">{{ $t('settings.restoreDefaultBg') }}</button>
            </div>
          </div>
        </div>
      </div>
      </template>
    </template>

    <!-- ========== 主界面 ========== -->
    <template v-if="activeCategory === 'interface'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          {{ $t('settings.sidebar.interface') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.interface.desc') }}</p>

        <!-- 标题栏 -->
        <div class="memory-alloc-card" style="margin-top: 12px">
          <div style="margin-bottom: 10px">
            <div class="debug-mode-label">{{ $t('settings.titlebar') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.titlebarMode') }}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="skin-radio-item" :class="{ active: s.titleBarMode === 'default' }" @click="s.titleBarMode = 'default'">
              <span class="skin-radio-dot" :class="{ checked: s.titleBarMode === 'default' }"></span>
              {{ $t('settings.defaultTitlebar') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.titleBarMode === 'none' }" @click="s.titleBarMode = 'none'">
              <span class="skin-radio-dot" :class="{ checked: s.titleBarMode === 'none' }"></span>
              {{ $t('settings.hideTitlebar') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.titleBarMode === 'text' }" @click="s.titleBarMode = 'text'">
              <span class="skin-radio-dot" :class="{ checked: s.titleBarMode === 'text' }"></span>
              {{ $t('settings.textOnly') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.titleBarMode === 'image' }" @click="s.titleBarMode = 'image'">
              <span class="skin-radio-dot" :class="{ checked: s.titleBarMode === 'image' }"></span>
              {{ $t('settings.customImageTitlebar') }}
            </label>
          </div>
        </div>

        <!-- 主页 -->
        <div class="memory-alloc-card" style="margin-top: 12px">
          <div style="margin-bottom: 10px">
            <div class="debug-mode-label">{{ $t('settings.homepage') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.homepageContent') }}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="skin-radio-item" :class="{ active: s.homeContent === 'blank' }" @click="s.homeContent = 'blank'">
              <span class="skin-radio-dot" :class="{ checked: s.homeContent === 'blank' }"></span>
              {{ $t('settings.blankPage') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.homeContent === 'preset' }" @click="s.homeContent = 'preset'">
              <span class="skin-radio-dot" :class="{ checked: s.homeContent === 'preset' }"></span>
              {{ $t('settings.presetHomepage') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.homeContent === 'local' }" @click="s.homeContent = 'local'">
              <span class="skin-radio-dot" :class="{ checked: s.homeContent === 'local' }"></span>
              {{ $t('settings.localFile') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.homeContent === 'online' }" @click="s.homeContent = 'online'">
              <span class="skin-radio-dot" :class="{ checked: s.homeContent === 'online' }"></span>
              {{ $t('settings.onlineUpdate') }}
            </label>
          </div>
        </div>

      </section>

      <!-- Koring 排版 -->
      <section v-else class="kor-section">
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.titlebar')" :desc="$t('settings.titlebarMode')">
            <KorSettingSelect v-model="s.titleBarMode" :options="korTitleBarOptions" :width="200" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.homepage')" :desc="$t('settings.homepageContent')">
            <KorSettingSelect v-model="s.homeContent" :options="korHomeOptions" :width="200" />
          </KorSettingRow>
        </KorSettingCard>
      </section>
    </template>

    <!-- ========== 语言 ========== -->
    <template v-if="activeCategory === 'language'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          {{ $t('settings.sidebar.lang') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.languageSubtitle') }}</p>

        <!-- 界面语言 - 卡片选择 -->
        <div style="margin-top:14px">
          <label class="row-label" style="margin-bottom:8px;display:block">{{ $t('settings.interfaceLanguage') }}</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <label class="lang-card" :class="{ active: s.lang === 'zh-CN' }" @click="s.lang = 'zh-CN'">
              <span class="lang-flag">简</span>
              <div class="lang-info">
                <span class="lang-name">{{ $t('settings.langZhCN') }}</span>
                <span class="lang-desc">{{ $t('settings.langZhCNDesc') }}</span>
              </div>
              <span class="lang-check" v-if="s.lang === 'zh-CN'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
            </label>
            <label class="lang-card" :class="{ active: s.lang === 'en-US' }" @click="s.lang = 'en-US'">
              <span class="lang-flag">En</span>
              <div class="lang-info">
                <span class="lang-name">{{ $t('settings.langEnUS') }}</span>
                <span class="lang-desc">{{ $t('settings.langEnUSDesc') }}</span>
              </div>
              <span class="lang-check" v-if="s.lang === 'en-US'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
            </label>
          </div>
        </div>

        <!-- 日期时间格式 -->
        <div style="margin-top:20px">
          <label class="row-label" style="margin-bottom:4px;display:block">{{ $t('settings.dateFormat') }}</label>
          <p class="sec-desc" style="margin-bottom:8px">{{ $t('settings.dateFormatDesc') }}</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <label class="skin-radio-item" :class="{ active: s.dateFormat === 'follow' }" @click="s.dateFormat = 'follow'">
              <span class="skin-radio-dot" :class="{ checked: s.dateFormat === 'follow' }"></span>
              <div style="display:flex;flex-direction:column;gap:2px">
                <span>{{ $t('settings.dateFollowLang') }}</span>
                <span class="row-hint">{{ $t('settings.dateFollowLangDesc') }}</span>
              </div>
            </label>
            <label class="skin-radio-item" :class="{ active: s.dateFormat === '24h' }" @click="s.dateFormat = '24h'">
              <span class="skin-radio-dot" :class="{ checked: s.dateFormat === '24h' }"></span>
              <div style="display:flex;flex-direction:column;gap:2px">
                <span>{{ $t('settings.date24h') }}</span>
                <span class="row-hint">{{ $t('settings.date24hDesc') }}</span>
              </div>
            </label>
            <label class="skin-radio-item" :class="{ active: s.dateFormat === '12h' }" @click="s.dateFormat = '12h'">
              <span class="skin-radio-dot" :class="{ checked: s.dateFormat === '12h' }"></span>
              <div style="display:flex;flex-direction:column;gap:2px">
                <span>{{ $t('settings.date12h') }}</span>
                <span class="row-hint">{{ $t('settings.date12hDesc') }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 参与翻译 -->
        <div class="memory-alloc-card" style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="about-logo" style="width:40px;height:40px;border-radius: var(--voxver-radius-md);flex-shrink:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M5 8l6 6" />
                <path d="M4 14l6-6 2-3" />
                <path d="M2 9h6" />
                <path d="M10 2v6" />
                <path d="M14 21v-4a2 2 0 012-2h4" />
                <path d="M16 14l2 2 4-4" />
              </svg>
            </div>
            <div>
              <label class="row-label">{{ $t('settings.contributeTranslation') }}</label>
              <p class="sec-desc" style="margin:2px 0 0">{{ $t('settings.contributeTranslationDesc') }}</p>
            </div>
          </div>
          <a class="action-btn small outline" href="https://github.com/MeowY-Studios/VoxVer-Launcher" target="_blank" rel="noopener" style="flex-shrink:0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            {{ $t('settings.goToTranslate') }}
          </a>
        </div>
      </section>

      <!-- Koring 排版 -->
      <section v-else class="kor-section">
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.interfaceLanguage')" :desc="$t('settings.languageSubtitle')">
            <KorSettingSelect v-model="s.lang" :options="korLangOptions" :width="200" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.dateFormat')" :desc="$t('settings.dateFormatDesc')">
            <KorSettingSelect v-model="s.dateFormat" :options="korDateFormatOptions" :width="200" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.contributeTranslation')" :desc="$t('settings.contributeTranslationDesc')">
            <KorButton variant="outline" size="sm" @click="openExternal('https://github.com/MeowY-Studios/VoxVer-Launcher')">
              {{ $t('settings.goToTranslate') }}
            </KorButton>
          </KorSettingRow>
        </KorSettingCard>
      </section>
    </template>

    <!-- ========== 辅助功能 ========== -->
    <template v-if="activeCategory === 'accessibility'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {{ $t('settings.sidebar.accessibility') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.accessibility.desc') }}</p>

        <!-- 屏幕阅读器模式 -->
        <div class="debug-mode-row">
          <div class="debug-mode-info">
            <div class="debug-mode-label">{{ $t('settings.accessibilityScreenReader') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.accessibilityScreenReaderDesc') }}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="s.accessibilityScreenReader" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 减少动画效果 -->
        <div class="debug-mode-row">
          <div class="debug-mode-info">
            <div class="debug-mode-label">{{ $t('settings.accessibilityReduceMotion') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.accessibilityReduceMotionDesc') }}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="s.accessibilityReduceMotion" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 高对比度模式 -->
        <div class="debug-mode-row">
          <div class="debug-mode-info">
            <div class="debug-mode-label">{{ $t('settings.accessibilityHighContrast') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.accessibilityHighContrastDesc') }}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="s.accessibilityHighContrast" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 键盘导航辅助 -->
        <div class="debug-mode-row">
          <div class="debug-mode-info">
            <div class="debug-mode-label">{{ $t('settings.accessibilityKeyboardNav') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.accessibilityKeyboardNavDesc') }}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="s.accessibilityKeyboardNav" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- 字体缩放 -->
        <div class="memory-alloc-card" style="margin-top: 12px">
          <div style="margin-bottom: 10px">
            <div class="debug-mode-label">{{ $t('settings.accessibilityFontScale') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.accessibilityFontScaleDesc') }}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="skin-radio-item" :class="{ active: s.accessibilityFontScale === 'default' }" @click="s.accessibilityFontScale = 'default'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityFontScale === 'default' }"></span>
              {{ $t('settings.accessibilityFontDefault') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.accessibilityFontScale === 'large' }" @click="s.accessibilityFontScale = 'large'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityFontScale === 'large' }"></span>
              {{ $t('settings.accessibilityFontLarge') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.accessibilityFontScale === 'xlarge' }" @click="s.accessibilityFontScale = 'xlarge'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityFontScale === 'xlarge' }"></span>
              {{ $t('settings.accessibilityFontXLarge') }}
            </label>
          </div>
        </div>

        <!-- 色觉辅助 -->
        <div class="memory-alloc-card" style="margin-top: 12px">
          <div style="margin-bottom: 10px">
            <div class="debug-mode-label">{{ $t('settings.accessibilityColorBlind') }}</div>
            <div class="debug-mode-desc">{{ $t('settings.accessibilityColorBlindDesc') }}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="skin-radio-item" :class="{ active: s.accessibilityColorBlind === 'none' }" @click="s.accessibilityColorBlind = 'none'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityColorBlind === 'none' }"></span>
              {{ $t('settings.accessibilityColorNone') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.accessibilityColorBlind === 'protanopia' }" @click="s.accessibilityColorBlind = 'protanopia'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityColorBlind === 'protanopia' }"></span>
              {{ $t('settings.accessibilityColorProtanopia') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.accessibilityColorBlind === 'deuteranopia' }" @click="s.accessibilityColorBlind = 'deuteranopia'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityColorBlind === 'deuteranopia' }"></span>
              {{ $t('settings.accessibilityColorDeuteranopia') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.accessibilityColorBlind === 'tritanopia' }" @click="s.accessibilityColorBlind = 'tritanopia'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityColorBlind === 'tritanopia' }"></span>
              {{ $t('settings.accessibilityColorTritanopia') }}
            </label>
            <label class="skin-radio-item" :class="{ active: s.accessibilityColorBlind === 'monochromat' }" @click="s.accessibilityColorBlind = 'monochromat'">
              <span class="skin-radio-dot" :class="{ checked: s.accessibilityColorBlind === 'monochromat' }"></span>
              {{ $t('settings.accessibilityColorMonochromat') }}
            </label>
          </div>
        </div>
      </section>

      <!-- Koring 排版 -->
      <section v-else class="kor-section">
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.accessibilityScreenReader')" :desc="$t('settings.accessibilityScreenReaderDesc')">
            <KorSettingSwitch v-model="s.accessibilityScreenReader" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.accessibilityReduceMotion')" :desc="$t('settings.accessibilityReduceMotionDesc')">
            <KorSettingSwitch v-model="s.accessibilityReduceMotion" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.accessibilityHighContrast')" :desc="$t('settings.accessibilityHighContrastDesc')">
            <KorSettingSwitch v-model="s.accessibilityHighContrast" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.accessibilityKeyboardNav')" :desc="$t('settings.accessibilityKeyboardNavDesc')">
            <KorSettingSwitch v-model="s.accessibilityKeyboardNav" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.accessibilityFontScale')" :desc="$t('settings.accessibilityFontScaleDesc')">
            <KorSettingSelect v-model="s.accessibilityFontScale" :options="korFontScaleOptions" :width="200" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.accessibilityColorBlind')" :desc="$t('settings.accessibilityColorBlindDesc')">
            <KorSettingSelect v-model="s.accessibilityColorBlind" :options="korColorBlindOptions" :width="200" />
          </KorSettingRow>
        </KorSettingCard>
      </section>
    </template>

    <!-- ========== 下载与网络 ========== -->
    <template v-if="activeCategory === 'download-net'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ $t('settings.sidebar.downloadNet') }}
        </h3>

        <!-- 服务 -->
        <div class="settings-group-title">{{ $t('settings.dlGroupService') }}</div>
        <div class="settings-card">
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.serviceConnectivity') }}</label>
            </div>
            <div class="row-control row-control--right-center">
              <button class="service-goto-btn" :title="$t('settings.serviceConnectivityEnter')" @click="openServiceTest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 源 -->
        <div class="settings-group-title">{{ $t('settings.dlGroupSource') }}</div>
        <div class="settings-card">
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.mirrorStrategy') }}</label>
            </div>
            <div class="row-control row-control--right-center">
              <div class="select-fit select-fit--wide">
                <PxSelect v-model="mirrorStrategyModel" :options="mirrorStrategyOptions" />
              </div>
            </div>
          </div>
        </div>

        <!-- 下载 -->
        <div class="settings-group-title">{{ $t('settings.dlGroupDownload') }}</div>
        <div class="settings-card">
          <!-- 同时下载数 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.downloadConcurrent') }}</label>
            </div>
            <div class="row-control row-control--right-center">
              <div class="select-fit">
                <PxSelect v-model="concurrentModel" :options="concurrentOptions" />
              </div>
            </div>
          </div>

          <!-- 最大下载线程 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.maxThreads') }}</label>
              <p class="row-desc">{{ threadsAuto ? $t('settings.threadsAutoOn') : $t('settings.threadsAutoOff') }}</p>
            </div>
            <div class="row-control row-control--right-center">
              <label class="toggle-switch" :title="threadsAuto ? $t('settings.threadsAutoOn') : $t('settings.threadsAutoOff')">
                <input type="checkbox" v-model="threadsAuto" @change="setThreadsAuto(threadsAuto)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 线程数（手动调节） -->
          <div v-if="!threadsAuto" class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.threadsCount') }}</label>
            </div>
            <div class="row-control row-control--right-center">
              <div class="input-group compact">
                <input type="range" class="range" v-model.number="downloadConfig.maxThreadsPerFile" min="1" max="64" step="1" @change="onThreadsChange" />
                <span class="range-val">{{ downloadConfig.maxThreadsPerFile }} {{ $t('settings.threads') }}</span>
              </div>
            </div>
          </div>

          <!-- 下载速度限制 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.speedLimit') }}</label>
              <p class="row-desc">{{ speedLimitAuto ? $t('settings.speedLimitAutoOn') : $t('settings.speedLimitAutoOff') }}</p>
            </div>
            <div class="row-control row-control--right-center">
              <label class="toggle-switch" :title="speedLimitAuto ? $t('settings.speedLimitAutoOn') : $t('settings.speedLimitAutoOff')">
                <input type="checkbox" v-model="speedLimitAuto" @change="setSpeedLimitAuto(speedLimitAuto)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 限速值（手动调节） -->
          <div v-if="!speedLimitAuto" class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.speedLimitValue') }}</label>
              <p class="row-desc">{{ $t('settings.speedLimitHint') }}</p>
            </div>
            <div class="row-control row-control--right-center">
              <div class="input-group compact">
                <input type="number" class="inp short" v-model.number="downloadConfig.speedLimit" min="0" step="128" @change="onSpeedLimitChange" />
                <span class="sep">KB/s</span>
              </div>
            </div>
          </div>

          <!-- 最大重试次数 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.downloadMaxRetries') }}</label>
              <p class="row-desc">{{ retriesAuto ? $t('settings.retriesAutoOn') : $t('settings.retriesAutoOff') }}</p>
            </div>
            <div class="row-control row-control--right-center">
              <label class="toggle-switch" :title="retriesAuto ? $t('settings.retriesAutoOn') : $t('settings.retriesAutoOff')">
                <input type="checkbox" v-model="retriesAuto" @change="setRetriesAuto(retriesAuto)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 重试次数（手动调节） -->
          <div v-if="!retriesAuto" class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.retriesCount') }}</label>
            </div>
            <div class="row-control row-control--right-center">
              <div class="input-group compact">
                <input type="range" class="range" v-model.number="downloadConfig.maxRetries" min="0" max="20" step="1" @change="onRetriesChange" />
                <span class="range-val">{{ downloadConfig.maxRetries }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>      <div v-else class="kor-c4">
        <KorSectionTitle>{{ $t('settings.dlGroupService') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.serviceConnectivity')">
            <KorButton variant="outline" size="sm" @click="openServiceTest">
              {{ $t('settings.serviceConnectivityEnter') }}
            </KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.dlGroupSource') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.mirrorStrategy')">
            <KorSettingSelect v-model="mirrorStrategyModel" :options="mirrorStrategyOptions" :width="180" />
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('settings.dlGroupDownload') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.downloadConcurrent')">
            <KorSettingSelect v-model="concurrentModel" :options="concurrentOptions" :width="140" />
          </KorSettingRow>
          <KorSettingRow
            :label="$t('settings.maxThreads')"
            :desc="threadsAuto ? $t('settings.threadsAutoOn') : $t('settings.threadsAutoOff')"
          >
            <KorSwitch v-model="threadsAuto" @update:model-value="(v: boolean) => setThreadsAuto(v)" />
          </KorSettingRow>
          <KorSettingRow v-if="!threadsAuto" :label="$t('settings.threadsCount')">
            <div class="kor-c4__slider">
              <KorSlider v-model="downloadConfig.maxThreadsPerFile" :min="1" :max="64" @update:model-value="onThreadsChange" />
              <span class="kor-value">{{ downloadConfig.maxThreadsPerFile }}</span>
            </div>
          </KorSettingRow>
          <KorSettingRow
            :label="$t('settings.speedLimit')"
            :desc="speedLimitAuto ? $t('settings.speedLimitAutoOn') : $t('settings.speedLimitAutoOff')"
          >
            <KorSwitch v-model="speedLimitAuto" @update:model-value="(v: boolean) => setSpeedLimitAuto(v)" />
          </KorSettingRow>
          <KorSettingRow v-if="!speedLimitAuto" :label="$t('settings.speedLimitValue')" :desc="$t('settings.speedLimitHint')">
            <div class="kor-c4__inline">
              <KorInput v-model.number="downloadConfig.speedLimit" type="number" class="kor-input--short" @change="onSpeedLimitChange" />
              <span class="kor-value">KB/s</span>
            </div>
          </KorSettingRow>
          <KorSettingRow
            :label="$t('settings.downloadMaxRetries')"
            :desc="retriesAuto ? $t('settings.retriesAutoOn') : $t('settings.retriesAutoOff')"
          >
            <KorSwitch v-model="retriesAuto" @update:model-value="(v: boolean) => setRetriesAuto(v)" />
          </KorSettingRow>
          <KorSettingRow v-if="!retriesAuto" :label="$t('settings.retriesCount')">
            <div class="kor-c4__slider">
              <KorSlider v-model="downloadConfig.maxRetries" :min="0" :max="20" @update:model-value="onRetriesChange" />
              <span class="kor-value">{{ downloadConfig.maxRetries }}</span>
            </div>
          </KorSettingRow>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 数据迁移（HMCL/PCL2） ========== -->
    <template v-if="activeCategory === 'data-migration'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
          {{ $t('settings.dataMigration.title') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.dataMigration.desc') }}</p>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.dataMigration.detect') }}</label>
            <p class="row-desc">{{ $t('settings.dataMigration.detectDesc') }}</p>
          </div>
          <div class="row-control">
            <button class="btn vox-btn vox-btn--secondary" @click="detectExternalLaunchers" :disabled="externalLaunchersLoading">
              {{ externalLaunchersLoading ? $t('settings.detecting') : $t('settings.dataMigration.detectBtn') }}
            </button>
          </div>
        </div>

        <!-- 检测结果 -->
        <div v-if="externalLaunchers.length > 0" class="data-migration-results">
          <div v-for="launcher in externalLaunchers" :key="launcher.type" class="migration-card">
            <div class="migration-card-header">
              <span class="migration-card-name">{{ launcher.name }}</span>
              <span class="migration-card-path">{{ launcher.path }}</span>
              <span class="migration-card-count">{{ $t('settings.instancesCount', { n: launcher.instances.length }) }}</span>
            </div>
            <div class="migration-instances">
              <div v-for="inst in launcher.instances" :key="inst.gameDir" class="migration-instance-item">
                <div class="migration-instance-info">
                  <span class="migration-instance-name">{{ inst.name }}</span>
                  <span class="migration-instance-meta">
                    MC {{ inst.version }}
                    <template v-if="inst.loaderType !== 'vanilla'"> | {{ inst.loaderType }} {{ inst.loaderVersion }}</template>
                    | {{ inst.modCount }} mods
                  </span>
                </div>
                <button
                  class="btn vox-btn vox-btn--secondary btn-sm"
                  @click="importExternalInstance(inst.gameDir)"
                >
                  {{ $t('common.import') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="externalLaunchersDetected === false && !externalLaunchersLoading" class="migration-empty">
          {{ $t('settings.dataMigration.notFound') }}
        </div>
      </section>      <div v-else class="kor-c4">
        <KorSectionTitle>{{ $t('settings.dataMigration.title') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.dataMigration.detect')" :desc="$t('settings.dataMigration.detectDesc')">
            <KorButton variant="outline" size="sm" :loading="externalLaunchersLoading" @click="detectExternalLaunchers">
              {{ externalLaunchersLoading ? $t('settings.detecting') : $t('settings.dataMigration.detectBtn') }}
            </KorButton>
          </KorSettingRow>
        </KorSettingCard>

        <template v-if="externalLaunchers.length > 0">
          <div v-for="launcher in externalLaunchers" :key="launcher.type" class="kor-c4__group">
            <KorSectionTitle>
              {{ launcher.name }} · {{ $t('settings.instancesCount', { n: launcher.instances.length }) }}
            </KorSectionTitle>
            <KorSettingCard>
              <KorSettingRow
                v-for="inst in launcher.instances"
                :key="inst.gameDir"
                :label="inst.name"
                :desc="`${launcher.path ? launcher.path : ''} · MC ${inst.version}${inst.loaderType !== 'vanilla' ? ' · ' + inst.loaderType + ' ' + inst.loaderVersion : ''} · ${inst.modCount} mods`"
              >
                <KorButton variant="outline" size="sm" @click="importExternalInstance(inst.gameDir)">
                  {{ $t('common.import') }}
                </KorButton>
              </KorSettingRow>
            </KorSettingCard>
          </div>
        </template>

        <KorSettingCard v-else-if="externalLaunchersDetected === false && !externalLaunchersLoading">
          <KorEmpty :title="$t('settings.dataMigration.notFound')" />
        </KorSettingCard>
      </div>    </template>

    <!-- ========== 游戏截图 ========== -->
    <template v-if="activeCategory === 'screenshots'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {{ $t('settings.screenshots.title') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.screenshots.desc') }}</p>

        <!-- 实例选择 -->
        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.screenshots.selectInstance') }}</label>
          </div>
          <div class="row-control">
            <PxSelect v-model="screenshotInstanceId" :options="screenshotInstanceOptions" />
          </div>
        </div>

        <!-- 截图网格 -->
        <div v-if="screenshots.length > 0" class="screenshot-grid">
          <div v-for="s in screenshots" :key="s.filePath" class="screenshot-card" @click="previewScreenshot(s)">
            <img v-if="s.thumbnail" :src="s.thumbnail" class="screenshot-thumb" alt="" />
            <div v-else class="screenshot-thumb-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div class="screenshot-info">
              <span class="screenshot-name">{{ s.fileName }}</span>
              <span class="screenshot-date">{{ formatScreenshotDate(s.createdAt) }}</span>
            </div>
            <div class="screenshot-actions">
              <button class="btn vox-btn vox-btn--secondary btn-sm" @click.stop="copyScreenshot(s.filePath)" :title="$t('settings.copyToClipboard')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
              <button class="btn vox-btn vox-btn--secondary btn-sm" @click.stop="exportScreenshot(s.filePath)" :title="$t('common.export')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <button class="btn vox-btn vox-btn--secondary btn-sm" @click.stop="deleteScreenshotAction(s)" :title="$t('common.delete')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="screenshotInstanceId && !screenshotsLoading" class="migration-empty">
          {{ $t('settings.screenshots.empty') }}
        </div>
      </section>      <div v-else class="kor-c4">
        <KorSectionTitle>{{ $t('settings.screenshots.title') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.screenshots.selectInstance')" :desc="$t('settings.screenshots.desc')">
            <KorSettingSelect v-model="screenshotInstanceId" :options="screenshotInstanceOptions" />
          </KorSettingRow>
        </KorSettingCard>

        <div v-if="screenshots.length > 0" class="screenshot-grid kor-c4__grid">
          <div v-for="s in screenshots" :key="s.filePath" class="screenshot-card" @click="previewScreenshot(s)">
            <img v-if="s.thumbnail" :src="s.thumbnail" class="screenshot-thumb" alt="" />
            <div v-else class="screenshot-thumb-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div class="screenshot-info">
              <span class="screenshot-name">{{ s.fileName }}</span>
              <span class="screenshot-date">{{ formatScreenshotDate(s.createdAt) }}</span>
            </div>
            <div class="screenshot-actions">
              <KorButton variant="outline" size="sm" @click.stop="copyScreenshot(s.filePath)" :title="$t('settings.copyToClipboard')">
                {{ $t('settings.copyToClipboard') }}
              </KorButton>
              <KorButton variant="outline" size="sm" @click.stop="exportScreenshot(s.filePath)">
                {{ $t('common.export') }}
              </KorButton>
              <KorButton variant="danger" size="sm" @click.stop="deleteScreenshotAction(s)">
                {{ $t('common.delete') }}
              </KorButton>
            </div>
          </div>
        </div>

        <KorSettingCard v-else-if="screenshotInstanceId && !screenshotsLoading">
          <KorEmpty :title="$t('settings.screenshots.empty')" />
        </KorSettingCard>
      </div>    </template>

    <!-- ========== 联机 ========== -->
    <template v-if="activeCategory === 'online'">
      <!-- 信令服务器 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          {{ $t('settings.sidebar.online') }}
        </h3>
        <p class="sec-desc">{{ $t('p2p.desc') }}</p>

        <!-- 自定义信令服务器 -->
        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('p2p.useCustomServer') }}</label>
            <p class="row-desc">{{ $t('p2p.useCustomServerDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle vox-toggle">
              <input type="checkbox" v-model="p2pSettings.useCustomServer" @change="saveP2pSettings" />
              <span class="toggle-slider vox-toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="row" v-if="p2pSettings.useCustomServer">
          <div class="row-main">
            <label class="row-label">{{ $t('p2p.signalingServer') }}</label>
            <p class="row-desc">{{ $t('p2p.signalingServerDesc') }}</p>
          </div>
          <div class="row-control">
            <input
              type="text"
              class="inp vox-input"
              v-model="p2pSettings.signalingServer"
              @change="saveP2pSettings"
              :placeholder="$t('p2p.signalingServerPlaceholder')"
              style="width: 240px"
            />
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('p2p.currentServer') }}</label>
          </div>
          <div class="row-control">
            <span style="opacity:0.7;font-size:13px">
              {{ p2pSettings.useCustomServer && p2pSettings.signalingServer ? p2pSettings.signalingServer : $t('p2p.defaultServer') }}
            </span>
          </div>
        </div>
      </section>

      <!-- 传输设置 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">{{ $t('p2p.transferSettings') }}</h3>
        <p class="sec-desc">{{ $t('p2p.transferSettingsDesc') }}</p>

        <!-- 分片大小 -->
        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('p2p.chunkSize') }}</label>
            <p class="row-desc">{{ $t('p2p.chunkSizeDesc') }}</p>
          </div>
          <div class="row-control">
            <PxSelect
              v-model="p2pSettings.chunkSize"
              :options="[
                { label: $t('p2p.chunk512'), value: '512' },
                { label: $t('p2p.chunk1024'), value: '1024' },
                { label: $t('p2p.chunk2048'), value: '2048' },
                { label: $t('p2p.chunk4096'), value: '4096' }
              ]"
              @update:model-value="saveP2pSettings"
            />
          </div>
        </div>

        <!-- 连接超时 -->
        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('p2p.connectionTimeout') }}</label>
            <p class="row-desc">{{ $t('p2p.connectionTimeoutDesc') }}</p>
          </div>
          <div class="row-control">
            <PxSelect
              v-model="p2pSettings.connectionTimeout"
              :options="[
                { label: $t('p2p.timeout15'), value: '15' },
                { label: $t('p2p.timeout30'), value: '30' },
                { label: $t('p2p.timeout60'), value: '60' }
              ]"
              @update:model-value="saveP2pSettings"
            />
          </div>
        </div>
      </section>
      <div v-else class="kor-c4">
        <KorSettingCard>
          <KorSettingRow :label="$t('p2p.useCustomServer')" :desc="$t('p2p.useCustomServerDesc')">
            <KorSwitch v-model="p2pSettings.useCustomServer" @update:model-value="() => saveP2pSettings()" />
          </KorSettingRow>
          <KorSettingRow
            v-if="p2pSettings.useCustomServer"
            :label="$t('p2p.signalingServer')"
            :desc="$t('p2p.signalingServerDesc')"
          >
            <KorInput
              v-model="p2pSettings.signalingServer"
              class="kor-input--wide"
              :placeholder="$t('p2p.signalingServerPlaceholder')"
              @change="saveP2pSettings"
            />
          </KorSettingRow>
          <KorSettingRow :label="$t('p2p.currentServer')">
            <span class="kor-value">
              {{ p2pSettings.useCustomServer && p2pSettings.signalingServer ? p2pSettings.signalingServer : $t('p2p.defaultServer') }}
            </span>
          </KorSettingRow>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('p2p.transferSettings') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('p2p.chunkSize')" :desc="$t('p2p.chunkSizeDesc')">
            <KorSettingSelect
              v-model="p2pSettings.chunkSize"
              :options="[
                { label: $t('p2p.chunk512'), value: '512' },
                { label: $t('p2p.chunk1024'), value: '1024' },
                { label: $t('p2p.chunk2048'), value: '2048' },
                { label: $t('p2p.chunk4096'), value: '4096' }
              ]"
              :width="160"
              @update:model-value="saveP2pSettings"
            />
          </KorSettingRow>
          <KorSettingRow :label="$t('p2p.connectionTimeout')" :desc="$t('p2p.connectionTimeoutDesc')">
            <KorSettingSelect
              v-model="p2pSettings.connectionTimeout"
              :options="[
                { label: $t('p2p.timeout15'), value: '15' },
                { label: $t('p2p.timeout30'), value: '30' },
                { label: $t('p2p.timeout60'), value: '60' }
              ]"
              :width="160"
              @update:model-value="saveP2pSettings"
            />
          </KorSettingRow>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 联机 ========== -->
    <template v-if="activeCategory === 'multiplayer'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {{ $t('settings.sidebar.multiplayer') }}
        </h3>
        <p class="sec-desc">{{ $t('multiplayer.desc') }}</p>
        <div class="coming-soon-card">
          <p>{{ $t('multiplayer.comingSoon') }}</p>
        </div>
      </section>
      <div v-else class="kor-c4">
        <KorSectionTitle>{{ $t('settings.sidebar.multiplayer') }}</KorSectionTitle>
        <KorSettingCard>
          <p class="kor-copy">{{ $t('multiplayer.desc') }}</p>
          <p class="kor-copy">{{ $t('multiplayer.comingSoon') }}</p>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 安全识别服务 ========== -->
    <template v-if="activeCategory === 'auth-service'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          {{ $t('settings.sidebar.authService') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.security.desc') }}</p>
      </section>

      <!-- Mod 安全扫描 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">{{ $t('settings.security.modScan') }}</h3>
        <p class="sec-desc">{{ $t('settings.security.modScanDesc') }}</p>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.security.enableScan') }}</label>
            <p class="row-desc">{{ $t('settings.security.enableScanDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle vox-toggle">
              <input type="checkbox" v-model="securitySettings.modScan" @change="saveSecuritySettings" />
              <span class="toggle-slider vox-toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.security.scanEngine') }}</label>
            <p class="row-desc">{{ $t('settings.security.scanEngineDesc') }}</p>
          </div>
          <div class="row-control">
            <PxSelect
              v-model="securitySettings.scanEngine"
              :options="[
                { label: $t('settings.security.engineBuiltin'), value: 'builtin' },
                { label: 'VirusTotal', value: 'virustotal' }
              ]"
              @update:model-value="saveSecuritySettings"
            />
          </div>
        </div>

        <div class="row" v-if="securitySettings.scanEngine === 'virustotal'">
          <div class="row-main">
            <label class="row-label">VirusTotal API Key</label>
            <p class="row-desc">{{ $t('settings.security.virusTotalKeyDesc') }}</p>
          </div>
          <div class="row-control">
            <input
              type="text"
              class="inp vox-input"
              v-model="securitySettings.virusTotalKey"
              @change="saveSecuritySettings"
              :placeholder="$t('settings.security.apiKeyPlaceholder')"
              style="width: 240px"
            />
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.security.sensitivity') }}</label>
            <p class="row-desc">{{ $t('settings.security.sensitivityDesc') }}</p>
          </div>
          <div class="row-control">
            <PxSelect
              v-model="securitySettings.sensitivity"
              :options="[
                { label: $t('settings.security.sensitivityLoose'), value: 'loose' },
                { label: $t('settings.security.sensitivityStandard'), value: 'standard' },
                { label: $t('settings.security.sensitivityStrict'), value: 'strict' }
              ]"
              @update:model-value="saveSecuritySettings"
            />
          </div>
        </div>
      </section>

      <!-- 文件完整性校验 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">{{ $t('settings.security.integrityCheck') }}</h3>
        <p class="sec-desc">{{ $t('settings.security.integrityCheckDesc') }}</p>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.security.enableHashCheck') }}</label>
            <p class="row-desc">{{ $t('settings.security.enableHashCheckDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle vox-toggle">
              <input type="checkbox" v-model="securitySettings.hashCheck" @change="saveSecuritySettings" />
              <span class="toggle-slider vox-toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.security.autoQuarantine') }}</label>
            <p class="row-desc">{{ $t('settings.security.autoQuarantineDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle vox-toggle">
              <input type="checkbox" v-model="securitySettings.autoQuarantine" @change="saveSecuritySettings" />
              <span class="toggle-slider vox-toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- 信任的下载源 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">{{ $t('settings.security.trustedSources') }}</h3>
        <p class="sec-desc">{{ $t('settings.security.trustedSourcesDesc') }}</p>

        <div class="row">
          <div class="row-main">
            <label class="row-label">Modrinth</label>
            <p class="row-desc">{{ $t('settings.security.modrinthDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle vox-toggle">
              <input type="checkbox" v-model="securitySettings.trustModrinth" @change="saveSecuritySettings" />
              <span class="toggle-slider vox-toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">CurseForge</label>
            <p class="row-desc">{{ $t('settings.security.curseforgeDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle vox-toggle">
              <input type="checkbox" v-model="securitySettings.trustCurseForge" @change="saveSecuritySettings" />
              <span class="toggle-slider vox-toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- 安全日志 -->
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title vox-sec-title">{{ $t('settings.security.securityLog') }}</h3>
        <p class="sec-desc">{{ $t('settings.security.securityLogDesc') }}</p>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.security.viewLog') }}</label>
            <p class="row-desc">{{ $t('settings.security.viewLogDesc') }}</p>
          </div>
          <div class="row-control">
            <button class="action-btn vox-btn" @click="openDirectory('logs')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {{ $t('settings.security.openLog') }}
            </button>
          </div>
        </div>
      </section>
      <div v-else class="kor-c4">
        <KorSectionTitle>{{ $t('settings.security.modScan') }}</KorSectionTitle>
        <KorSettingCard>
          <KorSettingRow :label="$t('settings.security.enableScan')" :desc="$t('settings.security.enableScanDesc')">
            <KorSwitch v-model="securitySettings.modScan" @update:model-value="() => saveSecuritySettings()" />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.security.scanEngine')" :desc="$t('settings.security.scanEngineDesc')">
            <KorSettingSelect
              v-model="securitySettings.scanEngine"
              :options="[
                { label: $t('settings.security.engineBuiltin'), value: 'builtin' },
                { label: 'VirusTotal', value: 'virustotal' }
              ]"
              :width="180"
              @update:model-value="saveSecuritySettings"
            />
          </KorSettingRow>
          <KorSettingRow
            v-if="securitySettings.scanEngine === 'virustotal'"
            label="VirusTotal API Key"
            :desc="$t('settings.security.virusTotalKeyDesc')"
          >
            <KorInput
              v-model="securitySettings.virusTotalKey"
              class="kor-input--wide"
              :placeholder="$t('settings.security.apiKeyPlaceholder')"
              @change="saveSecuritySettings"
            />
          </KorSettingRow>
          <KorSettingRow :label="$t('settings.security.sensitivity')" :desc="$t('settings.security.sensitivityDesc')">
            <KorSettingSelect
              v-model="securitySettings.sensitivity"
              :options="[
                { label: $t('settings.security.sensitivityLoose'), value: 'loose' },
                { label: $t('settings.security.sensitivityStandard'), value: 'standard' },
                { label: $t('settings.security.sensitivityStrict'), value: 'strict' }
              ]"
              :width="180"
              @update:model-value="saveSecuritySettings"
            />
          </KorSettingRow>
        </KorSettingCard>
      </div>
    </template>

    <template v-if="activeCategory === 'other'">
      <section class="sec">
        <h3 class="sec-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          {{ $t('settings.community') }}
        </h3>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.modSource') }}</label>
          </div>
          <div class="row-control">
            <PxSelect v-model="s.modSource" :options="modSourceOptions" />
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.fileNameFormat') }}</label>
            <p class="row-desc">{{ $t('settings.fileNameFormatDesc') }}</p>
          </div>
          <div class="row-control">
            <PxSelect v-model="s.fileNameFormat" :options="fileNameFormatOptions" />
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.modManageStyle') }}</label>
          </div>
          <div class="row-control">
            <PxSelect v-model="s.modManageStyle" :options="modManageStyleOptions" />
          </div>
        </div>
      </section>

      <section class="sec">
        <h3 class="sec-title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          {{ $t('settings.data') }}
        </h3>

        <div class="btn-row">
          <button class="action-btn outline" @click="openMcDir">
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
            {{ $t('settings.openMcDir') }}
          </button>
          <button class="action-btn outline" @click="openDirectory('userData')">
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
            {{ $t('settings.openLauncherDir') }}
          </button>
        </div>

        <div class="btn-row" style="margin-top: 10px">
          <button class="action-btn outline" @click="clearDownloadCache">{{ $t('settings.clearDownloadCache') }}</button>
          <button class="action-btn outline" @click="clearVersionCache">{{ $t('settings.clearVersionCache') }}</button>
        </div>

        <div class="btn-row danger-zone" style="margin-top: 18px">
          <button class="action-btn danger" @click="resetSettings">{{ $t('settings.resetSettings') }}</button>
        </div>
      </section>

      <!-- ========== 整合包工具 ========== -->
      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('modpack')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 000 4l-7 4v0a2 2 0 000 4l7 4 7 4 7-4a2 2 0 000-4l7-4z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ $t('settings.modpack') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.modpack }"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </h3>

        <div class="sec-body" v-show="collapsed.modpack">
          <p class="sec-desc">
            {{ $t('settings.modpackTools.desc') }}
          </p>

          <!-- 打包整合包 -->
          <h4 class="sec-subtitle">{{ $t('settings.modpackTools.packTitle') }}</h4>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.modpackTools.instanceDir') }}</label>
              <p class="row-desc">{{ $t('settings.modpackTools.instanceDirDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.modpackInstancePath"
                  :placeholder="$t('settings.modpackTools.instanceDirPlaceholder')"
                />
                <button class="btn-sm" @click="browseModpackInstance">{{ $t('settings.modpackTools.browse') }}</button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.modpackTools.outputDir') }}</label>
              <p class="row-desc">{{ $t('settings.modpackTools.outputDirDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.modpackOutputDir"
                  :placeholder="$t('settings.modpackTools.outputDirPlaceholder')"
                />
                <button class="btn-sm" @click="browseModpackOutput">{{ $t('settings.modpackTools.browse') }}</button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.modpackTools.info') }}</label>
              <p class="row-desc">{{ $t('settings.modpackTools.infoDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input type="text" class="inp short" v-model="s.modpackName" :placeholder="$t('settings.modpackTools.namePlaceholder')" />
                <input
                  type="text"
                  class="inp short"
                  v-model="s.modpackVersion"
                  :placeholder="$t('settings.modpackTools.versionPlaceholder')"
                />
                <input type="text" class="inp short" v-model="s.modpackAuthor" :placeholder="$t('settings.modpackTools.authorPlaceholder')" />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.modpackTools.includeContent') }}</label>
              <p class="row-desc">{{ $t('settings.modpackTools.includeContentDesc') }}</p>
            </div>
            <div class="row-control">
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeMods" /> Mods
              </label>
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeConfigs" /> {{ $t('settings.modpackTools.configs') }}
              </label>
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeSaves" /> {{ $t('settings.modpackTools.saves') }}
              </label>
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeResourcepacks" /> {{ $t('settings.modpackTools.resourcePacks') }}
              </label>
            </div>
          </div>

          <div class="btn-row">
            <button class="action-btn primary" @click="packAsMrpack" :disabled="isWorkingModpack">
              {{ isWorkingModpack ? $t('settings.modpackTools.packing') : $t('settings.modpackTools.generate') }}
            </button>
          </div>

          <!-- 进度显示 -->
          <div v-if="isWorkingModpack && modpackProgress.stage" class="progress-box">
            <div class="progress-label">
              {{ modpackProgress.stage }} {{ modpackProgress.progress }}%
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar" :style="{ width: modpackProgress.progress + '%' }"></div>
            </div>
            <div v-if="modpackProgress.currentFile" class="progress-sub">
              {{ modpackProgress.currentFile }}
            </div>
          </div>

          <!-- 导入整合包 -->
          <h4 class="sec-subtitle" style="margin-top: 20px">{{ $t('settings.modpackTools.importTitle') }}</h4>
          <p class="sec-desc">{{ $t('settings.modpackTools.importDesc') }}</p>

          <div class="btn-row">
            <button class="action-btn outline" @click="importMrpack" :disabled="isWorkingModpack">
              {{ isWorkingModpack ? $t('settings.modpackTools.processing') : $t('settings.modpackTools.importBtn') }}
            </button>
          </div>
        </div>
        <!-- /sec-body -->
      </section>

      <!-- ========== 数据备份与恢复 ========== -->
      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('backup')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14a9 3 0 0018 0V5" />
            <path d="M3 12a9 3 0 0018 0" />
          </svg>
          {{ $t('settings.modpackTools.backupTitle') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.backup }"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </h3>

        <div class="sec-body" v-show="collapsed.backup">
          <p class="sec-desc">
            {{ $t('settings.modpackTools.backupDesc') }}
          </p>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.modpackTools.lastBackup') }}</label>
              <p class="row-desc">{{ s.backupLastTime || $t('settings.modpackTools.noBackup') }}</p>
            </div>
            <div class="row-control">
              <button class="action-btn primary" @click="createBackup" :disabled="isWorkingBackup">
                {{ isWorkingBackup ? $t('settings.modpackTools.backingUp') : $t('settings.modpackTools.backupNow') }}
              </button>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.modpackTools.restoreBackup') }}</label>
              <p class="row-desc">{{ $t('settings.modpackTools.restoreBackupDesc') }}</p>
            </div>
            <div class="row-control">
              <button class="action-btn outline" @click="restoreBackup" :disabled="isWorkingBackup">
                {{ $t('settings.modpackTools.restoreBtn') }}
              </button>
            </div>
          </div>

          <div v-if="isWorkingBackup && backupProgress.stage" class="progress-box">
            <div class="progress-label">
              {{ backupProgress.stage }} {{ backupProgress.progress }}%
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar" :style="{ width: backupProgress.progress + '%' }"></div>
            </div>
            <div v-if="backupProgress.currentItem" class="progress-sub">
              {{ backupProgress.currentItem }}
            </div>
          </div>

          <!-- 备份文件列表 -->
          <div v-if="backupFiles.length > 0" class="backup-list">
            <h4 class="sec-subtitle">{{ $t('settings.modpackTools.existingBackups') }}</h4>
            <div class="backup-item" v-for="f in backupFiles" :key="f.name">
              <div class="backup-info">
                <div class="backup-name">{{ f.name }}</div>
                <div class="backup-meta">
                  <span v-if="f.size">{{ (f.size / 1024).toFixed(1) }} KB</span>
                  <span v-if="f.date">{{ new Date(f.date).toLocaleString() }}</span>
                </div>
              </div>
              <button class="btn-sm danger-btn" @click="deleteBackup(f.name)">{{ $t('settings.modpackTools.delete') }}</button>
            </div>
          </div>
        </div>
        <!-- /sec-body -->
      </section>
    </template>

    <!-- ========== 服务与反馈 ========== -->
    <template v-if="activeCategory === 'service'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {{ $t('settings.sidebar.service') }}
        </h3>
      </section>

      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">{{ $t('more.help') }}</h3>
        <p class="sec-desc">{{ $t('more.helpSubtitle') }}</p>

        <div class="faq-list">
          <div class="faq-item" v-for="(item, i) in faqItems" :key="i">
            <div class="faq-question">{{ item.q }}</div>
            <div class="faq-answer">{{ item.a }}</div>
          </div>
        </div>
      </section>

      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">{{ $t('more.feedback') }}</h3>
        <p class="sec-desc">{{ $t('more.feedbackSubtitle') }}</p>

        <div class="feedback-cards">
          <div class="feedback-card">
            <div class="feedback-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
              </svg>
            </div>
            <div class="feedback-card-title">{{ $t('more.issueFeedback') }}</div>
            <p class="feedback-card-desc">{{ $t('more.issueDesc') }}</p>
            <a class="action-btn outline" href="https://github.com/MeowY-Studios/VoxVer-Launcher/issues" target="_blank">
              {{ $t('more.goToGitHub') }}
            </a>
          </div>

          <div class="feedback-card">
            <div class="feedback-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div class="feedback-card-title">{{ $t('more.otherContact') }}</div>
            <p class="feedback-card-desc">{{ $t('more.otherContactDesc') }}</p>
            <button class="action-btn outline" @click="showEmailModal = true">
              {{ $t('more.sendEmail') }}
            </button>
          </div>
        </div>
      </section>
      <div v-else class="kor-c4">
        <KorSectionTitle>{{ $t('more.help') }}</KorSectionTitle>
        <KorSettingCard>
          <p class="kor-copy">{{ $t('more.helpSubtitle') }}</p>
          <div v-for="(item, i) in faqItems" :key="i" class="kor-c4__group">
            <KorSettingRow :label="item.q" :desc="item.a" />
          </div>
        </KorSettingCard>

        <KorSectionTitle>{{ $t('more.feedback') }}</KorSectionTitle>
        <KorSettingCard>
          <p class="kor-copy">{{ $t('more.feedbackSubtitle') }}</p>
          <KorSettingRow :label="$t('more.issueFeedback')" :desc="$t('more.issueDesc')">
            <KorButton variant="outline" size="sm" @click="openExternal('https://github.com/MeowY-Studios/VoxVer-Launcher/issues')">
              {{ $t('more.goToGitHub') }}
            </KorButton>
          </KorSettingRow>
          <KorSettingRow :label="$t('more.otherContact')" :desc="$t('more.otherContactDesc')">
            <KorButton variant="outline" size="sm" @click="showEmailModal = true">
              {{ $t('more.sendEmail') }}
            </KorButton>
          </KorSettingRow>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 赞助我们 ========== -->
    <template v-if="activeCategory === 'sponsor'">
      <section v-if="appStore.skin !== 'koring'" class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {{ $t('settings.sidebar.sponsor') }}
        </h3>
        <p class="sec-desc">{{ $t('settings.sponsor.desc') }}</p>
        <div class="btn-row" style="margin-top: 12px">
          <button class="action-btn primary" @click="openSponsorLink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            {{ $t('more.sponsorMcla') }}
          </button>
        </div>
      </section>
      <div v-else class="kor-c4">
        <KorSectionTitle>{{ $t('settings.sidebar.sponsor') }}</KorSectionTitle>
        <KorSettingCard>
          <p class="kor-copy">{{ $t('settings.sponsor.desc') }}</p>
          <div class="kor-c4__group">
            <KorButton variant="primary" size="md" @click="openSponsorLink">{{ $t('more.sponsorMcla') }}</KorButton>
          </div>
        </KorSettingCard>
      </div>
    </template>

    <!-- ========== 开发者选项 ========== -->
    <template v-if="activeCategory === 'developer'">
      <template v-if="appStore.skin !== 'koring'">
      <!-- 未解锁：开发者模式禁用提示 -->
      <section v-if="!appStore.developerUnlocked" class="sec">
        <h3 class="sec-title">{{ $t('settings.developerLockedTitle') }}</h3>
        <p class="sec-desc">{{ $t('settings.developerLockedDesc') }}</p>
        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.developerKeyLabel') }}</label>
            <p class="row-desc">{{ $t('settings.developerKeyDesc') }}</p>
          </div>
          <div class="row-control" style="gap:8px">
            <input v-model="developerKeyInput" class="inp" style="width:220px" :placeholder="$t('settings.developerKeyPlaceholder')" @keyup.enter="handleUnlockDeveloper" />
            <button class="action-btn" @click="handleUnlockDeveloper">{{ $t('settings.developerKeyUnlock') }}</button>
          </div>
        </div>
      </section>

      <template v-else>
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          {{ $t('settings.sidebar.developer') }}
        </h3>
      </section>

      <section class="sec">
        <h3 class="sec-title">{{ $t('settings.devOptions.debugDiag') }}</h3>
        <p class="sec-desc">{{ $t('settings.devOptions.debugDiagDesc') }}</p>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.debugMode') }}</label>
            <p class="row-desc">{{ $t('settings.devOptions.debugModeDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle">
              <input type="checkbox" v-model="s.debugMode" @change="toggleDebugMode" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.exportDiagnostics') }}</label>
            <p class="row-desc">{{ $t('settings.devOptions.exportDiagDesc') }}</p>
          </div>
          <div class="row-control">
            <button class="action-btn" @click="exportDiagnostics" :disabled="isExportingDiagnostics">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {{ isExportingDiagnostics ? $t('settings.devOptions.exporting') : $t('settings.devOptions.exportLog') }}
            </button>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.openDevTools') }}</label>
            <p class="row-desc">{{ $t('settings.devOptions.openDevToolsDesc') }}</p>
          </div>
          <div class="row-control">
            <button class="action-btn outline" @click="openDevTools">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              {{ $t('settings.devOptions.openDevToolsBtn') }}
            </button>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.enableF12Label') }}</label>
            <p class="row-desc">{{ $t('settings.enableF12Desc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle">
              <input type="checkbox" :checked="appStore.enableF12" @change="onToggleF12(($event.target as HTMLInputElement).checked)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.logLevel') }}</label>
            <p class="row-desc">{{ $t('settings.devOptions.logLevelDesc') }}</p>
          </div>
          <div class="row-control">
            <PxSelect v-model="s.logLevel" :options="logLevelOptions" />
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.useProxy') }}</label>
            <p class="row-desc">{{ $t('settings.devOptions.proxyDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="toggle">
              <input type="checkbox" v-model="s.useProxy" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div v-if="s.useProxy" class="proxy-settings">
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.proxyHost') }}</label>
            </div>
            <div class="row-control">
              <input type="text" class="inp" v-model="s.proxyHost" placeholder="127.0.0.1" />
            </div>
          </div>
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.proxyPort') }}</label>
            </div>
            <div class="row-control">
              <input type="number" class="inp short" v-model.number="s.proxyPort" placeholder="7890" />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.closeToTray') }}</label>
            <p class="row-desc">{{ $t('settings.devOptions.closeToTrayDesc') }}</p>
          </div>
          <div class="row-control">
            <label class="chk">
              <input type="checkbox" v-model="s.closeToTray" />
              {{ s.closeToTray ? $t('settings.enabled') : $t('settings.disabled') }}
            </label>
          </div>
        </div>
      </section>

      <!-- 快捷打开目录 -->
      <section class="sec">
        <h3 class="sec-title">{{ $t('settings.devQuickDirs') }}</h3>
        <p class="sec-desc">{{ $t('settings.devQuickDirsDesc') }}</p>
        <div class="dev-dir-grid">
          <button class="dev-dir-card" @click="openDirectory('userData')">
            <div class="dev-dir-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <div class="dev-dir-info">
              <span class="dev-dir-name">{{ $t('settings.openUserDataDir') }}</span>
              <span class="dev-dir-desc">{{ $t('settings.openUserDataDirDesc') }}</span>
            </div>
          </button>
          <button class="dev-dir-card" @click="openDirectory('logs')">
            <div class="dev-dir-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
            </div>
            <div class="dev-dir-info">
              <span class="dev-dir-name">{{ $t('settings.openLogsDir') }}</span>
              <span class="dev-dir-desc">{{ $t('settings.openLogsDirDesc') }}</span>
            </div>
          </button>
          <button class="dev-dir-card" @click="openDirectory('cache')">
            <div class="dev-dir-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
            </div>
            <div class="dev-dir-info">
              <span class="dev-dir-name">{{ $t('settings.openCacheDir') }}</span>
              <span class="dev-dir-desc">{{ $t('settings.openCacheDirDesc') }}</span>
            </div>
          </button>
          <button class="dev-dir-card" @click="openDirectory('temp')">
            <div class="dev-dir-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
            </div>
            <div class="dev-dir-info">
              <span class="dev-dir-name">{{ $t('settings.openTempDir') }}</span>
              <span class="dev-dir-desc">{{ $t('settings.openTempDirDesc') }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- 清除缓存 -->
      <section class="sec">
        <h3 class="sec-title">{{ $t('settings.clearCache') }}</h3>
        <p class="sec-desc">{{ $t('settings.clearCacheDesc') }}</p>
        <div style="margin-top:12px">
          <button class="action-btn outline" @click="clearCache" :disabled="isClearingCache">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
            {{ isClearingCache ? $t('settings.clearing') : $t('settings.clearCacheBtn') }}
          </button>
        </div>
      </section>

      <!-- 实验性与性能 -->
      <section class="sec">
        <h3 class="sec-title">{{ $t('settings.devExperimental') }}</h3>
        <p class="sec-desc">{{ $t('settings.devExperimentalDesc') }}</p>

        <div class="debug-mode-row">
          <div class="debug-mode-label">{{ $t('settings.gpuAcceleration') }}</div>
          <div class="debug-mode-desc">{{ $t('settings.gpuAccelerationDesc') }}</div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="s.gpuAcceleration" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="debug-mode-row">
          <div class="debug-mode-label">{{ $t('settings.networkLogging') }}</div>
          <div class="debug-mode-desc">{{ $t('settings.networkLoggingDesc') }}</div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="s.networkLogging" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="debug-mode-row">
          <div class="debug-mode-label">{{ $t('settings.skipCorsCheck') }}</div>
          <div class="debug-mode-desc">{{ $t('settings.skipCorsCheckDesc') }}</div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="s.skipCorsCheck" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </section>

      <!-- 运行环境信息 -->
      <section class="sec">
        <h3 class="sec-title">{{ $t('settings.devEnvInfo') }}</h3>
        <p class="sec-desc">{{ $t('settings.devEnvInfoDesc') }}</p>
        <div class="memory-alloc-card" style="margin-top:12px">
          <div class="env-info-grid" v-if="runtimeInfo">
            <div class="env-info-item">
              <span class="env-info-label">{{ $t('settings.devAppVersion') }}</span>
              <span class="env-info-value">v{{ runtimeInfo.appVersion }}</span>
            </div>
            <div class="env-info-item">
              <span class="env-info-label">{{ $t('settings.electronVersion') }}</span>
              <span class="env-info-value">{{ runtimeInfo.electron }}</span>
            </div>
            <div class="env-info-item">
              <span class="env-info-label">{{ $t('settings.chromeVersion') }}</span>
              <span class="env-info-value">{{ runtimeInfo.chrome }}</span>
            </div>
            <div class="env-info-item">
              <span class="env-info-label">{{ $t('settings.nodeVersion') }}</span>
              <span class="env-info-value">{{ runtimeInfo.node }}</span>
            </div>
            <div class="env-info-item">
              <span class="env-info-label">{{ $t('settings.platform') }}</span>
              <span class="env-info-value">{{ runtimeInfo.platform }} ({{ runtimeInfo.arch }})</span>
            </div>
          </div>
          <p v-else class="sec-desc">{{ $t('settings.devOptions.loading') }}</p>
        </div>
      </section>

      <!-- 重置启动器 -->
      <section class="sec">
        <h3 class="sec-title">{{ $t('settings.devResetSettings') }}</h3>
        <p class="sec-desc">{{ $t('settings.devResetSettingsDesc') }}</p>
        <div style="margin-top:12px">
          <button class="btn-destructive" @click="resetSettings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            {{ $t('settings.devResetBtn') }}
          </button>
        </div>
      </section>
      </template>
      </template>
      <template v-else>
        <div class="kor-c4">
          <template v-if="!appStore.developerUnlocked">
            <KorSectionTitle>{{ $t('settings.developerLockedTitle') }}</KorSectionTitle>
            <KorSettingCard>
              <p class="kor-copy">{{ $t('settings.developerLockedDesc') }}</p>
              <KorSettingRow :label="$t('settings.developerKeyLabel')" :desc="$t('settings.developerKeyDesc')">
                <div class="kor-c4__inline">
                  <KorInput v-model="developerKeyInput" class="kor-input--short" :placeholder="$t('settings.developerKeyPlaceholder')" @keyup.enter="handleUnlockDeveloper" />
                  <KorButton variant="primary" size="sm" @click="handleUnlockDeveloper">{{ $t('settings.developerKeyUnlock') }}</KorButton>
                </div>
              </KorSettingRow>
            </KorSettingCard>
          </template>

          <template v-else>
            <KorSectionTitle>{{ $t('settings.devOptions.debugDiag') }}</KorSectionTitle>
            <KorSettingCard>
              <p class="kor-copy">{{ $t('settings.devOptions.debugDiagDesc') }}</p>
              <KorSettingRow :label="$t('settings.debugMode')" :desc="$t('settings.devOptions.debugModeDesc')">
                <KorSwitch :model-value="s.debugMode" @update:model-value="(v: boolean) => { s.debugMode = v; toggleDebugMode() }" />
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.exportDiagnostics')" :desc="$t('settings.devOptions.exportDiagDesc')">
                <KorButton variant="outline" size="sm" :loading="isExportingDiagnostics" @click="exportDiagnostics">{{ $t('settings.devOptions.exportLog') }}</KorButton>
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.openDevTools')" :desc="$t('settings.devOptions.openDevToolsDesc')">
                <KorButton variant="outline" size="sm" @click="openDevTools">{{ $t('settings.devOptions.openDevToolsBtn') }}</KorButton>
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.enableF12Label')" :desc="$t('settings.enableF12Desc')">
                <KorSwitch :model-value="appStore.enableF12" @update:model-value="onToggleF12" />
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.logLevel')" :desc="$t('settings.devOptions.logLevelDesc')">
                <KorSettingSelect v-model="s.logLevel" :options="logLevelOptions" :width="180" />
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.useProxy')" :desc="$t('settings.devOptions.proxyDesc')">
                <KorSwitch v-model="s.useProxy" />
                <template #below>
                  <div v-if="s.useProxy" class="kor-c4__inline">
                    <KorInput v-model="s.proxyHost" class="kor-input--short" placeholder="127.0.0.1" />
                    <KorInput v-model.number="s.proxyPort" class="kor-input--short" placeholder="7890" />
                  </div>
                </template>
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.closeToTray')" :desc="$t('settings.devOptions.closeToTrayDesc')">
                <KorSwitch v-model="s.closeToTray" />
              </KorSettingRow>
            </KorSettingCard>

            <KorSectionTitle>{{ $t('settings.devQuickDirs') }}</KorSectionTitle>
            <KorSettingCard>
              <p class="kor-copy">{{ $t('settings.devQuickDirsDesc') }}</p>
              <KorSettingRow :label="$t('settings.openUserDataDir')" :desc="$t('settings.openUserDataDirDesc')">
                <KorButton variant="ghost" size="sm" @click="openDirectory('userData')">{{ $t('common.open') }}</KorButton>
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.openLogsDir')" :desc="$t('settings.openLogsDirDesc')">
                <KorButton variant="ghost" size="sm" @click="openDirectory('logs')">{{ $t('common.open') }}</KorButton>
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.openCacheDir')" :desc="$t('settings.openCacheDirDesc')">
                <KorButton variant="ghost" size="sm" @click="openDirectory('cache')">{{ $t('common.open') }}</KorButton>
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.openTempDir')" :desc="$t('settings.openTempDirDesc')">
                <KorButton variant="ghost" size="sm" @click="openDirectory('temp')">{{ $t('common.open') }}</KorButton>
              </KorSettingRow>
            </KorSettingCard>

            <KorSectionTitle>{{ $t('settings.clearCache') }}</KorSectionTitle>
            <KorSettingCard>
              <p class="kor-copy">{{ $t('settings.clearCacheDesc') }}</p>
              <KorSettingRow :label="$t('settings.clearCache')">
                <KorButton variant="outline" size="sm" :loading="isClearingCache" @click="clearCache">{{ $t('settings.clearCacheBtn') }}</KorButton>
              </KorSettingRow>
            </KorSettingCard>

            <KorSectionTitle>{{ $t('settings.devExperimental') }}</KorSectionTitle>
            <KorSettingCard>
              <p class="kor-copy">{{ $t('settings.devExperimentalDesc') }}</p>
              <KorSettingRow :label="$t('settings.gpuAcceleration')" :desc="$t('settings.gpuAccelerationDesc')">
                <KorSwitch v-model="s.gpuAcceleration" />
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.networkLogging')" :desc="$t('settings.networkLoggingDesc')">
                <KorSwitch v-model="s.networkLogging" />
              </KorSettingRow>
              <KorSettingRow :label="$t('settings.skipCorsCheck')" :desc="$t('settings.skipCorsCheckDesc')">
                <KorSwitch v-model="s.skipCorsCheck" />
              </KorSettingRow>
            </KorSettingCard>

            <KorSectionTitle>{{ $t('settings.devEnvInfo') }}</KorSectionTitle>
            <KorSettingCard>
              <template v-if="runtimeInfo">
                <KorSettingRow :label="$t('settings.devAppVersion')"><span class="kor-value">v{{ runtimeInfo.appVersion }}</span></KorSettingRow>
                <KorSettingRow :label="$t('settings.electronVersion')"><span class="kor-value">{{ runtimeInfo.electron }}</span></KorSettingRow>
                <KorSettingRow :label="$t('settings.chromeVersion')"><span class="kor-value">{{ runtimeInfo.chrome }}</span></KorSettingRow>
                <KorSettingRow :label="$t('settings.nodeVersion')"><span class="kor-value">{{ runtimeInfo.node }}</span></KorSettingRow>
                <KorSettingRow :label="$t('settings.platform')"><span class="kor-value">{{ runtimeInfo.platform }} ({{ runtimeInfo.arch }})</span></KorSettingRow>
              </template>
              <p v-else class="kor-copy">{{ $t('settings.devOptions.loading') }}</p>
            </KorSettingCard>

            <KorSectionTitle>{{ $t('settings.devResetSettings') }}</KorSectionTitle>
            <KorSettingCard>
              <p class="kor-copy">{{ $t('settings.devResetSettingsDesc') }}</p>
              <KorSettingRow :label="$t('settings.devResetSettings')">
                <KorButton variant="danger" size="sm" @click="resetSettings">{{ $t('settings.devResetBtn') }}</KorButton>
              </KorSettingRow>
            </KorSettingCard>
          </template>
        </div>
      </template>
    </template>

    <!-- 邮箱联系弹窗（全局） -->
    <div v-if="showEmailModal" class="modal-overlay" @click.self="showEmailModal = false">
      <div class="modal-box email-modal">
        <div class="modal-header">
          <h4>{{ $t('more.sendEmail') }}</h4>
          <button class="modal-close" @click="showEmailModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="email-modal-desc">{{ $t('more.emailModalDesc') }}</p>
          <div class="email-display">
            <span class="email-address">sksadfg@163.com</span>
            <button class="btn vox-btn vox-btn--secondary btn-sm" @click="handleEmailCopy">
              {{ $t('more.copyEmailAddress') }}
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- 服务联通性测试（独立子页面） -->
    <div v-if="showServiceTest && appStore.skin !== 'koring'" class="service-test-page">
      <div class="service-test-head">
        <button class="service-test-icon-btn" @click="closeServiceTest">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2 class="service-test-title">{{ $t('settings.serviceConnectivity') }}</h2>
        <button class="service-test-btn" :disabled="serviceTesting" @click="runServiceTest">
          {{ $t('settings.serviceTestStart') }}
        </button>
      </div>

      <div class="service-test-body">
        <p v-if="serviceTesting" class="service-test-hint">{{ $t('settings.serviceTesting') }}</p>
        <p v-else-if="serviceTestError" class="service-test-hint is-error">{{ serviceTestError }}</p>
        <div v-else-if="!serviceTested && serviceResults.length > 0" class="service-test-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{{ $t('settings.serviceTestIdle') }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <p v-else-if="serviceResults.length === 0" class="service-test-hint">{{ $t('settings.serviceTestEmpty') }}</p>
        <div v-for="group in serviceGroups" :key="group.key" class="service-group">
          <div v-for="item in group.items" :key="item.key" class="service-item">
            <div class="service-item-main">
              <span class="service-item-name">{{ item.name }}</span>
              <span class="service-item-url">{{ item.url }}</span>
            </div>
            <span v-if="!serviceTested" class="service-item-badge is-pending">{{ $t('settings.serviceUntested') }}</span>
            <span v-else class="service-item-badge" :class="item.online ? 'is-online' : 'is-offline'">
              <svg v-if="item.online" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {{ item.online ? `${item.latency} ms` : $t('settings.serviceOffline') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="showServiceTest" class="service-test-kor">
      <div class="service-test-kor__head">
        <KorButton variant="ghost" size="sm" @click="closeServiceTest">
          ← {{ $t('settings.serviceConnectivity') }}
        </KorButton>
        <KorButton variant="primary" size="sm" :loading="serviceTesting" @click="runServiceTest">
          {{ $t('settings.serviceTestStart') }}
        </KorButton>
      </div>      <p v-if="!serviceTested && !serviceTesting" class="service-test-kor__hint">
        {{ $t('settings.serviceTestIdle') }}
      </p>

      <template v-if="serviceTestError">
        <KorSettingCard>
          <p class="kor-copy is-error">{{ serviceTestError }}</p>
        </KorSettingCard>
      </template>
      <template v-else-if="korServiceGroups.length === 0">
        <KorSettingCard>
          <p class="kor-copy">{{ $t('settings.serviceTestEmpty') }}</p>
        </KorSettingCard>
      </template>
      <template v-else>
        <div v-for="group in korServiceGroups" :key="group.key" class="service-test-kor__group">
          <KorSectionTitle>{{ group.label }}</KorSectionTitle>
          <KorSettingCard>
            <KorSettingRow
              v-for="item in group.items"
              :key="item.key"
              :label="item.name"
              :desc="item.url"
            >
              <span class="kor-service-badge" :class="serviceBadgeClass(item)">
                {{ serviceBadgeText(item) }}
              </span>
            </KorSettingRow>
          </KorSettingCard>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, inject, computed, onMounted, onUnmounted, watch, ref, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { setLocale } from '../locale/i18n'
import { useI18n } from 'vue-i18n'
import { useAppStore, type ThemeMode, type ThemeSkin } from '../stores/app.store'
import { useInstancesStore } from '../stores/instances.store'
import AccountPage from './AccountPage.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import PxSelect from '@/components/common/PxSelect.vue'







import ThemeModeCard from '@/components/settings/ThemeModeCard.vue'
import SkinPresetCard from '@/components/settings/SkinPresetCard.vue'
import {
  KorAccountCard,
  KorButton,
  KorPageHeader,
  KorPageShell,
  KorVersionCard,
  KorSectionTitle,
  KorSettingCard,
  KorSettingRow,
  KorSettingSwitch,
  KorSettingSlider,
  KorSettingSelect,
  KorInput,
  KorProgress,
  KorSwitch
} from '@/components/kor'
import { renderMarkdownSafe } from '../utils/markdown'
import { settingsNavGroups } from '../config/settings-nav'
import type { KorShellGroup } from '../components/kor/shell/types'

const pageRef = ref<HTMLElement | null>(null)

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
/** Koring 排版下的「账户」= VoxVer 启动器账户（与「游戏账户与档案」的 Microsoft 游戏账号是两回事） */
function onVoxverAccountAction(): void {
  toast({
    title: t('settings.koringAccountSoon'),
    message: t('settings.koringAccountSoonDesc'),
    type: 'info'
  })
}

/* Koring 排版用的下拉选项（classic 排版用单选卡片，Koring 用 select） */
const korTitleBarOptions = computed(() => [
  { value: 'default', label: t('settings.defaultTitlebar') },
  { value: 'none', label: t('settings.hideTitlebar') },
  { value: 'text', label: t('settings.textOnly') },
  { value: 'image', label: t('settings.customImageTitlebar') }
])

const korHomeOptions = computed(() => [
  { value: 'blank', label: t('settings.blankPage') },
  { value: 'preset', label: t('settings.presetHomepage') },
  { value: 'local', label: t('settings.localFile') },
  { value: 'online', label: t('settings.onlineUpdate') }
])

const korLangOptions = computed(() => [
  { value: 'zh-CN', label: t('settings.langZhCN') },
  { value: 'en-US', label: t('settings.langEnUS') }
])

const korDateFormatOptions = computed(() => [
  { value: 'follow', label: t('settings.dateFollowLang') },
  { value: '24h', label: t('settings.date24h') },
  { value: '12h', label: t('settings.date12h') }
])

const korFontScaleOptions = computed(() => [
  { value: 'default', label: t('settings.accessibilityFontDefault') },
  { value: 'large', label: t('settings.accessibilityFontLarge') },
  { value: 'xlarge', label: t('settings.accessibilityFontXLarge') }
])

const korColorBlindOptions = computed(() => [
  { value: 'none', label: t('settings.accessibilityColorNone') },
  { value: 'protanopia', label: t('settings.accessibilityColorProtanopia') },
  { value: 'deuteranopia', label: t('settings.accessibilityColorDeuteranopia') },
  { value: 'tritanopia', label: t('settings.accessibilityColorTritanopia') },
  { value: 'monochromat', label: t('settings.accessibilityColorMonochromat') }
])

function openExternal(url: string) {
  window.electronAPI?.shell?.openExternal?.(url)
}

const korGcOptions = computed(() => [
  { value: 'g1gc', label: t('settings.g1gc') },
  { value: 'zgc', label: t('settings.zgc') },
  { value: 'parallel', label: t('settings.parallelGc') },
  { value: 'none', label: t('settings.noOptimize') }
])

const korChannelOptions = computed(() => [
  { value: 'stable', label: t('settings.updateChannel.stable') },
  { value: 'beta', label: t('settings.updateChannel.beta') }
])
const instancesStore = useInstancesStore()
const allInstances = computed(() => instancesStore.instances)
const { tm, t } = useI18n()
const { confirm: pxConfirm } = useConfirm()
const { toast } = useToast()
const faqItems = computed(() => (tm('more.faq') as Array<{ q: string; a: string }>))

const themePreviewOptions = computed(() => [
  { value: 'light' as const, label: t('settings.themeLight') },
  { value: 'auto' as const, label: t('settings.themeAuto') },
  { value: 'dark' as const, label: t('settings.themeDark') }
])

/** 排版预设：VoxVer 原版 / Koring（与显示模式相互独立） */
const layoutOptions = computed(() => [
  { value: 'voxver' as const, label: t('settings.skinVoxver') },
  { value: 'koring' as const, label: t('settings.skinKoring') }
])

const settingsActive = inject<Ref<string>>('settingsActive')
const activeCategory = computed({
  get: () => settingsActive?.value || 'home',
  set: (next: string) => {
    if (settingsActive) settingsActive.value = next
  }
})

const korSettingGroups = computed<KorShellGroup[]>(() =>
  settingsNavGroups.map((group) => ({
    title: t(group.name),
    items: group.items
      // Koring 皮肤下账户入口在左上角账户卡，侧栏不再单列「账户」
      .filter((item) => item.category !== 'account')
      // 开发者选项默认隐藏，关于页连点版本号 7 次后出现
      .filter((item) => item.category !== 'developer' || appStore.developerMode)
      .map((item) => ({
        key: item.category || item.id,
        label: t(item.labelKey),
        icon: item.icon
      }))
  }))
)

/** Koring 皮肤下各设置分类的页面标题（复用侧栏 i18n key） */
const KOR_HEADER_KEYS: Record<string, string> = {
  account: 'settings.sidebar.account',
  about: 'settings.sidebar.about',
  copyright: 'settings.sidebar.copyright',
  launcher: 'settings.sidebar.launcher',
  profile: 'settings.sidebar.gameProfile',
  'java-memory': 'settings.sidebar.javaMemory',
  'game-dir': 'settings.sidebar.gameDir',
  advanced: 'settings.sidebar.advanced',
  interface: 'settings.sidebar.interface',
  language: 'settings.sidebar.lang',
  accessibility: 'settings.sidebar.accessibility',
  'download-net': 'settings.sidebar.downloadNet',
  online: 'settings.sidebar.online',
  multiplayer: 'settings.sidebar.multiplayer',
  'auth-service': 'settings.sidebar.authService',
  other: 'settings.sidebar.other',
  service: 'settings.sidebar.service',
  sponsor: 'settings.sidebar.sponsor',
  developer: 'settings.sidebar.developer',
}

const korHeaderTitle = computed(() => t(KOR_HEADER_KEYS[activeCategory.value] || 'settings.sidebar.home'))

const searchQuery = ref('')

// 设置分类搜索关键词映射（key: category id, value: 该分类相关的搜索标签）
const SEARCH_CATEGORY_MAP: Record<string, string[]> = {
  home: ['首页', '主页', '概览', 'home', 'dashboard', '概述'],
  launcher: ['启动', '游戏', '版本', '启动器', 'launch', 'start', 'version', '窗口', '全屏'],
  account: ['账号', '账户', '登录', 'account', 'login', '用户', '皮肤'],
  about: ['关于', '版权', '信息', '版本号', 'about', 'info', 'credits'],
  copyright: ['版权', '许可', '开源', 'license', 'copyright', '第三方'],
  profile: ['个人资料', '账户', 'profile'],
  'java-memory': ['java', '内存', 'jvm', '堆', 'memory', 'ram', '分配', '垃圾回收'],
  'game-dir': ['目录', '文件夹', '路径', '游戏文件', 'instance', 'minecraft', '实例'],
  advanced: ['高级', 'jvm参数', '命令行', '启动命令', '进程', '优先级', 'advanced', 'args'],
  personalize: ['个性化', '外观', '自定义', '主题', '背景', '颜色', 'theme', 'appearance', '个性化'],
  interface: ['界面', '交互', '布局', '侧边栏', '字体', '动画', 'ui', 'interface', '特效'],
  language: ['语言', '国际化', '多语言', 'language', 'locale', 'i18n', '中文', '英文'],
  accessibility: ['辅助', '无障碍', '色盲', '字体缩放', '屏幕阅读器', 'accessibility', 'a11y', '辅助功能'],
  'download-net': ['下载', '网络', '镜像', '线程', '速度', 'download', 'mirror', '网络', '源'],
  'data-migration': ['迁移', '导入', '导出', 'hmcl', 'pcl', '数据', 'migration', 'import'],
  online: ['在线', '联机', '多人', 'online', 'multiplayer'],
  multiplayer: ['联机', '多人', 'multiplayer', 'online'],
  'auth-service': ['安全', '扫描', '病毒', '防病毒', 'security', '安全扫描', '信任', '完整性'],
  other: ['数据', '缓存', '备份', '社区', '整合包', 'other', '数据管理', '清除'],
  service: ['服务', '后台', '自启动', 'service'],
  sponsor: ['赞助', '支持', '捐赠', 'sponsor', '支持作者'],
  developer: ['开发者', '调试', '开发', '代理', '日志', 'dev', 'debug', '开发人员', '实验']
}

// 设置搜索：匹配关键词并跳转到首个匹配分类
function onSearchInput() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return
  for (const [cat, keywords] of Object.entries(SEARCH_CATEGORY_MAP)) {
    const hit = keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))
    // 同时匹配分类标题（通过 i18n key 的方式兜底匹配）
    const catMatch = cat.toLowerCase().includes(q)
    if (hit || catMatch) {
      switchCategory(cat)
      return
    }
  }
}

// Java 检测结果类型
interface JavaInfo {
  id: string
  path: string
  version: string
  vendor?: string
  arch?: string
  isDefault?: boolean
}

// 全局快捷键类型
interface HotkeyInfo {
  action: string
  accelerator: string
  enabled: boolean
}

// 备份文件类型
interface BackupFileInfo {
  name: string
  size: number
  date: string
}

function switchCategory(cat: string) {
  if (settingsActive) settingsActive.value = cat
}

// ===== 游戏文件夹列表管理 =====
interface FolderItem {
  path: string
  name: string
  isActive: boolean
}
const folderItems = ref<FolderItem[]>([])
const currentFolderPath = ref('')
const currentFolderName = ref('')

async function loadFolderList() {
  const api = window.electronAPI
  if (!api?.path) return

  const savedPaths: string[] = api.folders ? await api.folders.list() : []
  const validPaths: string[] = []
  for (const p of savedPaths) {
    const exists = await api.path.exists(p)
    if (exists) validPaths.push(p)
  }

  const lastFolder = await api.folders.getLast()
  let effectivePath: string | null = null
  if (lastFolder && validPaths.includes(lastFolder)) {
    effectivePath = lastFolder
  } else if (validPaths.length > 0) {
    effectivePath = validPaths[0]
  }

  folderItems.value = validPaths.map((p) => ({
    path: p,
    name: p.split(/[\\/]/).pop() || p,
    isActive: p === effectivePath
  }))

  if (effectivePath) {
    currentFolderPath.value = effectivePath
    currentFolderName.value = effectivePath.split(/[\\/]/).pop() || '.minecraft'
  }
}

async function addGameFolder() {
  const api = window.electronAPI
  if (!api?.dialog) return
  const selectedPath = await api.dialog.selectFolder()
  if (!selectedPath) return
  if (folderItems.value.find((f) => f.path === selectedPath)) {
    await switchFolder(selectedPath)
    return
  }
  if (api.folders) await api.folders.add(selectedPath)
  folderItems.value.push({
    path: selectedPath,
    name: selectedPath.split(/[\\/]/).pop() || selectedPath,
    isActive: false
  })
  await switchFolder(selectedPath)
}

async function switchFolder(path: string) {
  currentFolderPath.value = path
  currentFolderName.value = path.split(/[\\/]/).pop() || '.minecraft'
  folderItems.value.forEach((f) => (f.isActive = f.path === path))
  const api = window.electronAPI
  if (api?.folders) await api.folders.setLast(path)
  // 保存为最后选中的游戏目录
  if (api?.config) await api.config.set('last_selected_folder', path)
}

async function removeFolder(path: string) {
  folderItems.value = folderItems.value.filter((f) => f.path !== path)
  const api = window.electronAPI
  if (api?.folders) await api.folders.remove(path)
  if (currentFolderPath.value === path) {
    if (folderItems.value.length > 0) {
      await switchFolder(folderItems.value[0].path)
    } else {
      currentFolderPath.value = ''
      currentFolderName.value = ''
      // 清除版本选择
      localStorage.removeItem('voxver_last_version')
      localStorage.removeItem('voxver_last_version_name')
    }
  }
}

async function createMinecraftFolderHere() {
  try {
    const api = window.electronAPI
    const appPath = await api.path.getAppPath()
    const minecraftPath = appPath.replace(/[\\/]+$/, '') + '/.minecraft'
    if (api.path) await api.path.createDir(minecraftPath)
    await api.folders.add(minecraftPath)
    folderItems.value.push({ path: minecraftPath, name: '.minecraft', isActive: false })
    await switchFolder(minecraftPath)
  } catch (_) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('settings.createMinecraftFolderFailed'), type: 'error' })
  }
}

async function importModpackFromSettings() {
  const api = window.electronAPI
  if (!api?.dialog) return
  const filePath = await api.dialog.selectFile({
    title: t('component.selectModpackFile'),
    filters: [{ name: t('component.modpackFileFilter'), extensions: ['mrpack', 'zip'] }]
  })
  if (!filePath) return
  api.instance?.scanMinecraft?.(filePath)
}

// 加载保存的 Java 设置
onMounted(async () => {
  pageRef.value?.scrollTo(0, 0)
  await loadFolderList()
  await loadJavaSettings()
  try {
    const mem = await window.electronAPI?.app?.getMemoryInfo?.()
    if (mem?.totalGB) systemTotalGB.value = mem.totalGB
  } catch { /* 获取失败保持 0，不影响其他功能 */ }
})

// section 折叠状态（true = 展开）
const collapsed = reactive<Record<string, boolean>>({
  launch: true,
  memory: true,
  skin: false, // 默认折叠
  advanced: false, // 默认折叠
  appearance: true,
  background: true,
  titlebar: true,
  homepage: true,
  features: true,
  download: true,
  community: true,
  data: true,
  about: true,
  hotkey: true, // P2: 全局快捷键
  themeAdvanced: false, // P2: 主题自定义增强
  modpack: true, // P2: 整合包工具
  backup: true, // P2: 数据备份
  debug: true // v0.5.3: 调试与诊断
})
function toggleSec(key: string) {
  collapsed[key] = !collapsed[key]
}

// Java 检测状态
const isDetectingJava = ref(false)
const detectionComplete = ref(false)
const detectedJava = ref<JavaInfo[]>([])
const currentStep = ref('')
const progressText = ref('')
const progressPercent = ref(0)
const selectedJavaId = ref<string>('')

// Computed property for selected Java preset
const selectedJavaPreset = computed({
  get() {
    if (selectedJavaId.value) {
      return `detected:${selectedJavaId.value}`
    }
    return s.javaPreset
  },
  set(val: string) {
    if (val.startsWith('detected:')) {
      const id = val.replace('detected:', '')
      selectedJavaId.value = id
      const java = detectedJava.value.find((j) => j.id === id)
      if (java) {
        s.javaPath = java.path
        s.javaPreset = 'custom'
      }
    } else {
      selectedJavaId.value = ''
      s.javaPreset = val
    }
  }
})

// Java preset options for PxSelect
const javaPresetOptions = computed<Array<{ label: string; value: string; disabled?: boolean }>>(() => {
  const options: Array<{ label: string; value: string; disabled?: boolean }> = [
    { label: tm('settings.autoSelect'), value: 'auto' },
    { label: 'Java 8', value: 'java8' },
    { label: 'Java 17', value: 'java17' },
    { label: 'Java 21', value: 'java21' },
  ]
  if (detectedJava.value.length > 0) {
    options.push({ label: '──────────────', value: '', disabled: true })
    for (const java of detectedJava.value) {
      options.push({
        label: `${java.vendor} ${java.version} (${java.arch}${tm('settings.javaMemory.bit') as string})`,
        value: `detected:${java.id}`,
      })
    }
    options.push({ label: '──────────────', value: '', disabled: true })
  }
  options.push({ label: tm('settings.customPath'), value: 'custom' })
  return options
})

// 日志级别：与 electron/utils/logger.ts 中 LogLevel 保持同步
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
const LOG_LEVELS: readonly LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const
function safeLogLevel(v: string | null): LogLevel {
  return LOG_LEVELS.includes(v as LogLevel) ? (v as LogLevel) : 'INFO'
}

const s = reactive({
  // 启动
  versionIsolation: (localStorage.getItem('voxver_versionIsolation') as string) || 'version',
  windowTitle: localStorage.getItem('voxver_windowTitle') || 'Minecraft {version}',
  launchVisibility: (localStorage.getItem('voxver_launchVisibility') as string) || 'hide',
  processPriority: (localStorage.getItem('voxver_processPriority') as string) || 'normal',
  winW: localStorage.getItem('voxver_winW') || '854',
  winH: localStorage.getItem('voxver_winH') || '480',
  windowPreset: (localStorage.getItem('voxver_windowPreset') as string) || 'default',
  fullscreen: localStorage.getItem('voxver_fullscreen') === 'true',
  javaPreset: (localStorage.getItem('voxver_javaPreset') as string) || 'auto',
  javaPath: localStorage.getItem('voxver_javaPath') || '',
  memoryMode: (localStorage.getItem('voxver_memoryMode') as string) || 'auto',
  memoryCustomGB: Number(localStorage.getItem('voxver_memoryCustomGB')) || 4,
  memoryMin: Number(localStorage.getItem('voxver_memoryMin')) || 1024,
  memoryMax: Number(localStorage.getItem('voxver_memoryMax')) || 4096,
  offlineSkin: (localStorage.getItem('voxver_offlineSkin') as string) || 'default',
  customSkinPath: localStorage.getItem('voxver_customSkinPath') || '',
  officialSkinName: localStorage.getItem('voxver_officialSkinName') || '',
  jvmArgs: localStorage.getItem('voxver_jvmArgs') || '',
  gameArgs: localStorage.getItem('voxver_gameArgs') || '',
  preLaunchCmd: localStorage.getItem('voxver_preLaunchCmd') || '',
  memoryManage: (localStorage.getItem('voxver_memoryManage') as string) || 'g1gc',
  disableJavaLaunchWrapper: localStorage.getItem('voxver_disableJavaLaunchWrapper') === 'true',
  disableLwjglUnsafeAgent: localStorage.getItem('voxver_disableLwjglUnsafeAgent') === 'true',
  useHighPerformanceGPU: localStorage.getItem('voxver_useHighPerformanceGPU') === 'true',

  // 个性化
  opacity: Number(localStorage.getItem('voxver_opacity')) || 100,
  themeColor: localStorage.getItem('voxver_themeColor') || '#14b8a6',
  accentColor: localStorage.getItem('voxver_accentColor') || '#8b5cf6',
  lang: (localStorage.getItem('voxver-language') as 'zh-CN' | 'en-US') || 'zh-CN',
  dateFormat: (localStorage.getItem('voxver-dateFormat') as 'follow' | '24h' | '12h') || 'follow',
  bgMusicMode: (localStorage.getItem('voxver_bgMusicMode') as string) || 'none',
  titleBarMode: (localStorage.getItem('voxver_titleBarMode') as string) || 'default',
  homeContent: (localStorage.getItem('voxver_homeContent') as string) || 'blank',
  fontSize: Number(localStorage.getItem('voxver_fontSize')) || 14,
  enableAnimations: localStorage.getItem('voxver_enableAnimations') !== 'false',
  enableEffects: localStorage.getItem('voxver_enableEffects') !== 'false',
  enableSounds: localStorage.getItem('voxver_enableSounds') !== 'false',

  // 其他
  downloadSource: (localStorage.getItem('voxver_downloadSource') as string) || 'bmclapi',
  versionListSource: (localStorage.getItem('voxver_versionListSource') as string) || 'bmclapi',
  maxThreads: Number(localStorage.getItem('voxver_maxThreads')) || 32,
  speedLimit: Number(localStorage.getItem('voxver_speedLimit')) || 0,
  modSource: (localStorage.getItem('voxver_modSource') as string) || 'both',
  fileNameFormat: (localStorage.getItem('voxver_fileNameFormat') as string) || 'name-version',
  modManageStyle: (localStorage.getItem('voxver_modManageStyle') as string) || 'card',

  // P2: 全局快捷键
  hotkeyLaunch: localStorage.getItem('voxver_hotkeyLaunch') || 'Ctrl+Shift+L',
  hotkeyToggleWindow: localStorage.getItem('voxver_hotkeyToggleWindow') || 'Ctrl+Shift+H',
  hotkeyOpenHome: localStorage.getItem('voxver_hotkeyOpenHome') || 'Ctrl+Shift+O',
  hotkeyOpenSettings: localStorage.getItem('voxver_hotkeyOpenSettings') || 'Ctrl+,',

  // P2: 主题自定义
  themeCustomColor: localStorage.getItem('voxver_themeCustomColor') || '#14b8a6',
  themeBgOpacity: Number(localStorage.getItem('voxver_themeBgOpacity')) || 100,

  // P2: 整合包工具
  modpackInstancePath: localStorage.getItem('voxver_modpackInstancePath') || '',
  modpackOutputDir: localStorage.getItem('voxver_modpackOutputDir') || '',
  modpackIncludeConfigs: localStorage.getItem('voxver_modpackIncludeConfigs') !== 'false',
  modpackIncludeMods: localStorage.getItem('voxver_modpackIncludeMods') !== 'false',
  modpackIncludeSaves: localStorage.getItem('voxver_modpackIncludeSaves') !== 'false',
  modpackIncludeResourcepacks: localStorage.getItem('voxver_modpackIncludeResourcepacks') === 'true',
  modpackName: localStorage.getItem('voxver_modpackName') || '',
  modpackAuthor: localStorage.getItem('voxver_modpackAuthor') || '',
  modpackVersion: localStorage.getItem('voxver_modpackVersion') || '1.0.0',

  // P2: 数据备份
  backupLastTime: localStorage.getItem('voxver_backupLastTime') || '',
  backupFile: localStorage.getItem('voxver_backupFile') || '',

  // v0.5.3: 调试模式
  debugMode: localStorage.getItem('voxver_debugMode') === 'true',

  // v0.6.0: 开发者选项
  logLevel: safeLogLevel(localStorage.getItem('voxver_logLevel')),
  useProxy: localStorage.getItem('voxver_useProxy') === 'true',
  proxyHost: localStorage.getItem('voxver_proxyHost') || '127.0.0.1',
  proxyPort: Number(localStorage.getItem('voxver_proxyPort')) || 7890,
  closeToTray: localStorage.getItem('voxver_closeToTray') === 'true',
  gpuAcceleration: localStorage.getItem('voxver_gpuAcceleration') !== 'false',
  networkLogging: localStorage.getItem('voxver_networkLogging') === 'true',
  skipCorsCheck: localStorage.getItem('voxver_skipCorsCheck') === 'true',

  // 辅助功能
  accessibilityScreenReader: false,
  accessibilityReduceMotion: false,
  accessibilityHighContrast: false,
  accessibilityKeyboardNav: false,
  accessibilityFontScale: 'default',
  accessibilityColorBlind: 'none'
})

// 监听语言变更，同步到 vue-i18n 和 localStorage
watch(
  () => s.lang,
  (newLang) => {
    if (newLang && typeof newLang === 'string') {
      setLocale(newLang as 'zh-CN' | 'en-US')
    }
  }
)

// 监听日期格式变更
watch(
  () => s.dateFormat,
  (v) => {
    if (v) localStorage.setItem('voxver-dateFormat', v)
  }
)

// 字体缩放映射
const FONT_SCALE_MAP: Record<string, number> = {
  default: 1,
  large: 1.15,
  xlarge: 1.3
}

function applyFontScale(scale: string) {
  const factor = FONT_SCALE_MAP[scale] || 1
  document.documentElement.style.setProperty('--voxver-font-scale', String(factor))
  localStorage.setItem('voxver_fontScale', scale)
}

// 监听字体缩放变更
watch(() => s.accessibilityFontScale, (val) => applyFontScale(val))

// 初始化时恢复字体缩放
const savedFontScale = localStorage.getItem('voxver_fontScale')
if (savedFontScale && FONT_SCALE_MAP[savedFontScale]) {
  s.accessibilityFontScale = savedFontScale
}
applyFontScale(s.accessibilityFontScale)

// 色觉辅助
const CVD_FILTER_MAP: Record<string, string> = {
  protanopia: 'url(#cvd-protanopia)',
  deuteranopia: 'url(#cvd-deuteranopia)',
  tritanopia: 'url(#cvd-tritanopia)',
  monochromat: 'url(#cvd-monochromat)'
}

function applyColorBlind(mode: string) {
  const f = CVD_FILTER_MAP[mode] || ''
  document.body.style.filter = f
  localStorage.setItem('voxver_colorBlind', mode)
}

watch(() => s.accessibilityColorBlind, (val) => applyColorBlind(val))

const savedColorBlind = localStorage.getItem('voxver_colorBlind')
if (savedColorBlind) {
  s.accessibilityColorBlind = savedColorBlind
}
applyColorBlind(s.accessibilityColorBlind)

// 屏幕阅读器
function applyScreenReader(enabled: boolean) {
  document.body.toggleAttribute('data-screen-reader', enabled)
  localStorage.setItem('voxver_screenReader', String(enabled))
}
watch(() => s.accessibilityScreenReader, (val) => applyScreenReader(val))
if (localStorage.getItem('voxver_screenReader') === 'true') s.accessibilityScreenReader = true
applyScreenReader(s.accessibilityScreenReader)

// 减少动画
function applyReduceMotion(enabled: boolean) {
  document.body.toggleAttribute('data-reduce-motion', enabled)
  localStorage.setItem('voxver_reduceMotion', String(enabled))
}
watch(() => s.accessibilityReduceMotion, (val) => applyReduceMotion(val))
if (localStorage.getItem('voxver_reduceMotion') === 'true') s.accessibilityReduceMotion = true
applyReduceMotion(s.accessibilityReduceMotion)

// 高对比度
function applyHighContrast(enabled: boolean) {
  document.body.toggleAttribute('data-high-contrast', enabled)
  localStorage.setItem('voxver_highContrast', String(enabled))
}
watch(() => s.accessibilityHighContrast, (val) => applyHighContrast(val))
if (localStorage.getItem('voxver_highContrast') === 'true') s.accessibilityHighContrast = true
applyHighContrast(s.accessibilityHighContrast)

// 键盘导航
function applyKeyboardNav(enabled: boolean) {
  document.body.toggleAttribute('data-keyboard-nav', enabled)
  localStorage.setItem('voxver_keyboardNav', String(enabled))
}
watch(() => s.accessibilityKeyboardNav, (val) => applyKeyboardNav(val))
if (localStorage.getItem('voxver_keyboardNav') === 'true') s.accessibilityKeyboardNav = true
applyKeyboardNav(s.accessibilityKeyboardNav)

// ====== 设置项批量持久化 watch ======
// 启动类
watch(() => s.versionIsolation, (v) => v && localStorage.setItem('voxver_versionIsolation', v))
watch(() => s.windowTitle, (v) => localStorage.setItem('voxver_windowTitle', v))
watch(() => s.launchVisibility, (v) => v && localStorage.setItem('voxver_launchVisibility', v))
watch(() => s.processPriority, (v) => v && localStorage.setItem('voxver_processPriority', v))
watch(() => s.winW, (v) => localStorage.setItem('voxver_winW', v))
watch(() => s.winH, (v) => localStorage.setItem('voxver_winH', v))
watch(() => s.windowPreset, (v) => v && localStorage.setItem('voxver_windowPreset', v))
watch(() => s.fullscreen, (v) => localStorage.setItem('voxver_fullscreen', String(v)))
watch(() => s.javaPreset, (v) => v && localStorage.setItem('voxver_javaPreset', v))
watch(() => s.javaPath, (v) => localStorage.setItem('voxver_javaPath', v))
watch(() => s.memoryMode, (v) => {
  if (!v) return
  localStorage.setItem('voxver_memoryMode', v)
  window.electronAPI?.config?.set?.('global_memory_mode', v).catch(() => {})
})
watch(() => s.memoryCustomGB, (v) => {
  localStorage.setItem('voxver_memoryCustomGB', String(v))
  window.electronAPI?.config?.set?.('global_memory_custom', String(v)).catch(() => {})
})
watch(() => s.memoryMin, (v) => localStorage.setItem('voxver_memoryMin', String(v)))
watch(() => s.memoryMax, (v) => localStorage.setItem('voxver_memoryMax', String(v)))
watch(() => s.offlineSkin, (v) => v && localStorage.setItem('voxver_offlineSkin', v))
watch(() => s.customSkinPath, (v) => localStorage.setItem('voxver_customSkinPath', v))
watch(() => s.officialSkinName, (v) => localStorage.setItem('voxver_officialSkinName', v))
watch(() => s.jvmArgs, (v) => {
  localStorage.setItem('voxver_jvmArgs', v)
  // 同步到主进程配置，游戏启动时注入 JVM 全局参数
  window.electronAPI?.config?.set?.('global_jvm_args', v).catch(() => {})
})

watch(() => s.gameArgs, (v) => localStorage.setItem('voxver_gameArgs', v))
watch(() => s.preLaunchCmd, (v) => localStorage.setItem('voxver_preLaunchCmd', v))
watch(() => s.memoryManage, (v) => {
  if (!v) return
  localStorage.setItem('voxver_memoryManage', v)
  // 同步到主进程配置，游戏启动时注入 GC 参数
  window.electronAPI?.config?.set?.('global_gc_strategy', v).catch(() => {})
})
watch(() => s.disableJavaLaunchWrapper, (v) => localStorage.setItem('voxver_disableJavaLaunchWrapper', String(v)))
watch(() => s.disableLwjglUnsafeAgent, (v) => localStorage.setItem('voxver_disableLwjglUnsafeAgent', String(v)))
watch(() => s.useHighPerformanceGPU, (v) => localStorage.setItem('voxver_useHighPerformanceGPU', String(v)))

// 个性化类
watch(() => s.opacity, (v) => localStorage.setItem('voxver_opacity', String(v)))
watch(() => s.accentColor, (v) => localStorage.setItem('voxver_accentColor', v))
watch(() => s.bgMusicMode, (v) => v && localStorage.setItem('voxver_bgMusicMode', v))
watch(() => s.titleBarMode, (v) => v && localStorage.setItem('voxver_titleBarMode', v))
watch(() => s.homeContent, (v) => v && localStorage.setItem('voxver_homeContent', v))
watch(() => s.fontSize, (v) => localStorage.setItem('voxver_fontSize', String(v)))
watch(() => s.enableAnimations, (v) => localStorage.setItem('voxver_enableAnimations', String(v)))
watch(() => s.enableEffects, (v) => localStorage.setItem('voxver_enableEffects', String(v)))
watch(() => s.enableSounds, (v) => localStorage.setItem('voxver_enableSounds', String(v)))
watch(() => s.themeCustomColor, (v) => localStorage.setItem('voxver_themeCustomColor', v))
watch(() => s.themeBgOpacity, (v) => localStorage.setItem('voxver_themeBgOpacity', String(v)))

// 下载/社区类
watch(() => s.downloadSource, (v) => v && localStorage.setItem('voxver_downloadSource', v))
watch(() => s.versionListSource, (v) => v && localStorage.setItem('voxver_versionListSource', v))
watch(() => s.maxThreads, (v) => localStorage.setItem('voxver_maxThreads', String(v)))
watch(() => s.speedLimit, (v) => localStorage.setItem('voxver_speedLimit', String(v)))
watch(() => s.modSource, (v) => v && localStorage.setItem('voxver_modSource', v))
watch(() => s.fileNameFormat, (v) => v && localStorage.setItem('voxver_fileNameFormat', v))
watch(() => s.modManageStyle, (v) => v && localStorage.setItem('voxver_modManageStyle', v))

// 快捷键
watch(() => s.hotkeyLaunch, (v) => localStorage.setItem('voxver_hotkeyLaunch', v))
watch(() => s.hotkeyToggleWindow, (v) => localStorage.setItem('voxver_hotkeyToggleWindow', v))
watch(() => s.hotkeyOpenHome, (v) => localStorage.setItem('voxver_hotkeyOpenHome', v))
watch(() => s.hotkeyOpenSettings, (v) => localStorage.setItem('voxver_hotkeyOpenSettings', v))

// 整合包工具
watch(() => s.modpackInstancePath, (v) => localStorage.setItem('voxver_modpackInstancePath', v))
watch(() => s.modpackOutputDir, (v) => localStorage.setItem('voxver_modpackOutputDir', v))
watch(() => s.modpackIncludeConfigs, (v) => localStorage.setItem('voxver_modpackIncludeConfigs', String(v)))
watch(() => s.modpackIncludeMods, (v) => localStorage.setItem('voxver_modpackIncludeMods', String(v)))
watch(() => s.modpackIncludeSaves, (v) => localStorage.setItem('voxver_modpackIncludeSaves', String(v)))
watch(() => s.modpackIncludeResourcepacks, (v) => localStorage.setItem('voxver_modpackIncludeResourcepacks', String(v)))
watch(() => s.modpackName, (v) => localStorage.setItem('voxver_modpackName', v))
watch(() => s.modpackAuthor, (v) => localStorage.setItem('voxver_modpackAuthor', v))
watch(() => s.modpackVersion, (v) => localStorage.setItem('voxver_modpackVersion', v))

// 数据备份
watch(() => s.backupLastTime, (v) => localStorage.setItem('voxver_backupLastTime', v))
watch(() => s.backupFile, (v) => localStorage.setItem('voxver_backupFile', v))

// 调试/开发者选项
watch(() => s.debugMode, (v) => {
  localStorage.setItem('voxver_debugMode', String(v))
  toggleDebugMode()
})
watch(() => s.logLevel, (v) => {
  const level = safeLogLevel(v)
  localStorage.setItem('voxver_logLevel', level)
  window.electronAPI?.logger?.setLevel?.(level).catch(() => {})
})
watch(() => s.useProxy, (v) => localStorage.setItem('voxver_useProxy', String(v)))
watch(() => s.proxyHost, (v) => localStorage.setItem('voxver_proxyHost', v))
watch(() => s.proxyPort, (v) => localStorage.setItem('voxver_proxyPort', String(v)))
watch(() => s.closeToTray, (v) => localStorage.setItem('voxver_closeToTray', String(v)))
watch(() => s.gpuAcceleration, (v) => localStorage.setItem('voxver_gpuAcceleration', String(v)))
watch(() => s.networkLogging, (v) => localStorage.setItem('voxver_networkLogging', String(v)))
watch(() => s.skipCorsCheck, (v) => localStorage.setItem('voxver_skipCorsCheck', String(v)))

// P2 状态变量
const hotkeyList = ref<HotkeyInfo[]>([])
const modpackProgress = ref({ stage: '', progress: 0, currentFile: '' })
const backupProgress = ref({ stage: '', progress: 0, currentItem: '' })
const isWorkingModpack = ref(false)
const isWorkingBackup = ref(false)

// v0.5.3: 诊断日志导出状态
const isExportingDiagnostics = ref(false)
const systemTotalGB = ref<number>(0)
const backupFiles = ref<BackupFileInfo[]>([])

// 更新检查状态
const updateStatus = ref({
  checking: false,
  checked: false,
  available: false,
  downloading: false,
  downloadProgress: 0,
  downloaded: false,
  error: null as string | null,
  version: null as string | null,
  releaseNotes: null as string | null
})

const updateChannel = ref('stable')
const autoCheckUpdate = ref(true)
const showUpdateErrModal = ref(false)
const showUpdateAvailableModal = ref(false)
const showEmailModal = ref(false)


// 权限检测
const permInfo = ref<{ inProtectedDir: boolean; canWriteToUserData: boolean; exePath: string; userDataPath: string; isAdmin: boolean } | null>(null)
const permWarning = computed(() => permInfo.value?.inProtectedDir && !permInfo.value?.isAdmin && !permInfo.value?.canWriteToUserData)

// 下载配置
const downloadConfig = reactive({
  maxConcurrent: 4,
  maxThreadsPerFile: 8,
  speedLimit: 0,
  maxRetries: 5
})

const memoryPercent = computed(() => {
  // 假设 16GB 系统
  const total = 16384
  return Math.round((s.memoryMax / total) * 100)
})

// 启动命令预览（占位实现：根据当前设置拼接示意命令）
const launchCommandPreview = computed(() => {
  const parts: string[] = []
  const java = s.javaPath || 'java'
  parts.push(`"${java}"`)

  // 内存
  if (s.memoryMode === 'custom') {
    parts.push(`-Xms${s.memoryMin}M`)
    parts.push(`-Xmx${s.memoryMax}M`)
  } else {
    parts.push('-Xms1024M')
    parts.push('-Xmx4096M')
  }

  // GC
  if (s.memoryManage === 'g1gc') parts.push('-XX:+UseG1GC')
  else if (s.memoryManage === 'zgc') parts.push('-XX:+UseZGC')
  else if (s.memoryManage === 'parallel') parts.push('-XX:+UseParallelGC')
  else if (s.memoryManage === 'serial') parts.push('-XX:+UseSerialGC')

  // Java 16+ add-opens（Forge/OptiFine 兼容）
  parts.push('--add-opens=java.base/java.lang=ALL-UNNAMED')
  parts.push('--add-opens=java.base/java.lang.reflect=ALL-UNNAMED')
  parts.push('--add-opens=java.base/java.util=ALL-UNNAMED')
  parts.push('--add-opens=java.base/java.net=ALL-UNNAMED')

  // JVM 自定义参数
  if (s.jvmArgs?.trim()) parts.push(s.jvmArgs.trim())

  // classpath + main class（占位）
  parts.push('-cp "versions/<version>/<version>.jar;libraries/*"')
  parts.push('net.minecraft.client.main.Main')

  // 游戏参数
  if (s.officialSkinName) parts.push(`--username "${s.officialSkinName}"`)
  parts.push('--version "<version>"')
  parts.push('--gameDir ".minecraft"')
  parts.push('--assetsDir "assets"')
  parts.push(`--width ${s.winW} --height ${s.winH}`)
  if (s.fullscreen) parts.push('--fullscreen')
  if (s.gameArgs?.trim()) parts.push(s.gameArgs.trim())

  return parts.join(' \\\n  ')
})

const colorPresets = computed(() => [
  { name: t('settings.colorPresets.teal'), value: '#14b8a6' },
  { name: t('settings.colorPresets.sky'), value: '#0ea5e9' },
  { name: t('settings.colorPresets.emerald'), value: '#10b981' },
  { name: t('settings.colorPresets.amber'), value: '#f59e0b' },
  { name: t('settings.colorPresets.coral'), value: '#ef4444' },
  { name: t('settings.colorPresets.rose'), value: '#ec4899' },
  { name: t('settings.colorPresets.violet'), value: '#8b5cf6' }
])


async function browseJava() {
  const path = await window.electronAPI?.dialog.selectFile({
    title: t('settings.javaDialogTitle'),
    filters: [{ name: t('settings.javaExecutableFilter'), extensions: ['exe'] }]
  })
  if (path) {
    s.javaPath = path
    s.javaPreset = 'custom'
  }
}

async function detectJava() {
  isDetectingJava.value = true
  detectionComplete.value = false
  detectedJava.value = []
  selectedJavaId.value = ''
  progressPercent.value = 0

  const steps = [
    { name: t('settings.javaDetectStepEnv'), progress: 25 },
    { name: t('settings.javaDetectStepScan'), progress: 50 },
    { name: t('settings.javaDetectStepSystem'), progress: 75 },
    { name: t('settings.javaDetectStepVerify'), progress: 100 }
  ]

  try {
    // 模拟进度更新
    for (let i = 0; i < steps.length; i++) {
      currentStep.value = `${i + 1}/${steps.length}`
      progressText.value = steps[i].name
      progressPercent.value = steps[i].progress
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    const javas = await window.electronAPI?.java?.detect()
    if (javas) {
      detectedJava.value = javas as JavaInfo[]

      // 如果有检测到Java，自动选择第一个或标记为默认的Java
      if (javas.length > 0) {
        const defaultJava = (javas as JavaInfo[]).find((j: JavaInfo) => j.isDefault) || javas[0] as JavaInfo
        if (defaultJava) {
          selectJava(defaultJava)
        }
      }
    }
  } catch (error) {
    console.error('Java 检测失败:', error)
  } finally {
    isDetectingJava.value = false
    detectionComplete.value = true
    progressPercent.value = 100
  }
}

// 选择 Java 版本
function selectJava(java: JavaInfo) {
  // 更新下拉菜单选择
  selectedJavaId.value = java.id
  s.javaPath = java.path
  s.javaPreset = 'custom'

  // 标记为默认
  detectedJava.value.forEach((j) => (j.isDefault = false))
  java.isDefault = true
}

// 验证 Java 路径
async function validateJavaPath(path: string) {
  try {
    const result = await window.electronAPI?.java?.validate(path)
    if (result?.success) {
      window.electronAPI?.notification?.send({
        title: t('common.success'),
        body: t('settings.javaVerifySuccessBody', { version: result.javaVersion || t('settings.unknown') }) + (result.javacVersion ? ` (Javac: ${result.javacVersion})` : ''),
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('settings.javaVerifyFailed') + `：${result?.error || t('settings.unknownError')}`,
        type: 'error'
      })
    }
  } catch (error) {
    console.error('验证 Java 失败:', error)
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('settings.verificationError'), type: 'error' })
  }
}
async function browseSkin() {
  const path = await window.electronAPI?.dialog?.selectFile({
    title: t('settings.skinDialogTitle'),
    filters: [{ name: t('settings.pngImageFilter'), extensions: ['png'] }]
  })
  if (path) {
    s.customSkinPath = path
    s.offlineSkin = 'custom'
  }
}
async function browseBgImage() {
  const path = await window.electronAPI?.dialog?.selectFile({
    title: t('settings.bgImageDialogTitle'),
    filters: [{ name: t('settings.imageFileFilter'), extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }]
  })
  if (path) {
    appStore.setBgImagePath(path)
  }
}

const bgImagePreviewUrl = ref('')
watch(
  () => appStore.bgImagePath,
  async (p) => {
    if (!p) {
      bgImagePreviewUrl.value = ''
      return
    }
    if (/^https?:\/\//.test(p)) {
      bgImagePreviewUrl.value = p
      return
    }
    const url = await window.electronAPI?.dialog?.readAsDataURL?.(p)
    bgImagePreviewUrl.value = url || ''
  },
  { immediate: true }
)

function onBgPreviewError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

function onResetBackground() {
  appStore.resetBackgroundSettings()
}
async function openMcDir() {
  try {
    const mcDir = await window.electronAPI?.path?.getMinecraft()
    if (mcDir) {
      await window.electronAPI?.shell.openPath(mcDir)
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.tip'),
        body: t('settings.mcDirNotFound'),
        type: 'warning'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.openDirFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

const skinOptions = computed(() => [
  { value: 'random', label: t('settings.skinRandom') },
  { value: 'default', label: 'Steve' },
  { value: 'alex', label: 'Alex' },
  { value: 'official', label: t('settings.skinOfficial') },
  { value: 'custom', label: t('settings.skinCustom') }
])

// ── PxSelect options for converted selects ──

const versionIsolationOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: tm('settings.noIsolation'), value: 'none' },
  { label: tm('settings.byVersion'), value: 'version' },
  { label: tm('settings.byVersionAndGroup'), value: 'versionAndGroup' },
])

const bgMusicOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: tm('settings.musicOff'), value: 'none' },
  { label: tm('settings.customMusic'), value: 'custom' },
])

const bgImageOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: tm('settings.noBgImage'), value: 'none' },
  { label: tm('settings.customImage'), value: 'custom' },
])

const bgImageModeModel = computed({
  get: () => appStore.bgImageMode,
  set: (val: string) => appStore.setBgImageMode(val as 'none' | 'custom'),
})

// 下载源选择策略
const mirrorStrategy = ref<string>('auto')
const mirrorStrategyOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t('settings.mirrorStrategyAuto'), value: 'auto' },
  { label: t('settings.mirrorStrategyOfficial'), value: 'official' },
  { label: t('settings.mirrorStrategyPrefer'), value: 'mirror' },
])
const mirrorStrategyModel = computed({
  get: () => mirrorStrategy.value,
  set: (val: string) => {
    mirrorStrategy.value = val
    void window.electronAPI?.download?.setMirrorStrategy(val)
  },
})

// 同时下载数
const concurrentOptions = computed<Array<{ label: string; value: string }>>(() =>
  [2, 4, 6, 8, 12, 16].map((n) => ({ label: String(n), value: String(n) }))
)
const concurrentModel = computed({
  get: () => String(downloadConfig.maxConcurrent),
  set: (val: string) => {
    downloadConfig.maxConcurrent = Number(val)
    void onConcurrentChange()
  },
})

// 最大下载线程：自动选择 / 手动调节
const threadsAuto = ref(true)

// 启动游戏时（启动器可见性）下拉框
const launchVisibilityOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t('settings.hideLauncher'), value: 'hide' },
  { label: t('settings.minimizeLauncher'), value: 'minimize' },
  { label: t('settings.keepLauncher'), value: 'keep' }
])
const launchVisibilityModel = computed({
  get: () => s.launchVisibility,
  set: (val: string) => { s.launchVisibility = val }
})

// 游戏进程优先级下拉框
const processPriorityOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t('settings.priorityLow'), value: 'low' },
  { label: t('settings.priorityBelowNormal'), value: 'belowNormal' },
  { label: t('settings.priorityNormal'), value: 'normal' },
  { label: t('settings.priorityAboveNormal'), value: 'aboveNormal' },
  { label: t('settings.priorityHigh'), value: 'high' }
])
const processPriorityModel = computed({
  get: () => s.processPriority,
  set: (val: string) => { s.processPriority = val }
})

// 游戏窗口大小下拉框
const windowPresetOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t('settings.advancedSection.defaultWindowSize'), value: 'default' },
  { label: t('settings.advancedSection.fullscreenLaunch'), value: 'fullscreen' },
  { label: t('settings.advancedSection.customSize'), value: 'custom' }
])
const windowPresetModel = computed({
  get: () => s.windowPreset,
  set: (val: string) => { s.windowPreset = val }
})

function onToggleF12(enabled: boolean): void {
  appStore.setEnableF12(enabled)
  void window.electronAPI?.app?.setF12Enabled?.(enabled)
}

async function setThreadsAuto(auto: boolean) {
  threadsAuto.value = auto
  if (auto) {
    downloadConfig.maxThreadsPerFile = 8
  }
  await window.electronAPI?.download?.setMaxThreads(downloadConfig.maxThreadsPerFile)
}

// 下载速度限制：开启=自动（不限速）/ 关闭=手动限速
const speedLimitAuto = ref(true)
async function setSpeedLimitAuto(auto: boolean) {
  speedLimitAuto.value = auto
  if (auto) {
    downloadConfig.speedLimit = 0
  }
  await window.electronAPI?.download?.setSpeedLimit(downloadConfig.speedLimit)
}

// 最大重试次数：开启=自动（默认 5 次）/ 关闭=手动调节
const retriesAuto = ref(true)
async function setRetriesAuto(auto: boolean) {
  retriesAuto.value = auto
  if (auto) {
    downloadConfig.maxRetries = 5
  }
  await window.electronAPI?.download?.setMaxRetries(downloadConfig.maxRetries)
}

const screenshotInstanceOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: tm('common.pleaseSelect'), value: '' },
  ...allInstances.value.map((inst: { id: string; name: string }) => ({
    label: inst.name,
    value: inst.id,
  })),
])

const modSourceOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: tm('settings.curseforge'), value: 'curseforge' },
  { label: tm('settings.modrinth'), value: 'modrinth' },
  { label: tm('settings.both'), value: 'both' },
])

const fileNameFormatOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: tm('settings.nameVersion'), value: 'name-version' },
  { label: tm('settings.idName'), value: 'id-name' },
  { label: tm('settings.original'), value: 'original' },
])

const modManageStyleOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: tm('settings.listMode'), value: 'list' },
  { label: tm('settings.cardMode'), value: 'card' },
])

const logLevelOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' },
])

function onSkinSelect(val: string) {
  if (val === 'custom') {
    browseSkin()
    return
  }
  s.offlineSkin = val
}

async function saveSkin() {
  if (!s.officialSkinName) {
    window.electronAPI?.notification?.send({
      title: t('common.tip'),
      body: t('settings.enterPlayerName'),
      type: 'warning'
    })
    return
  }
  try {
    window.electronAPI?.notification?.send({ title: t('common.success'), body: t('settings.skinSaved'), type: 'success' })
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.skinSaveFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

async function refreshSkin() {
  if (!s.officialSkinName) {
    window.electronAPI?.notification?.send({
      title: t('common.tip'),
      body: t('settings.enterPlayerName'),
      type: 'warning'
    })
    return
  }
  try {
    window.electronAPI?.notification?.send({ title: t('common.success'), body: t('settings.skinRefreshed'), type: 'success' })
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.skinRefreshFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

async function loadJavaSettings() {
  if (!window.electronAPI?.config) return
  const preset = await window.electronAPI.config.get('java_preset') as string | null
  const path = await window.electronAPI.config.get('java_custom_path') as string | null
  if (preset) s.javaPreset = preset
  if (path) s.javaPath = path
}

// 监听 Java 预设变化，保存到 DB
async function saveJavaPreset() {
  if (window.electronAPI?.config) {
    await window.electronAPI.config.set('java_preset', s.javaPreset)
  }
}

// 监听自定义路径变化，保存到 DB
async function saveJavaPath() {
  if (window.electronAPI?.config) {
    await window.electronAPI.config.set('java_custom_path', s.javaPath)
  }
}

// 监听 javaPreset 和 javaPath 变化，自动保存
watch(() => s.javaPreset, saveJavaPreset)
watch(() => s.javaPath, saveJavaPath)

// ========== P2: 全局快捷键 ==========
async function loadHotkeys() {
  try {
    const list = await window.electronAPI?.hotkey?.list()
    if (list) {
      hotkeyList.value = list as HotkeyInfo[]
      (list as HotkeyInfo[]).forEach((h: HotkeyInfo) => {
        if (h.action === 'launch-game') s.hotkeyLaunch = h.accelerator || 'Ctrl+Shift+L'
        else if (h.action === 'toggle-window')
          s.hotkeyToggleWindow = h.accelerator || 'Ctrl+Shift+H'
        else if (h.action === 'open-home') s.hotkeyOpenHome = h.accelerator || 'Ctrl+Shift+O'
        else if (h.action === 'open-settings') s.hotkeyOpenSettings = h.accelerator || 'Ctrl+,'
      })
    }
  } catch (e) {
    console.warn('加载快捷键失败:', e)
  }
}

async function updateHotkey(action: string, accelerator: string) {
  try {
    const res = await window.electronAPI?.hotkey?.update({
      id: action,
      action,
      accelerator,
      enabled: true
    })
    if (res?.error) {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('settings.hotkeySaveFailedBody', { error: res.error }),
        type: 'error'
      })
      return
    }
    window.electronAPI?.notification?.send({ title: t('common.success'), body: t('settings.hotkeyUpdated'), type: 'success' })
    await loadHotkeys()
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.hotkeyUpdateFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

async function validateHotkey(accelerator: string) {
  try {
    const res = await window.electronAPI?.hotkey?.validate(accelerator)
    return res?.valid
  } catch (e) {
    return false
  }
}

async function reloadHotkeys() {
  try {
    await window.electronAPI?.hotkey?.reload()
    window.electronAPI?.notification?.send({
      title: t('common.success'),
      body: t('settings.hotkeyReloaded'),
      type: 'success'
    })
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.hotkeyReloadFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

// ========== P2: 整合包工具 ==========
async function browseModpackInstance() {
  try {
    const path = await window.electronAPI?.dialog?.selectFolder({
      title: t('settings.modpackInstanceTitle')
    })
    if (path) s.modpackInstancePath = path
  } catch (e: unknown) {
    console.error('选择实例目录失败:', e)
  }
}

async function browseModpackOutput() {
  try {
    const path = await window.electronAPI?.dialog?.selectFolder({
      title: t('settings.modpackOutputTitle')
    })
    if (path) s.modpackOutputDir = path
  } catch (e: unknown) {
    console.error('选择输出目录失败:', e)
  }
}

async function packAsMrpack() {
  if (!s.modpackInstancePath) {
    window.electronAPI?.notification?.send({
      title: t('common.tip'),
      body: t('settings.selectInstanceDir'),
      type: 'warning'
    })
    return
  }
  if (!s.modpackName) {
    window.electronAPI?.notification?.send({
      title: t('common.tip'),
      body: t('settings.enterModpackName'),
      type: 'warning'
    })
    return
  }
  try {
    isWorkingModpack.value = true
    modpackProgress.value = { stage: t('settings.modpackPacking'), progress: 0, currentFile: '' }

    const result = await window.electronAPI?.modpack?.pack({
      instancePath: s.modpackInstancePath,
      outputPath: s.modpackOutputDir,
      options: {
        includeConfigs: s.modpackIncludeConfigs,
        includeMods: s.modpackIncludeMods,
        includeSaves: s.modpackIncludeSaves,
        includeResourcepacks: s.modpackIncludeResourcepacks,
        name: s.modpackName,
        author: s.modpackAuthor,
        version: s.modpackVersion
      }
    })

    if (result?.ok) {
      window.electronAPI?.notification?.send({
        title: t('common.success'),
        body: t('settings.modpackCreateSuccessBody', { path: result.filePath || t('settings.unknown') }),
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('settings.modpackFailedBody', { error: result?.error || t('settings.unknownError') }),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.modpackCreateErrorBody', { error: (e as Error).message }),
      type: 'error'
    })
  } finally {
    isWorkingModpack.value = false
  }
}

async function importMrpack() {
  try {
    const mrpackPath = await window.electronAPI?.dialog?.selectFile({
      title: t('settings.mrpackDialogTitle'),
      filters: [{ name: t('settings.modrinthModpackFilter'), extensions: ['mrpack'] }]
    })
    if (!mrpackPath) return

    const targetDir = await window.electronAPI?.dialog?.selectFolder({
      title: t('settings.installTargetDir')
    })
    if (!targetDir) return

    const instanceName = prompt(t('settings.promptNewInstanceName'), 'New Modpack')
    if (!instanceName) return

    isWorkingModpack.value = true
    modpackProgress.value = { stage: t('settings.modpackImporting'), progress: 0, currentFile: '' }

    const result = await window.electronAPI?.modpack?.import({
      mrpackPath,
      targetParentDir: targetDir,
      instanceName
    })

    if (result?.ok) {
      window.electronAPI?.notification?.send({
        title: t('common.success'),
        body: t('settings.modpackImportSuccessBody', { path: result.instancePath || t('settings.unknown') }),
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('settings.modpackImportFailedBody', { error: result?.error || t('settings.unknownError') }),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.modpackImportErrorBody', { error: (e as Error).message }),
      type: 'error'
    })
  } finally {
    isWorkingModpack.value = false
  }
}

// ========== P2: 主题自定义增强 ==========
const quickColorPresets = [
  '#14b8a6', '#6366f1', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#8b5cf6', '#ef4444',
  '#84cc16', '#f97316', '#3b82f6', '#a855f7'
]

/** 待应用颜色的主色阶梯：跟随取色器/色号实时变化，供「应用」前预览 */
const pendingColorScale = computed(() => {
  const hex = /^#[0-9a-fA-F]{6}$/.test(s.themeCustomColor) ? s.themeCustomColor : s.themeColor
  const light = (p: number) => `color-mix(in oklab, ${hex} ${p}%, #ffffff)`
  const dark = (p: number) => `color-mix(in oklab, ${hex} ${p}%, #000000)`
  return [light(8), light(16), light(32), light(48), light(64), hex, dark(86), dark(70)]
})
function previewThemeColor(hex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return
  // 只预览主色和渐变，不保存
  const root = document.documentElement
  root.style.setProperty('--voxver-primary', hex)
  root.style.setProperty('--voxver-primary-hover', hex)
  root.style.setProperty('--voxver-nav-active-color', hex)
  root.style.setProperty('--voxver-accent', hex)
  root.style.setProperty('--voxver-progress-bg', hex)
  root.style.setProperty('--voxver-gradient-primary', hex)
}


/** 切换显示模式：仅切换界面明暗，不涉及排版 */
function onSelectThemeMode(mode: ThemeMode) {
  if (appStore.theme === mode) return
  appStore.setTheme(mode)
}

/** 切换排版预设：进入/离开 Koring 需要重启以应用整套排版 */
async function onSelectSkin(next: ThemeSkin) {
  if (appStore.skin === next) return
  const ok = await pxConfirm({
    title: t('settings.skinSection'),
    message: t('settings.koringRestartConfirm'),
    type: 'warning',
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel')
  })
  if (!ok) return
  appStore.setSkin(next)
  window.electronAPI?.app?.relaunch?.()
}

async function applyCustomThemeColor(hex: string) {
  try {
    const vars = await window.electronAPI?.theme?.computeVars(hex)
    if (vars) {
      const root = document.documentElement
      Object.entries(vars).forEach(([k, v]) => {
        root.style.setProperty(k, String(v))
      })
    }
    // 也调用前端色阶生成
    applyThemeColor(hex)
  } catch (e: unknown) {
    // IPC 不可用时纯前端降级
    console.warn('后端 computeVars 不可用，使用纯前端色阶', e)
    applyThemeColor(hex)
  }
}

async function importBgImage() {
  try {
    const path = await window.electronAPI?.dialog?.selectFile({
      title: t('settings.bgImageDialogTitle'),
      filters: [{ name: t('settings.imageFilter'), extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] }]
    })
    if (!path) return
    const local = await window.electronAPI?.theme?.importBackground(path)
    if (local) {
      appStore.setBgImageMode('custom')
      appStore.setBgImagePath(local)
      window.electronAPI?.notification?.send({
        title: t('common.success'),
        body: t('settings.bgSaved'),
        type: 'success'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.bgImportFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

// ========== P2: 数据备份/恢复 ==========
async function createBackup() {
  try {
    isWorkingBackup.value = true
    backupProgress.value = { stage: t('settings.backupInProgress'), progress: 0, currentItem: '' }
    const result = await window.electronAPI?.backup?.create()
    if (result?.ok) {
      s.backupLastTime = new Date().toLocaleString()
      window.electronAPI?.notification?.send({
        title: t('common.success'),
        body: t('settings.backupCreateSuccessBody', {
          path: result.filePath || t('settings.unknown'),
          size: result.size != null ? (result.size / 1024).toFixed(1) : t('settings.unknown')
        }),
        type: 'success'
      })
      await listBackups()
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('settings.backupFailedBody', { error: result?.error || t('settings.unknownError') }),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.backupErrorBody', { error: (e as Error).message }),
      type: 'error'
    })
  } finally {
    isWorkingBackup.value = false
  }
}

async function restoreBackup() {
  try {
    const path = await window.electronAPI?.dialog?.selectFile({
      title: t('settings.backupFileTitle'),
      filters: [{ name: t('settings.backupFileFilter'), extensions: ['zip'] }]
    })
    if (!path) return

    if (!await pxConfirm({ title: t('common.warning'), message: t('settings.restoreBackupConfirm'), type: 'warning', confirmText: t('common.confirm') })) return

    isWorkingBackup.value = true
    backupProgress.value = { stage: t('settings.backupRestoring'), progress: 0, currentItem: '' }

    const result = await window.electronAPI?.backup?.restore(path)
    if (result?.ok) {
      window.electronAPI?.notification?.send({
        title: t('common.success'),
        body: t('settings.backupRestored'),
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: t('settings.backupRestoreFailedBody', { error: result?.error || t('settings.unknownError') }),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.backupRestoreErrorBody', { error: (e as Error).message }),
      type: 'error'
    })
  } finally {
    isWorkingBackup.value = false
  }
}

async function listBackups() {
  try {
    const list = await window.electronAPI?.backup?.list()
    backupFiles.value = (list as BackupFileInfo[]) || []
  } catch (e: unknown) {
    console.warn('列出备份失败:', e)
  }
}

async function deleteBackup(fileName: string) {
  if (!await pxConfirm({ title: t('common.warning'), message: t('settings.deleteBackupConfirm', { name: fileName }), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    await window.electronAPI?.backup?.delete(fileName)
    await listBackups()
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.deleteFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

// ====== v0.5.3: 调试与诊断 ======
async function toggleDebugMode() {
  try {
    const level = s.debugMode ? 'DEBUG' : 'INFO'
    await window.electronAPI?.logger?.setLevel(level)
    window.electronAPI?.notification?.send({
      title: t('settings.debugModeTitle'),
      body: s.debugMode ? t('settings.debugModeOn') : t('settings.debugModeOff'),
      type: 'info'
    })
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.setLogLevelFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

async function exportDiagnostics() {
  if (isExportingDiagnostics.value) return
  isExportingDiagnostics.value = true
  try {
    const result = await window.electronAPI?.logger?.exportDiagnostics()
    if (result?.ok) {
      window.electronAPI?.notification?.send({
        title: t('settings.exportSuccess'),
        body: t('settings.diagSavedToBody', { path: result.path }),
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('settings.exportFailed'),
        body: result?.error || t('settings.unknownError'),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.diagExportFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  } finally {
    isExportingDiagnostics.value = false
  }
}

// ====== 更新检查（跳转独立版本更新页面，检测/下载/安装在该页内完成） ======
function checkForUpdate(): void {
  router.push('/update')
}

async function loadUpdateConfig() {
  try {
    const config = await window.electronAPI?.updater?.getConfig()
    if (config) {
      updateChannel.value = config.channel || 'stable'
      autoCheckUpdate.value = config.autoCheck !== false
    }
  } catch { /* ignore */ }
}

async function onUpdateChannelChange(channel: string) {
  updateChannel.value = channel
  await window.electronAPI?.updater?.setChannel(channel)
}

async function onAutoCheckChange() {
  await window.electronAPI?.updater?.setAutoCheck(autoCheckUpdate.value)
}

// ====== 下载配置 ======
async function loadDownloadConfig() {
  try {
    const res = await window.electronAPI?.download?.getDownloadConfig()
    if (res?.success && res.data) {
      const d = res.data
      downloadConfig.maxConcurrent = d.maxConcurrent
      downloadConfig.maxThreadsPerFile = d.maxThreadsPerFile
      downloadConfig.speedLimit = d.speedLimit
      downloadConfig.maxRetries = d.maxRetries
      if (d.mirrorStrategy) mirrorStrategy.value = d.mirrorStrategy
    }
  } catch { /* ignore */ }
}

// ====== 服务联通性测试 ======
interface ServiceCheckItem {
  key: string
  name: string
  url: string
  group: string
  online: boolean
  latency: number
  error?: string
}

const showServiceTest = computed(() => route.query.tab === 'connectivity')
const serviceTesting = ref(false)
const serviceTestError = ref('')
const serviceTested = ref(false)
const serviceResults = ref<ServiceCheckItem[]>([])

/** 按服务分组展示 */

const serviceGroups = computed<Array<{ key: string; items: ServiceCheckItem[] }>>(() => {
  const groups: Array<{ key: string; items: ServiceCheckItem[] }> = []
  for (const item of serviceResults.value) {
    const group = groups.find((g) => g.key === item.group)
    if (group) group.items.push(item)
    else groups.push({ key: item.group, items: [item] })
  }
  return groups
})

const SERVICE_GROUP_LABEL: Record<string, string> = {
  source: 'settings.serviceGroupSource',
  mod: 'settings.serviceGroupMod',
  loader: 'settings.serviceGroupLoader',
  account: 'settings.serviceGroupAccount'
}

/** Koring 覆盖层用：分组服务列表（保持检测结果顺序，带分组标题） */
const korServiceGroups = computed(() =>
  serviceGroups.value.map((group) => ({
    key: group.key,
    label: t(SERVICE_GROUP_LABEL[group.key] || 'settings.serviceGroupSource'),
    items: group.items
  }))
)

/** 载入服务列表（仅展示，不检测） */
async function loadServiceList() {
  serviceTestError.value = ''
  const api = window.electronAPI?.download
  if (!api?.listServices || !api?.testServices) {
    serviceResults.value = []
    serviceTestError.value = t('settings.serviceTestUnavailable')
    return
  }
  try {
    const res = await api.listServices()
    if (res?.success && Array.isArray(res.data)) {
      serviceTested.value = false
      serviceResults.value = res.data.map((item) => ({ ...item, online: false, latency: -1 }))
    } else {
      serviceResults.value = []
      serviceTestError.value = res?.error || t('settings.serviceTestFailed')
    }
  } catch (e: unknown) {
    serviceResults.value = []
    serviceTestError.value = (e as Error)?.message || t('settings.serviceTestFailed')
  }
}

/** 延迟分档：< 300ms 绿、< 1000ms 黄、其余红 */
function serviceBadgeClass(item: ServiceCheckItem): string {
  if (!serviceTested.value) return 'is-pending'
  if (!item.online) return 'is-offline'
  if (item.latency >= 1000) return 'is-offline'
  if (item.latency >= 300) return 'is-slow'
  return 'is-online'
}

function serviceBadgeText(item: ServiceCheckItem): string {
  if (!serviceTested.value) return t('settings.serviceUntested')
  return item.online ? `${item.latency} ms` : t('settings.serviceOffline')
}

async function runServiceTest() {
  if (serviceTesting.value) return
  serviceTestError.value = ''
  const api = window.electronAPI?.download
  if (!api?.testServices) {
    serviceResults.value = []
    serviceTestError.value = t('settings.serviceTestUnavailable')
    return
  }
  serviceTesting.value = true
  toast({ message: t('settings.serviceTesting'), type: 'info' })
  try {
    const res = await api.testServices()
    if (res?.success && Array.isArray(res.data)) {
      serviceResults.value = res.data
      serviceTested.value = true
      const online = res.data.filter((item: ServiceCheckItem) => item.online).length
      toast({ message: t('settings.serviceTestDone', { online, total: res.data.length }), type: 'success' })
    } else {
      serviceResults.value = []
      serviceTestError.value = res?.error || t('settings.serviceTestFailed')
    }
  } catch (e: unknown) {
    serviceResults.value = []
    serviceTestError.value = (e as Error)?.message || t('settings.serviceTestFailed')
  } finally {
    serviceTesting.value = false
  }
}

/** 进入服务联通性测试子页面并开始检测 */
function openServiceTest() {
  void router.push({ path: '/settings', query: { tab: 'connectivity' } })
}

/** 返回下载与网络设置 */
function closeServiceTest() {
  void router.replace({ path: '/settings' })
}

// 进入子页面时载入服务列表（不自动检测）；切换设置分类时退出子页面
watch(
  showServiceTest,
  (visible) => {
    if (visible) void loadServiceList()
  },
  { immediate: true }
)

// 切换分类时回到顶部
watch(activeCategory, () => {
  pageRef.value?.scrollTo({ top: 0 })
  if (route.query.tab) void router.replace({ path: '/settings' })
})

async function onConcurrentChange() {
  await window.electronAPI?.download?.setMaxConcurrent(downloadConfig.maxConcurrent)
}

async function onThreadsChange() {
  await window.electronAPI?.download?.setMaxThreads(downloadConfig.maxThreadsPerFile)
}

async function onSpeedLimitChange() {
  await window.electronAPI?.download?.setSpeedLimit(downloadConfig.speedLimit * 1024)
}

async function onRetriesChange() {
  await window.electronAPI?.download?.setMaxRetries(downloadConfig.maxRetries)
}

// ====== 数据迁移 (HMCL/PCL2) ======
interface ExternalInst {
  name: string; version: string; loaderType: string; loaderVersion: string
  gameDir: string; modCount: number; source: string
}
interface ExternalLauncher {
  type: string; name: string; path: string; instances: ExternalInst[]; detected: boolean
}
const externalLaunchers = ref<ExternalLauncher[]>([])
const externalLaunchersLoading = ref(false)
const externalLaunchersDetected = ref<boolean | null>(null)

async function detectExternalLaunchers() {
  externalLaunchersLoading.value = true
  externalLaunchersDetected.value = null
  try {
    const res = await window.electronAPI?.externalLauncher?.detect()
    if (res?.success && Array.isArray(res.data)) {
      externalLaunchers.value = res.data as ExternalLauncher[]
      externalLaunchersDetected.value = res.data.length > 0
    } else {
      externalLaunchersDetected.value = false
    }
  } catch { externalLaunchersDetected.value = false }
  // web 模式下 electronAPI 不可用，显示空状态
  if (externalLaunchersDetected.value === null) {
    externalLaunchersDetected.value = false
  }
  externalLaunchersLoading.value = false
}

async function importExternalInstance(gameDir: string) {
  try {
    await window.electronAPI?.instance?.importInstance('', gameDir)
    // Reload instances list
    window.electronAPI?.notification?.send({
      title: t('settings.importSuccess'),
      body: t('settings.instanceImported'),
      type: 'success'
    })
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('settings.importFailed'),
      body: (e as Error)?.message || t('settings.unknownError'),
      type: 'error'
    })
  }
}

async function checkForUpdateDownload() {
  try {
    await window.electronAPI?.updater?.download()
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.downloadFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

async function installUpdate() {
  try {
    await window.electronAPI?.updater?.install()
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: t('settings.installFailedBody', { error: (e as Error).message }),
      type: 'error'
    })
  }
}

async function checkAppPermissions() {
  try {
    const info = await window.electronAPI?.app?.checkPermissions()
    if (info) permInfo.value = info
  } catch { /* ignore */ }
}

// 更新状态负载类型
interface UpdateStatusPayload {
  checking: boolean
  available: boolean
  downloading: boolean
  downloaded: boolean
  downloadProgress: number
  error?: string | null
  version?: string
  releaseNotes?: string
}

function setupUpdateListener() {
  const unsub = window.electronAPI?.updater?.onStatusChange((status: unknown) => {
    const s = status as UpdateStatusPayload
    updateStatus.value = {
      checking: s.checking,
      checked: !s.checking,
      available: s.available,
      downloading: s.downloading,
      downloadProgress: s.downloadProgress,
      downloaded: s.downloaded,
      error: s.error ?? null,
      version: s.version ?? null,
      releaseNotes: s.releaseNotes ?? null
    }
    // 新版本可用时自动弹出弹窗（下载失败时不自动重开）
    if (s.available && !s.downloading && !s.downloaded && !s.error) {
      showUpdateAvailableModal.value = true
    }
  })
  return unsub
}

async function startDownloadFromModal() {
  updateStatus.value = { ...updateStatus.value, downloading: true, downloadProgress: 0, error: null }
  await downloadUpdate()
}

// 更新说明的渲染统一走 src/utils/markdown.ts 的 renderMarkdownSafe：
// 它先整体 HTML 转义再产出受控标签、链接只允许 http(s)，杜绝远端文案注入 HTML/事件属性（S-01）。

async function downloadUpdate() {
  await window.electronAPI?.updater?.download()
}
 

// 注册更新状态监听（顶层 setup，不依赖异步数据）
const unsubUpdate = setupUpdateListener()
onUnmounted(() => {
  unsubUpdate()
})

// P2 初始化
onMounted(async () => {
  // 先恢复主题色（避免等待异步操作）
  const savedColor = localStorage.getItem('voxver_themeColor')
  if (savedColor && /^#[0-9a-f]{6}$/i.test(savedColor)) {
    s.themeColor = savedColor
  }

  await loadHotkeys()
  await listBackups()
  await loadUpdateConfig()
  await loadDownloadConfig()
  await loadThemePresets()
  await instancesStore.fetchInstances()
  checkAppPermissions()

  // 恢复启动时自动检查的结果（状态广播可能发生在本页挂载之前）
  try {
    const st = await window.electronAPI?.updater?.getStatus()
    const d = st?.data as UpdateStatusPayload | undefined
    if (d?.available && !d.downloading && !d.downloaded && !d.error) {
      updateStatus.value = {
        ...updateStatus.value,
        checked: true,
        available: true,
        error: null,
        version: d.version ?? null,
        releaseNotes: d.releaseNotes ?? null
      }
      showUpdateAvailableModal.value = true
    }
  } catch { /* ignore */ }
})

// ====== 应用版本 ======
const appVersion = ref('Alpha')

/** 关于页版本号连点计数（解锁开发者选项，静默无提示） */
const versionTapCount = ref(0)
/** 开发者密钥输入 */
const developerKeyInput = ref('')
function handleUnlockDeveloper(): void {
  const ok = appStore.unlockDeveloperWithKey(developerKeyInput.value)
  if (ok) {
    developerKeyInput.value = ''
    toast({ message: t('settings.developerKeyUnlocked'), type: 'success' })
  } else {
    toast({ message: t('settings.developerKeyInvalid'), type: 'error' })
  }
}
function handleVersionTap(): void {
  if (appStore.developerMode) return
  versionTapCount.value += 1
  if (versionTapCount.value >= 7) {
    versionTapCount.value = 0
    appStore.unlockDeveloperMode()
  }
}
/** 构建时的 git 提交短哈希（由 vite define 注入，开发/无 git 环境为 dev 时隐藏） */
const appCommit = typeof __APP_COMMIT__ === 'string' && __APP_COMMIT__ !== 'dev' ? __APP_COMMIT__ : ''

onMounted(async () => {
  // 同步 F12 开关给主进程（默认关闭）
  void window.electronAPI?.app?.setF12Enabled?.(appStore.enableF12)
  try {
    const v = await window.electronAPI?.app?.getVersion?.()
    if (v) appVersion.value = v
  } catch { /* fallback to Alpha */ }
  loadAppPaths()
  loadRuntimeInfo()
  loadP2pSettings()
})

// ====== 安全识别服务 ======
const securitySettings = reactive({
  modScan: localStorage.getItem('voxver_security_modScan') !== 'false',
  scanEngine: localStorage.getItem('voxver_security_engine') || 'builtin',
  virusTotalKey: localStorage.getItem('voxver_security_vt_key') || '',
  sensitivity: localStorage.getItem('voxver_security_sensitivity') || 'standard',
  hashCheck: localStorage.getItem('voxver_security_hash') !== 'false',
  autoQuarantine: localStorage.getItem('voxver_security_quarantine') !== 'false',
  trustModrinth: localStorage.getItem('voxver_security_trust_modrinth') !== 'false',
  trustCurseForge: localStorage.getItem('voxver_security_trust_curseforge') !== 'false'
})

function saveSecuritySettings() {
  localStorage.setItem('voxver_security_modScan', String(securitySettings.modScan))
  localStorage.setItem('voxver_security_engine', securitySettings.scanEngine)
  localStorage.setItem('voxver_security_vt_key', securitySettings.virusTotalKey)
  localStorage.setItem('voxver_security_sensitivity', securitySettings.sensitivity)
  localStorage.setItem('voxver_security_hash', String(securitySettings.hashCheck))
  localStorage.setItem('voxver_security_quarantine', String(securitySettings.autoQuarantine))
  localStorage.setItem('voxver_security_trust_modrinth', String(securitySettings.trustModrinth))
  localStorage.setItem('voxver_security_trust_curseforge', String(securitySettings.trustCurseForge))
}

// ====== 联机 P2P 设置 ======
const p2pSettings = reactive({
  useCustomServer: localStorage.getItem('p2p_use_custom_server') === 'true',
  signalingServer: '',
  chunkSize: '1024',
  connectionTimeout: '30'
})

async function loadP2pSettings() {
  try {
    const result = await window.electronAPI?.share?.getSettings?.()
    if (result?.ok && result.settings) {
      p2pSettings.signalingServer = result.settings.signalingServer || ''
      p2pSettings.chunkSize = String(result.settings.chunkSize || 1024)
      p2pSettings.connectionTimeout = String((result.settings.connectionTimeout || 30000) / 1000)
    }
  } catch { /* ignore */ }
}

async function saveP2pSettings() {
  localStorage.setItem('p2p_use_custom_server', String(p2pSettings.useCustomServer))
  await window.electronAPI?.share?.saveSettings?.({
    signalingServer: p2pSettings.signalingServer,
    chunkSize: Number(p2pSettings.chunkSize),
    connectionTimeout: Number(p2pSettings.connectionTimeout) * 1000
  })
}

// ====== 开发者选项辅助函数 ======
function openDevTools() {
  window.electronAPI?.devTools?.open?.()
}

// 快捷打开目录（与 env.d.ts 中 app.getPaths 返回类型保持一致）
type AppPathKey = 'userData' | 'logs' | 'temp' | 'cache' | 'downloads' | 'home'
const appPaths = ref<Record<AppPathKey, string> | null>(null)

async function loadAppPaths() {
  try {
    appPaths.value = await window.electronAPI?.app?.getPaths?.() || null
  } catch { /* ignore */ }
}

async function openDirectory(key: AppPathKey) {
  if (!appPaths.value) await loadAppPaths()
  const p = appPaths.value?.[key]
  if (p) {
    try {
      await window.electronAPI?.shell?.openPath?.(p)
    } catch (e: unknown) {
      window.electronAPI?.notification?.send({
        title: t('settings.openFailed'),
        body: (e as Error)?.message || t('settings.openDirFailed'),
        type: 'error'
      })
    }
  }
}

// 清除缓存
const isClearingCache = ref(false)
async function clearCache() {
  if (isClearingCache.value) return
  isClearingCache.value = true
  try {
    await window.electronAPI?.app?.clearCache?.()
    window.electronAPI?.notification?.send({
      title: t('settings.cacheCleared'),
      body: t('settings.clearCacheDesc'),
      type: 'success'
    })
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: (e as Error)?.message || t('settings.clearCacheFailed'),
      type: 'error'
    })
  } finally {
    isClearingCache.value = false
  }
}

// 清除下载缓存
async function clearDownloadCache() {
  try {
    const ok = await window.electronAPI?.app?.clearDownloadCache?.()
    if (ok === false) {
      // Fallback: 通知用户手动清除
      window.electronAPI?.notification?.send({
        title: t('common.tip'),
        body: t('settings.clearCacheManually', { type: t('settings.download') }),
        type: 'warning'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('settings.cacheCleared'),
        body: t('settings.clearDownloadCacheSuccess'),
        type: 'success'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: (e as Error)?.message || t('settings.clearCacheFailed'),
      type: 'error'
    })
  }
}

// 清除版本缓存
async function clearVersionCache() {
  try {
    const ok = await window.electronAPI?.app?.clearVersionCache?.()
    if (ok === false) {
      window.electronAPI?.notification?.send({
        title: t('common.tip'),
        body: t('settings.clearCacheManually', { type: t('settings.version') }),
        type: 'warning'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('settings.cacheCleared'),
        body: t('settings.clearVersionCacheSuccess'),
        type: 'success'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: (e as Error)?.message || t('settings.clearCacheFailed'),
      type: 'error'
    })
  }
}

// 运行环境信息
const runtimeInfo = ref<{ appVersion: string; electron: string; chrome: string; node: string; v8: string; platform: string; arch: string } | null>(null)

async function loadRuntimeInfo() {
  try {
    runtimeInfo.value = await window.electronAPI?.app?.getRuntimeInfo?.() || null
  } catch { /* ignore */ }
}

// 重置启动器
async function resetSettings() {
  if (!await pxConfirm({ title: t('common.warning'), message: t('settings.devResetConfirm'), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    const ok = await window.electronAPI?.app?.resetSettings?.()
    if (ok) {
      localStorage.clear()
      window.electronAPI?.window?.close?.()
    } else {
      window.electronAPI?.notification?.send({
        title: t('settings.resetFailedTitle'),
        body: t('settings.resetFailedDesc'),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('common.error'),
      body: (e as Error)?.message || t('settings.resetFailedTitle'),
      type: 'error'
    })
  }
}

function handleEmailCopy() {
  const email = 'sksadfg@163.com'
  navigator.clipboard.writeText(email).then(() => {
    toast({ message: t('more.emailCopied'), type: 'success' })
  })
}

function openSponsorLink() {
  window.electronAPI?.shell?.openExternal?.('https://www.ifdian.net/a/Eccen')
}

// ====== 主题色应用：用户选择颜色后实时更新全局 CSS 变量 ======
function applyThemeColor(hex: string) {
  s.themeColor = hex
  localStorage.setItem('voxver_themeColor', hex)
  const root = document.documentElement
  const rgb = hexToRgb(hex)

  // 核心主色
  root.style.setProperty('--voxver-primary', hex)

  // 自动生成完整色阶
  const shades = generatePalette(rgb)
  for (const [key, val] of Object.entries(shades)) {
    root.style.setProperty(key, val)
  }

  // 渐变色（Apple 纯色，无渐变）
  const darker = mixColor(rgb, { r: 0, g: 0, b: 0 }, 0.2)
  root.style.setProperty('--voxver-gradient-primary', hex)
  root.style.setProperty('--voxver-shadow-glow-primary', 'none')
}

// ====== 主题预设 ======
const themePresets = ref<Array<{ id: string; name: string; description: string; themeColor: string; accentColor: string }>>([])

// * ====== 主题颜色选择（预设 / 自定义） ======
const customColorInputRef = ref<HTMLInputElement | null>(null)

/** 当前选中的颜色是否就是某个预设 */
function isPresetColorActive(hex: string): boolean {
  return (
    s.themeColor?.toLowerCase() === hex.toLowerCase() &&
    s.themeCustomColor?.toLowerCase() === hex.toLowerCase()
  )
}

/** 是否处于「自定义」状态：当前生效色不匹配任何预设，或已手动改动色号 */
const isCustomColorActive = computed(() => {
  const current = s.themeColor?.toLowerCase()
  const custom = s.themeCustomColor?.toLowerCase()
  if (!current) return true
  if (custom && custom !== current) return true
  return !themePresets.value.some((p) => p.themeColor.toLowerCase() === current)
})

/** 点选预设：应用颜色，同时把取色器/色号同步成该颜色 */
function selectPresetColor(themeColor: string, accentColor: string) {
  s.themeCustomColor = themeColor
  s.accentColor = accentColor
  applyThemeColor(themeColor)
}

/** 点「自定义」：聚焦到色号输入框，方便直接输入 */
function focusCustomColorInput() {
  customColorInputRef.value?.focus()
  customColorInputRef.value?.select()
}

/** 取色器拖动时：写入色号并实时预览 */
function onCustomColorInput(hex: string) {
  s.themeCustomColor = hex
  previewThemeColor(hex)
}

async function loadThemePresets() {
  try {
    const presets = await window.electronAPI?.theme?.getPresets()
    if (Array.isArray(presets)) {
      themePresets.value = presets
    }
  } catch { /* ignore */ }
}

async function exportCurrentTheme() {
  try {
    const res = await window.electronAPI?.theme?.exportTheme?.({
      themeColor: s.themeColor,
      bgImageMode: 'none',
      bgImageLocalPath: '',
      bgOpacity: 100,
      bgBlur: 0,
      bgColorOverlay: false,
      accentColor: s.accentColor || '#8b5cf6'
    })
    if (res?.ok && res.json) {
      // Save to file via dialog
      const filePath = await window.electronAPI?.dialog?.selectFile?.({
        title: t('settings.saveThemeFile'),
        filters: [{ name: t('settings.voxverThemeFilter'), extensions: ['voxver_theme.json'] }]
      })
      if (filePath) {
        // For now, copy to clipboard
        await navigator.clipboard.writeText(res.json)
        window.electronAPI?.notification?.send({
          title: t('settings.themeExported'),
          body: t('settings.themeExportedDesc'),
          type: 'success'
        })
      }
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('settings.exportFailed'),
      body: (e as Error)?.message || t('settings.unknownError'),
      type: 'error'
    })
  }
}

function importThemeFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const content = await file.text()
      const res = await window.electronAPI?.theme?.importTheme?.(content)
      if (res?.ok && res.settings) {
        const s = res.settings as { themeColor?: string }
        applyThemeColor(s.themeColor || '#6366f1')
        window.electronAPI?.notification?.send({
          title: t('settings.themeImported'),
          body: t('settings.themeApplied'),
          type: 'success'
        })
      } else {
        window.electronAPI?.notification?.send({
          title: t('settings.importFailed'),
          body: res?.error || t('settings.invalidThemeFile'),
          type: 'error'
        })
      }
    } catch (e: unknown) {
      window.electronAPI?.notification?.send({
        title: t('settings.importFailed'),
        body: (e as Error)?.message || t('settings.unknownError'),
        type: 'error'
      })
    }
  }
  input.click()
}

// ====== 游戏截图 ======
const screenshotInstanceId = ref('')
const screenshots = ref<Array<{ fileName: string; filePath: string; size: number; createdAt: number; thumbnail: string | null }>>([])
const screenshotsLoading = ref(false)

watch(screenshotInstanceId, () => loadScreenshots())

async function loadScreenshots() {
  if (!screenshotInstanceId.value) {
    screenshots.value = []
    return
  }
  screenshotsLoading.value = true
  try {
    const inst = allInstances.value.find((i: { id: string }) => i.id === screenshotInstanceId.value)
    if (!inst) return
    const res = await window.electronAPI?.screenshot?.list(inst.path || '')
    if (res?.ok && Array.isArray(res.data)) {
      screenshots.value = res.data
    }
  } catch { screenshots.value = [] }
  screenshotsLoading.value = false
}

function formatScreenshotDate(ts: number): string {
  return new Date(ts).toLocaleString()
}

async function previewScreenshot(s: { filePath: string }) {
  try {
    const res = await window.electronAPI?.screenshot?.open(s.filePath)
  } catch { /* ignore */ }
}

async function copyScreenshot(filePath: string) {
  try {
    const res = await window.electronAPI?.screenshot?.copy(filePath)
    if (res?.ok) {
      window.electronAPI?.notification?.send({ title: t('settings.copiedTitle'), body: t('settings.screenshotCopied'), type: 'success' })
    }
  } catch { /* ignore */ }
}

async function exportScreenshot(filePath: string) {
  try {
    await window.electronAPI?.screenshot?.export(filePath)
  } catch { /* ignore */ }
}

async function deleteScreenshotAction(s: { filePath: string; fileName: string }) {
  if (!await pxConfirm({ title: t('common.warning'), message: t('settings.deleteScreenshotConfirm', { name: s.fileName }), type: 'danger', confirmText: t('common.confirm') })) return
  try {
    await window.electronAPI?.screenshot?.delete(s.filePath)
    screenshots.value = screenshots.value.filter((x) => x.filePath !== s.filePath)
  } catch { /* ignore */ }
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  }
}

/** 混合两个颜色 */
function mixColor(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const b_ = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r},${g},${b_})`
}

function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')
}

/** 根据主色生成完整色阶 */
function generatePalette(rgb: { r: number; g: number; b: number }) {
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 0, g: 0, b: 0 }
  return {
    '--voxver-primary-light': `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 0.15)`,
    '--voxver-primary-hover': toHex(rgb.r * 0.9, rgb.g * 0.9, rgb.b * 0.9),
    '--voxver-primary-active': toHex(rgb.r * 0.8, rgb.g * 0.8, rgb.b * 0.8),
    '--voxver-primary-muted': toHex(rgb.r + (255 - rgb.r) * 0.5, rgb.g + (255 - rgb.g) * 0.5, rgb.b + (255 - rgb.b) * 0.5),
    '--voxver-primary-50': toHex(rgb.r + (255 - rgb.r) * 0.95, rgb.g + (255 - rgb.g) * 0.95, rgb.b + (255 - rgb.b) * 0.95),
    '--voxver-primary-100': toHex(rgb.r + (255 - rgb.r) * 0.9, rgb.g + (255 - rgb.g) * 0.9, rgb.b + (255 - rgb.b) * 0.9),
    '--voxver-primary-200': toHex(rgb.r + (255 - rgb.r) * 0.75, rgb.g + (255 - rgb.g) * 0.75, rgb.b + (255 - rgb.b) * 0.75),
    '--voxver-primary-300': toHex(rgb.r + (255 - rgb.r) * 0.6, rgb.g + (255 - rgb.g) * 0.6, rgb.b + (255 - rgb.b) * 0.6),
    '--voxver-primary-400': toHex(rgb.r + (255 - rgb.r) * 0.4, rgb.g + (255 - rgb.g) * 0.4, rgb.b + (255 - rgb.b) * 0.4),
    '--voxver-primary-500': toHex(rgb.r, rgb.g, rgb.b),
    '--voxver-primary-600': toHex(rgb.r * 0.85, rgb.g * 0.85, rgb.b * 0.85),
    '--voxver-primary-700': toHex(rgb.r * 0.7, rgb.g * 0.7, rgb.b * 0.7),
    '--voxver-primary-800': toHex(rgb.r * 0.55, rgb.g * 0.55, rgb.b * 0.55),
    '--voxver-primary-900': toHex(rgb.r * 0.4, rgb.g * 0.4, rgb.b * 0.4)
  }
}

// 辅助：hex 转 rgba — 不再使用，但保留以供外部调用

</script>

<style scoped lang="scss">
.settings-page.is-kor-page {
  padding-left: 244px;
}

.settings-kor-nav {
  position: relative;
  z-index: 6;
}

.settings-page {
  padding: 20px 28px;
  overflow-y: auto;
  height: 100%;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* ---- 区块 ---- */
.sec {
  margin-bottom: 28px;
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  padding: 16px;

  .sec-title {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 700;
    color: var(--voxver-text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1.5px solid var(--voxver-border-color-light);

    svg {
      color: var(--voxver-primary);
      flex-shrink: 0;
    }

    .sec-arrow {
      margin-left: auto;
      color: var(--voxver-text-muted);
      transition: transform 0.2s ease;
      &.open {
        transform: rotate(180deg);
      }
    }
  }

  .memory-alloc-card {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

/* ---- 表单行 ---- */
.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: var(--voxver-bg-hover);
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color-light);

  &:last-child {
    margin-bottom: 0;
  }

  .row-main {
    flex: 0 0 200px;
    min-width: 160px;
    padding-top: 1px;
  }

  .row-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    display: block;
  }

  .row-desc {
    margin: 3px 0 0;
    font-size: 10.5px;
    color: var(--voxver-text-muted);
    line-height: 1.45;
  }

  .row-control {
    flex: 1;
    min-width: 0;

    &.full {
      flex-basis: 100%;
    }
  }

  .row-hint {
    margin: 4px 0 0;
    font-size: 11px;
    color: var(--voxver-text-muted);
  }
}

/* ---- 分组卡片（下载设置等） ---- */
.select-fit {
  width: 96px;
  flex-shrink: 0;

  &.select-fit--wide {
    width: 128px;
  }
}

.settings-group-title {
  margin: 18px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
}

.settings-card {
  background: var(--voxver-card-bg);
  border: 1px solid var(--voxver-card-border);
  border-radius: var(--voxver-radius-md);

  .row {
    margin-bottom: 0;
    padding: 13px 16px;
    background: transparent;
    border: none;
    border-radius: 0;

    & + & {
      border-top: 1px solid var(--voxver-border-color-light);
    }

    &:first-child {
      border-top-left-radius: var(--voxver-radius-md);
      border-top-right-radius: var(--voxver-radius-md);
    }

    &:last-child {
      border-bottom-left-radius: var(--voxver-radius-md);
      border-bottom-right-radius: var(--voxver-radius-md);
    }
  }
}

/* ---- 输入控件 ---- */
.inp {
  padding: 8px 12px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  font-size: 13px;
  color: var(--voxver-text-primary);
  background: transparent;
  outline: none;
  color-scheme: dark light;
  transition: border-color 0.14s, background 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 3%, transparent);
  }

  &.short {
    flex: 0 0 80px;
    text-align: center;
  }
  &::placeholder {
    color: var(--voxver-text-muted);
  }
}

.sel {
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  font-size: 13px;
  color: var(--voxver-text-primary);
  color-scheme: dark light;
  background: transparent
    url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238b8fa3' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: border-color 0.14s, background 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 3%, transparent)
      url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236366F1' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")
      no-repeat right 10px center;
  }
}

.textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  font-size: 12.5px;
  font-family: 'Consolas', 'Courier New', monospace;
  color: var(--voxver-text-primary);
  background: transparent;
  outline: none;
  resize: vertical;
  min-height: 56px;
  transition: border-color 0.14s, background 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 3%, transparent);
  }
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  .inp,
  .sel {
    flex: 1;
    min-width: 120px;
  }
  &.compact {
    flex-wrap: nowrap;
  }
}

.btn-sm {
  padding: 8px 16px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: transparent;
  font-size: 12px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.13s;
  flex-shrink: 0;

  &:hover {
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
  }
}

.java-detection {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.java-list-title {
  font-size: 12px;
  color: var(--voxver-text-secondary);
  margin: 4px 0;
}

.java-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-sm);
  margin-bottom: 4px;
  border: 1px solid var(--voxver-border-color);
}

.java-info {
  font-size: 13px;
  color: var(--voxver-text-primary);
  font-weight: 400;
}

.java-path {
  font-size: 11px;
  color: var(--voxver-text-muted);
  word-break: break-all;
}

.java-detection {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.java-detect-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.java-detect-header button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.java-detect-header button svg {
  animation: spin 1s linear infinite;
}

/* Java 选择行 — 下拉框 + 检测按钮水平 */
.java-select-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.java-select-row .sel.java-preset-sel {
  flex: 1;
}
.java-select-row .btn-sm.java-detect-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Java 自定义路径行 — 输入框 + 浏览按钮水平 */
.java-path-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}
.java-path-row .inp.java-path-inp {
  flex: 1;
}
.java-path-row .btn-sm.java-browse-btn {
  flex-shrink: 0;
  white-space: nowrap;
}



// Progress styles
.java-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.progress-step {
  font-weight: 600;
  color: var(--voxver-primary);
}

.progress-text {
  color: var(--voxver-text-secondary);
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background: var(--voxver-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--voxver-primary), var(--voxver-primary));
  border-radius: 3px;
  transition: width 0.3s ease;
}

// Java list styles
.java-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.java-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.java-list-title {
  font-size: 12px;
  color: var(--voxver-text-secondary);
  margin: 0;
  font-weight: 400;
}

.java-list-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.java-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
  }
}

.java-item-default {
  border-color: var(--voxver-primary);
  background: color-mix(in oklab, var(--voxver-primary) 5%, transparent);
}

.java-item-main {
  display: flex;
  gap: 12px;
  flex: 1;
}

.java-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-md);
  color: var(--voxver-primary);
  flex-shrink: 0;
}

.java-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.java-name {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.java-vendor {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.java-version {
  font-size: 13px;
  color: var(--voxver-text-secondary);
}

.java-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--voxver-primary);
  color: white;
  border-radius: var(--voxver-radius-xs);
  font-weight: 400;
}

.java-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.java-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--voxver-text-muted);

  svg {
    flex-shrink: 0;
  }
}

.java-path {
  font-size: 11px;
  color: var(--voxver-text-muted);
  word-break: break-all;
  font-family: 'Consolas', 'Courier New', monospace;
}

.java-item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

// Java not found styles
.java-not-found {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: rgb(239 68 68 / 0.05);
  border: 1px dashed rgb(239 68 68 / 0.3);
  border-radius: var(--voxver-radius-md);
  text-align: center;
}

.java-not-found-icon {
  display: flex;
  justify-content: center;
  color: var(--voxver-error);
}

.java-not-found-text {
  h4 {
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--voxver-text-primary);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

.java-not-found-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.java-not-found-actions a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  font-size: 12px;
  color: var(--voxver-text-secondary);
  text-decoration: none;
  transition: all 0.13s;

  &:hover {
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
  }
}

.sep {
  font-size: 12px;
  color: var(--voxver-text-muted);
  user-select: none;
  flex-shrink: 0;
}

/* ---- 滑块 ---- */
.range {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--voxver-border-color);
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--voxver-primary);
    cursor: pointer;
    transition: transform 0.12s;
    &:hover {
      transform: scale(1.15);
    }
  }
}

.range-val {
  min-width: 72px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-primary);
  flex-shrink: 0;
}

/* ---- 内存进度条 ---- */
.memory-bar {
  height: 8px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-xs);
  margin-top: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--voxver-radius-xs);
  background: linear-gradient(90deg, var(--voxver-primary), var(--voxver-primary));
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 32px;

  .bar-text {
    font-size: 9px;
    font-weight: 700;
    color: #fff;
    padding-right: 6px;
    /* text-shadow removed per Apple spec */
  }
}

/* ---- 复选框 ---- */
.chk {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--voxver-text-primary);
  cursor: pointer;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--voxver-primary);
    cursor: pointer;
  }
}

/* ---- 主题模式切换 ---- */
.theme-mode-options {
  display: flex;
  gap: 8px;
}

.theme-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  color: var(--voxver-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--voxver-primary-400);
    color: var(--voxver-primary-600);
  }

  &.active {
    background: var(--voxver-primary-light);
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
  }
}

/* ---- 色板 ---- */
.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: all 0.14s;

  &:hover {
    transform: scale(1.12);
  }
  &.active {
    border-color: var(--voxver-text-primary);
    box-shadow:
      0 0 0 2px var(--voxver-bg-elevated),
      0 0 0 4px var(--voxver-text-primary);
  }
}

/* ---- 功能隐藏表格 ---- */
.sec-desc {
  font-size: 12px;
  color: var(--voxver-text-muted);
  margin: 0 0 12px;
  line-height: 1.6;
}

/* ---- 设置主页搜索框 ---- */
.search-box {
  position: relative;
  display: flex;
  align-items: center;

  .search-box-icon {
    position: absolute;
    left: 12px;
    color: var(--voxver-text-muted);
    pointer-events: none;
  }

  .search-box-input {
    width: 100%;
    padding: 9px 12px 9px 36px;
    border: 1px solid color-mix(in oklab, var(--voxver-text-primary) 12%, transparent);
    border-radius: var(--voxver-radius-md);
    background: color-mix(in oklab, var(--voxver-text-primary) 4%, transparent);
    color: var(--voxver-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;

    &::placeholder {
      color: var(--voxver-text-muted);
    }

    &:focus {
      border-color: var(--voxver-primary);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--voxver-primary) 20%, transparent);
    }
  }
}

/* ---- 快速浏览网格 ---- */
.quick-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-grid-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px 14px 12px;
  border: 1px solid color-mix(in oklab, var(--voxver-text-primary) 8%, transparent);
  border-radius: var(--voxver-radius-sm);
  background: color-mix(in oklab, var(--voxver-text-primary) 3%, transparent);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  text-align: left;
  font-family: inherit;
  color: var(--voxver-text-primary);

  &:hover {
    background: color-mix(in oklab, var(--voxver-text-primary) 6%, transparent);
    border-color: color-mix(in oklab, var(--voxver-text-primary) 16%, transparent);
  }

  &:active {
    transform: scale(0.98);
  }
}

.quick-grid-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-primary) 12%, transparent);
  color: var(--voxver-primary);
}

.quick-grid-label {
  flex: 1;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.3;
}

.quick-grid-desc {
  display: block;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--voxver-text-muted);
  line-height: 1.4;
  margin-top: 2px;
}

.quick-grid-arrow {
  flex-shrink: 0;
  color: var(--voxver-text-muted);
  opacity: 0.5;
  transition: opacity 0.12s;
}

.quick-grid-item:hover .quick-grid-arrow {
  opacity: 1;
}

/* ---- 常用设置列表 ---- */
.common-list {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .row {
    cursor: pointer;
    border-radius: var(--voxver-radius-md);
    transition: background 0.12s;

    &:hover {
      background: color-mix(in oklab, var(--voxver-text-primary) 4%, transparent);
    }

    &:active {
      background: color-mix(in oklab, var(--voxver-text-primary) 7%, transparent);
    }

    .row-control svg {
      transition: transform 0.12s;
    }

    &:hover .row-control svg {
      transform: translateX(2px);
    }
  }
}

/* 5列 grid：第1列行标签，后4列 checkbox 项 */
.feature-hide-table {
  display: grid;
  grid-template-columns: 90px repeat(4, 1fr);
  row-gap: 2px;
}

.fh-row-label {
  font-size: 13px;
  color: var(--voxver-text-primary);
  display: flex;
  align-items: center;
  padding: 5px 8px 5px 0;
  white-space: nowrap;
}

.fh-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover:not(.fh-pad):not(.disabled) {
    background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  }

  &.hidden .feat-name {
    color: var(--voxver-text-muted);
    text-decoration: line-through;
    opacity: 0.6;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.55;
    .feat-name {
      color: var(--voxver-text-muted);
    }
  }

  input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: var(--voxver-primary);
    cursor: pointer;
    flex-shrink: 0;
  }

  input[type='checkbox']:disabled {
    cursor: not-allowed;
  }

  .feat-name {
    font-size: 13px;
    color: var(--voxver-text-primary);
    transition:
      color 0.15s,
      opacity 0.15s;
  }
}

.fh-pad {
  cursor: default;
  pointer-events: none;
}

.warn-orange {
  background: rgb(245 158 11 / 0.1);
  border: 1px solid rgb(245 158 11 / 0.35);
  color: var(--voxver-warning);
  border-radius: var(--voxver-radius-sm);
  padding: 8px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  svg {
    flex-shrink: 0;
    color: var(--voxver-warning);
  }
}

/* ---- 功能网格（旧，保留兼容） ---- */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--voxver-radius-sm);
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--voxver-primary);
    cursor: pointer;
  }

  .feat-name {
    font-size: 13px;
    color: var(--voxver-text-primary);
  }
}

/* ---- 按钮行 ---- */
.btn-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  &.danger-zone {
    padding-top: 14px;
    border-top: 1px dashed var(--voxver-border-color);
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  font-size: 12.5px;
  font-weight: 400;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all 0.13s;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
  }

  &.primary {
    background: var(--voxver-gradient-primary);
    border-color: transparent;
    color: #fff;
    &:hover {
      background: var(--voxver-primary-600);
      border-color: transparent;
      color: #fff;
    }
  }

  &.outline:hover {
    background: color-mix(in oklab, var(--voxver-primary) 4%, transparent);
  }

  &.danger {
    border-color: color-mix(in oklab, var(--voxver-error) 40%, transparent);
    color: var(--voxver-error);
    &:hover {
      background: var(--voxver-error);
      border-color: var(--voxver-error);
      color: #fff;
    }
  }
}

.action-btn.small {
  padding: 4px 10px;
  font-size: 11.5px;
  border-radius: var(--voxver-radius-xs);
}

/* ---- 关于卡片 ---- */
.about-card {
  text-align: center;
  padding: 28px 24px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 75%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color-light);

  .about-logo {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
    height: 80px;
    overflow: hidden;

    img {
      height: 100%;
      width: auto;
      display: block;
      object-fit: contain;
    }
  }
  .is-tappable {
  cursor: default;
  user-select: none;
}

.about-ver {
    margin: 0 0 14px;
    font-size: 12px;
    color: var(--voxver-text-muted);
  }

  .perm-warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 14px;
    background: color-mix(in oklab, var(--voxver-warning) 12%, transparent);
    border: 1px solid color-mix(in oklab, var(--voxver-warning) 30%, transparent);
    border-radius: var(--voxver-radius-sm);
    font-size: 12px;
    color: var(--voxver-warning);
    line-height: 1.5;
    text-align: left;

    svg {
      flex-shrink: 0;
      margin-top: 1px;
    }
  }

  .perm-info-ok {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    margin-bottom: 14px;
    background: color-mix(in oklab, #10b981 10%, transparent);
    border: 1px solid color-mix(in oklab, #10b981 25%, transparent);
    border-radius: var(--voxver-radius-sm);
    font-size: 12px;
    color: #10b981;

    svg {
      flex-shrink: 0;
    }
  }
  .about-update-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid color-mix(in oklab, var(--voxver-text-primary) 8%, transparent);
  }

  .about-update-actions {
    display: inline-flex;
    gap: 6px;

    .action-btn {
      padding: 8px 18px;
      font-size: 13px;
      border-radius: var(--voxver-radius-sm);
    }
  }
}

.update-status-text {
  font-size: 12px;
  color: var(--voxver-text-secondary);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.update-available {
  color: var(--voxver-primary);
  font-weight: 500;
}

.update-error {
  color: var(--voxver-error);
}

/* 更新错误弹窗 */
.update-error-modal {
  max-width: 500px;
  word-break: break-all;
}

.update-err-msg {
  font-size: 12px;
  color: var(--voxver-text-secondary);
  background: color-mix(in oklab, var(--voxver-bg-secondary) 50%, transparent);
  padding: 12px;
  border-radius: var(--voxver-radius-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
}

/* 更新可用弹窗样式 */
.update-available-modal {
  max-width: 420px;
}

.update-version-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.update-version-label {
  font-size: 13px;
  color: var(--voxver-text-muted);
}

.update-version-num {
  font-size: 18px;
  font-weight: 600;
  color: var(--voxver-success);
}

.update-release-notes {
  margin-bottom: 16px;
}

.update-notes-md {
  font-size: 13px;
  color: var(--voxver-text-primary);
  background: color-mix(in oklab, var(--voxver-bg-secondary) 50%, transparent);
  padding: 14px 16px;
  border-radius: var(--voxver-radius-sm);
  line-height: 1.7;
  max-height: 300px;
  overflow-y: auto;
}

.update-notes-md h3,
.update-notes-md h4,
.update-notes-md h5 {
  margin: 0 0 8px 0;
  color: var(--voxver-text-primary);
  font-weight: 600;
}

.update-notes-md h3 { font-size: 15px; }
.update-notes-md h4 { font-size: 14px; }
.update-notes-md h5 { font-size: 13px; }

.update-notes-md p {
  margin: 0 0 8px 0;
}

.update-notes-md ul {
  margin: 0 0 8px 0;
  padding-left: 18px;
}

.update-notes-md li {
  margin-bottom: 2px;
}

.update-notes-md code {
  background: var(--voxver-bg-tertiary);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
}

.update-notes-md pre {
  background: var(--voxver-bg-tertiary);
  padding: 10px 12px;
  border-radius: var(--voxver-radius-sm);
  overflow-x: auto;
  margin: 0 0 8px 0;
}

.update-notes-md pre code {
  background: none;
  padding: 0;
  font-size: 12px;
}

.update-notes-md a {
  color: var(--voxver-accent-color, #14b8a6);
}

.update-notes-md strong {
  font-weight: 600;
}

.update-notes-md img {
  max-width: 100%;
  border-radius: var(--voxver-radius-sm);
}

.update-progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.update-progress-bar {
  flex: 1;
  height: 6px;
  background: var(--voxver-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.update-progress-fill {
  height: 100%;
  background: var(--voxver-accent-color, #14b8a6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.update-progress-text {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  min-width: 40px;
  text-align: right;
}

.update-downloaded-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--voxver-success);
  font-size: 14px;
  margin: 8px 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--voxver-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--voxver-z-toast);
}

.modal-box {
  background: var(--voxver-bg-primary);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  min-width: 360px;
  max-width: 90vw;
  box-shadow: 0 8px 32px var(--voxver-shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--voxver-border-color-light);

  h4 { margin: 0; font-size: 14px; color: var(--voxver-text-primary); }
}

.modal-close {
  background: none;
  border: none;
  color: var(--voxver-text-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { color: var(--voxver-text-primary); }
}

.modal-body { padding: 16px 18px; }

.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--voxver-border-color-light);
  display: flex;
  justify-content: flex-end;
}

/* ---- 邮箱弹窗 ---- */
.email-modal-desc {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin: 0 0 16px;
  line-height: 1.6;
}

.email-display {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--voxver-bg-secondary);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-sm);
  padding: 10px 14px;
}

.email-address {
  font-size: 14px;
  color: var(--voxver-text-primary);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  flex: 1;
  user-select: all;
}

.about-redirect-desc {
  font-size: 13px;
  color: var(--voxver-text-muted);
  line-height: 1.7;
  margin: 0;
}

/* ---- 鸣谢列表 ---- */
.credit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.credit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-text-primary) 3%, transparent);
  border: 1px solid var(--voxver-border-color-light);
}

.credit-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  background: color-mix(in oklab, var(--voxver-primary) 14%, transparent);
  color: var(--voxver-primary);
  flex-shrink: 0;
}

.credit-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.credit-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.credit-role {
  font-size: 11.5px;
  color: var(--voxver-text-muted);
}

/* ---- 相关链接 ---- */
.link-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-text-primary) 3%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  color: var(--voxver-text-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 400;
  transition: background 0.12s;
  cursor: pointer;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  }

  svg {
    flex-shrink: 0;
    color: var(--voxver-text-muted);
  }
}

.link-text {
  flex: 1;
}

.link-arrow {
  color: var(--voxver-text-muted);
  opacity: 0.4;
  transition: opacity 0.12s;
}

.link-item:hover .link-arrow {
  opacity: 0.8;
}

/* ---- 版权声明卡片 ---- */
.copyright-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 24px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color-light);

  .copyright-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
    color: var(--voxver-primary);
    opacity: 0.7;
  }

  .copyright-text {
    font-size: 12.5px;
    line-height: 1.8;
    color: var(--voxver-text-secondary);
    margin: 0 0 8px;
    max-width: 520px;

    &:last-of-type {
      margin-bottom: 0;
    }
  }
}

.copyright-card--row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .copyright-text {
    flex: 1;
    margin: 0;
    max-width: 600px;
  }

  .action-btn {
    flex-shrink: 0;
    white-space: nowrap;
    margin-left: auto;
  }
}

/* ---- 项目协议卡片 ---- */
.license-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color-light);

  .license-badge {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    background: color-mix(in oklab, var(--voxver-primary) 14%, transparent);
    color: var(--voxver-primary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .license-info {
    flex: 1;
    min-width: 0;
  }

  .license-action {
    flex-shrink: 0;
    align-self: center;
    margin-left: 16px;
  }

  .license-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    margin: 0 0 6px;
  }

  .license-desc {
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--voxver-text-secondary);
    margin: 0;
  }
}

/* ---- 开源依赖网格 ---- */
.oss-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.oss-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  transition: background 0.1s;

  &:hover {
    background: color-mix(in oklab, var(--voxver-text-primary) 3%, transparent);
  }

  .oss-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .oss-name {
    font-size: 13px;
    color: var(--voxver-text-primary);
    font-weight: 400;
  }

  .oss-version {
    font-size: 11px;
    color: var(--voxver-text-muted);
    background: color-mix(in oklab, var(--voxver-text-primary) 6%, transparent);
    padding: 1px 8px;
    border-radius: var(--voxver-radius-xs);
  }

  .oss-license {
    font-size: 11.5px;
    color: var(--voxver-text-muted);
    padding: 2px 10px;
    border-radius: var(--voxver-radius-xs);
    border: 1px solid color-mix(in oklab, var(--voxver-text-primary) 8%, transparent);
  }
}

.link-item {
  font-size: 12.5px;
  color: var(--voxver-primary);
  text-decoration: none;
  margin-right: 18px;
  transition: opacity 0.12s;
  &:hover {
    text-decoration: underline;
    opacity: 0.75;
  }
}

/* ---- 未开放居中占位 ---- */
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 300px;
  padding: 48px 24px;
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
}

.coming-soon-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
  color: var(--voxver-primary);
  margin-bottom: 20px;
  opacity: 0.6;
}

.coming-soon-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  margin: 0 0 8px;
}

.coming-soon-desc {
  font-size: 13px;
  color: var(--voxver-text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
}

.coming-soon-badge {
  display: inline-block;
  padding: 6px 20px;
  border-radius: var(--voxver-radius-md);
  font-size: 13px;
  font-weight: 400;
  color: var(--voxver-text-muted);
  border: 1px solid color-mix(in oklab, var(--voxver-text-primary) 12%, transparent);
  background: color-mix(in oklab, var(--voxver-text-primary) 4%, transparent);
}

/* ---- 离线皮肤警告条 ---- */
.skin-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  background: rgb(251 140 0 / 0.1);
  border: 1px solid rgb(251 140 0 / 0.3);
  border-radius: var(--voxver-radius-sm);
  font-size: 12px;
  color: var(--voxver-warning);
  margin-bottom: 12px;

  svg {
    flex-shrink: 0;
    color: var(--voxver-warning);
  }
}

/* ---- 离线皮肤单选组 ---- */
.game-param-group .row-label {
  display: block;
}
.game-param-group .row-desc {
  display: block;
}
.debug-card {
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  padding: 12px 16px;
}
.debug-mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  padding: 12px 16px;
}

/* ---- 开发者选项：快捷目录卡片 ---- */
.dev-dir-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.dev-dir-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
  font-family: inherit;

  &:hover {
    border-color: var(--voxver-primary-400);
    background: color-mix(in oklab, var(--voxver-bg-elevated) 85%, transparent);
  }
}
.dev-dir-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-primary-500) 15%, transparent);
  color: var(--voxver-primary-500);
  flex-shrink: 0;
}
.dev-dir-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.dev-dir-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}
.dev-dir-desc {
  font-size: 11px;
  color: var(--voxver-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 开发者选项：环境信息 ---- */
.env-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.env-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border: 1px solid var(--voxver-border-color-light);
}
.env-info-label {
  font-size: 11px;
  color: var(--voxver-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.env-info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  font-family: var(--voxver-font-mono);
}
.debug-mode-info {
  flex: 1;
  min-width: 0;
}
.debug-mode-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text);
}
.debug-mode-desc {
  font-size: 11px;
  color: var(--voxver-text-muted);
  margin: 2px 0 0;
  line-height: 1.4;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--voxver-border-color);
  border-radius: 11px;
  transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 2px;
  bottom: 2px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toggle-switch input:checked + .toggle-slider {
  background: var(--voxver-primary);
}
.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
}
.skin-radio-group {
  display: flex;
  gap: 0;
  flex-wrap: wrap;
  margin-bottom: 0;
}

/* ---- 内存分配选择组（Koring 风格） ---- */
.memory-alloc-card {
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  padding: 12px 16px;
}
.java-alloc-card {
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  padding: 16px;
}

/* ---- 主题预览缩略图（Koring 风格） ---- */
.theme-preview-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.theme-preview-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  border-radius: var(--voxver-radius-md);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.theme-preview-card:hover {
  border-color: color-mix(in oklab, var(--voxver-text) 15%, transparent);
}
.theme-preview-card.active {
  border-color: var(--voxver-primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--voxver-primary) 20%, transparent);
}
.theme-preview-window {
  width: 140px;
  height: 96px;
  border-radius: var(--voxver-radius-xs);
  overflow: hidden;
  display: flex;
}
.theme-preview-window .tpw-half {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tpw-light {
  background: #ffffff;
}
.tpw-dark {
  background: #1c1c1e;
}
.tpw-titlebar {
  height: 8px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 2px;
  flex-shrink: 0;
}
.tpw-light .tpw-titlebar { background: #e5e5e7; }
.tpw-dark .tpw-titlebar { background: #2c2c2e; }
.tpw-titlebar span {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  display: inline-block;
}
.tpw-light .tpw-titlebar span:nth-child(1) { background: #ff6058; }
.tpw-light .tpw-titlebar span:nth-child(2) { background: #ffbd2e; }
.tpw-light .tpw-titlebar span:nth-child(3) { background: #28ca42; }
.tpw-dark .tpw-titlebar span:nth-child(1) { background: #ff5f57; }
.tpw-dark .tpw-titlebar span:nth-child(2) { background: #febc2e; }
.tpw-dark .tpw-titlebar span:nth-child(3) { background: #28c840; }
.tpw-content {
  flex: 1;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tpw-bar {
  height: 4px;
  border-radius: 2px;
}
.tpw-light .tpw-bar { background: #e5e5e7; }
.tpw-dark .tpw-bar { background: #3a3a3c; }
.tpw-bar.w-full { width: 100%; }
.tpw-bar.w-3-4 { width: 75%; }
.tpw-bar.w-1-2 { width: 50%; }
.theme-preview-label {
  font-size: 11px;
  color: var(--voxver-text-muted);
  margin-top: 6px;
  text-align: center;
}
.theme-preview-card.active .theme-preview-label {
  color: var(--voxver-primary);
  font-weight: 400;
}

/* ---- 背景卡片列表（Koring 风格） ---- */
.bg-card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bg-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: color-mix(in oklab, var(--voxver-text) 3%, transparent);
  border-radius: var(--voxver-radius-sm);
}
.bg-card-main {
  flex: 1;
  min-width: 0;
}
.bg-card-main .row-label {
  font-size: 13px;
  font-weight: 400;
  color: var(--voxver-text);
}
.bg-card-main .row-desc {
  font-size: 12px;
  color: var(--voxver-text-muted);
  margin-top: 2px;
}
.bg-card-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.bg-preview-wrap {
  border-radius: var(--voxver-radius-sm);
  overflow: hidden;
  border: 1px solid var(--voxver-border);
  margin-bottom: 2px;
}
.bg-preview-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

/* ---- 破坏性按钮 ---- */
.btn-destructive {
  background: color-mix(in oklab, var(--voxver-error) 15%, transparent);
  color: var(--voxver-error);
  border: 1px solid color-mix(in oklab, var(--voxver-error) 30%, transparent);
}
.btn-destructive:hover {
  background: color-mix(in oklab, var(--voxver-error) 25%, transparent);
}

/* ---- FAQ ---- */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.faq-item {
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  padding: 10px 14px;
  border: 1px solid var(--voxver-border-color-light);
}
.faq-question {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text);
  margin-bottom: 4px;
}
.faq-answer {
  font-size: 12px;
  line-height: 1.5;
  color: var(--voxver-text-muted);
}

/* ---- 反馈卡片 ---- */
.feedback-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.feedback-card {
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.feedback-card-icon svg {
  display: block;
}
.feedback-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text);
}
.feedback-card-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--voxver-text-muted);
  margin: 0;
}
.feedback-card .action-btn {
  align-self: flex-start;
  margin-top: auto;
}

.mem-options {
  display: flex;
  gap: 20px;
}
.radio-item-k {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  cursor: pointer;
  color: var(--voxver-text-secondary);
}
.radio-item-k input {
  accent-color: var(--voxver-primary);
}
.radio-item-k.active {
  color: var(--voxver-primary);
  font-weight: 600;
}
.mem-custom-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in oklab, var(--voxver-text) 10%, transparent);
}
.mem-custom-label {
  font-size: 13px;
  color: var(--voxver-text-secondary);
}
.mem-slider-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mem-slider {
  flex: 1;
  height: 4px;
  accent-color: var(--voxver-primary);
  cursor: pointer;
}
.mem-slider-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text);
  min-width: 52px;
  text-align: right;
  white-space: nowrap;
}
.mem-slider-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--voxver-text-muted);
}

/* ---- 语言卡片 ---- */
.lang-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  min-width: 200px;
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: var(--voxver-primary-400);
    background: color-mix(in oklab, var(--voxver-bg-elevated) 85%, transparent);
  }

  &.active {
    border-color: var(--voxver-primary-500);
    background: color-mix(in oklab, var(--voxver-primary-500) 12%, transparent);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--voxver-primary-500) 20%, transparent);
  }
}
.lang-flag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--voxver-radius-md);
  background: var(--voxver-gradient-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}
.lang-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.lang-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}
.lang-desc {
  font-size: 12px;
  color: var(--voxver-text-secondary);
}
.lang-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--voxver-primary-500);
  color: #fff;
  flex-shrink: 0;
}

.skin-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 20px;
  font-size: 13px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  user-select: none;
  transition: color 0.12s;

  &.active {
    color: var(--voxver-text-primary);
    font-weight: 400;
  }
  &:hover:not(.active) {
    color: var(--voxver-text-primary);
  }
}

.skin-radio-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--voxver-border-color);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.13s;

  &.checked {
    border-color: var(--voxver-primary);
    &::after {
      content: '';
      position: absolute;
      inset: 2.5px;
      border-radius: 50%;
      background: var(--voxver-primary);
    }
  }
}

/* ---- 正版皮肤展开区 ---- */
.skin-expand {
  padding: 12px 0 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skin-expand-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skin-expand-label {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  white-space: nowrap;
  min-width: 64px;
}

.skin-expand-inp {
  flex: 1;
}

.skin-expand-actions {
  display: flex;
  gap: 8px;
}

.btn-outline {
  padding: 6px 20px;
  font-size: 13px;
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  color: var(--voxver-text-primary);
  cursor: pointer;
  transition:
    border-color 0.13s,
    background 0.13s;

  &:hover {
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
    background: rgb(21 101 192 / 0.05);
  }
}

/* ---- 高级选项 checkbox 组 ---- */
.adv-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

/* ---- 进度条（整合包/备份）---- */
.progress-box {
  margin-top: 12px;
  padding: 12px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color-light);
}

.progress-label {
  font-size: 12.5px;
  color: var(--voxver-text-secondary);
  margin-bottom: 8px;
}

.progress-bar-wrap {
  width: 100%;
  height: 8px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-xs);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--voxver-primary);
  transition: width 0.2s ease;
  border-radius: var(--voxver-radius-xs);
}

.progress-sub {
  font-size: 11.5px;
  color: var(--voxver-text-muted);
  margin-top: 6px;
  word-break: break-all;
}

/* ---- section 子标题 ---- */
.sec-subtitle {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  margin: 4px 0 10px;
  padding: 0;
}

/* ---- 小按钮 danger ---- */
.btn-sm.danger-btn {
  color: var(--voxver-error);
  border-color: rgb(229 57 53 / 0.3);
  &:hover {
    background: var(--voxver-error);
    border-color: var(--voxver-error);
    color: #fff;
  }
}

/* ---- 备份文件列表 ---- */
.backup-list {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--voxver-border-color);
}

.backup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-sm);
  margin-bottom: 6px;
  border: 1px solid var(--voxver-border-color-light);
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-size: 13px;
  font-weight: 400;
  color: var(--voxver-text-primary);
}

.backup-meta {
  font-size: 11.5px;
  color: var(--voxver-text-muted);
  margin-top: 3px;
  display: flex;
  gap: 14px;
}

/* ---- 更新检查状态 ---- */
.update-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);

  &.checking {
    border-color: var(--voxver-primary);
    background: rgb(21 101 192 / 0.05);
  }

  &.available {
    border-color: var(--voxver-green);
    background: rgb(46 125 50 / 0.05);
  }

  &.error {
    border-color: var(--voxver-error);
    background: rgb(229 57 53 / 0.05);
  }

  &.up-to-date {
    border-color: var(--voxver-border-color-light);
  }
}

.update-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.update-text {
  flex: 1;
  font-size: 13px;
  color: var(--voxver-text-primary);

  .update-notes {
    font-size: 11.5px;
    color: var(--voxver-text-muted);
    margin-top: 4px;
    line-height: 1.5;
    max-width: 400px;
    word-break: break-all;
  }
}

.update-actions {
  flex-shrink: 0;
}

.download-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.progress-text {
  font-size: 12px;
  color: var(--voxver-text-secondary);
}

.progress-bar-wrap.small {
  height: 6px;
}

/* ===== 游戏截图 ===== */
.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.screenshot-card {
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--voxver-primary);
    transform: translateY(-1px);
  }
}

.screenshot-thumb {
  width: 100%;
  height: 130px;
  object-fit: cover;
  display: block;
}

.screenshot-thumb-placeholder {
  width: 100%;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 60%, transparent);
  color: var(--voxver-text-muted);
}

.screenshot-info {
  padding: 8px 10px 4px;
}

.screenshot-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--voxver-text-primary);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.screenshot-date {
  font-size: 10px;
  color: var(--voxver-text-muted);
}

.screenshot-actions {
  display: flex;
  gap: 4px;
  padding: 4px 8px 10px;
}

/* ===== 数据迁移 ===== */
.data-migration-results {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.migration-card {
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  overflow: hidden;
}

.migration-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-bottom: 1px solid var(--voxver-border-color-light);
}

.migration-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.migration-card-path {
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-family: monospace;
}

.migration-card-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--voxver-text-secondary);
}

.migration-instances {
  padding: 8px 12px;
}

.migration-instance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--voxver-radius-sm);

  & + & {
    border-top: 1px solid color-mix(in oklab, var(--voxver-border-color) 40%, transparent);
  }
}

.migration-instance-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.migration-instance-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--voxver-text-primary);
}

.migration-instance-meta {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.migration-empty {
  margin-top: 16px;
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--voxver-text-muted);
  background: color-mix(in oklab, var(--voxver-bg-primary) 40%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px dashed var(--voxver-border-color);
}

/* ===== 主题预设画廊 ===== */
.preset-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 8%, color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent));
  }

  &.active {
    border-color: var(--voxver-primary);
    background: color-mix(in oklab, var(--voxver-primary) 14%, color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent));
  }
}

.preset-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px solid color-mix(in oklab, var(--voxver-border-color) 50%, transparent);
}

.preset-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--voxver-text-primary);
  white-space: nowrap;
}

/* ===== 自定义主题色增强 ===== */
/* * 取色器与主色预览：左右排版 */
.theme-custom-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.theme-custom-row > .input-group {
  order: 2;
}
.theme-custom-row .theme-preview-bar {
  flex: 1;
  min-width: 220px;
  margin-top: 0;
}
.preset-swatch--custom {
  border: 1px dashed var(--voxver-border-color-strong);
}
.theme-custom-card {
  padding: 12px;
  background: var(--voxver-bg-tertiary);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
}

.color-swatch {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: var(--voxver-radius-xs);
  border: 1.5px solid var(--voxver-border-color);
  overflow: hidden;
  flex-shrink: 0;
}

.color-picker-input {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  border: none;
  cursor: pointer;
  opacity: 0;
}

.quick-color-palette {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.quick-swatch {
  width: 22px;
  height: 22px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition:
    transform var(--voxver-transition-fast),
    border-color var(--voxver-transition-fast);

  &:hover {
    transform: scale(1.2);
  }

  &.active {
    border-color: var(--voxver-text-primary);
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--voxver-primary) 30%, transparent);
  }
}

.theme-preview-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 10px;
  background: var(--voxver-bg-secondary);
  border-radius: var(--voxver-radius-sm);
}

.preview-chip {
  width: 20px;
  height: 20px;
  border-radius: var(--voxver-radius-xs);
  flex-shrink: 0;
}

.preview-label {
  margin-left: 8px;
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-family: var(--voxver-font-mono);
}

/* ===== 更新通道分段选择 ===== */
.segmented-group {
  display: inline-flex;
  background: var(--voxver-bg-raised);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-sm);
  padding: 3px;
  gap: 2px;
}

.vox-chip {
  padding: 6px 18px;
  border: none;
  border-radius: calc(var(--voxver-radius-sm) - 1px);
  background: transparent;
  color: var(--voxver-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--voxver-text-primary);
    background: color-mix(in oklab, var(--voxver-accent-color) 10%, transparent);
  }

  &.vox-chip--active {
    color: var(--voxver-text-primary);
    background: color-mix(in oklab, var(--voxver-accent-color) 18%, transparent);
    &:hover { background: color-mix(in oklab, var(--voxver-accent-color) 22%, transparent); }
  }

  /* 稳定版 → 绿色遮罩 */
  &.vox-chip--stable.vox-chip--active {
    background: color-mix(in oklab, var(--voxver-success) 18%, transparent);
    &:hover { background: color-mix(in oklab, var(--voxver-success) 24%, transparent); }
  }

  /* 测试版 → 黄色遮罩 */
  &.vox-chip--beta.vox-chip--active {
    background: color-mix(in oklab, var(--voxver-warning) 18%, transparent);
    &:hover { background: color-mix(in oklab, var(--voxver-warning) 24%, transparent); }
  }

  /* 开启 → 绿色遮罩 */
  &.vox-chip--on.vox-chip--active {
    background: color-mix(in oklab, var(--voxver-success) 18%, transparent);
    &:hover { background: color-mix(in oklab, var(--voxver-success) 24%, transparent); }
  }

  /* 关闭 → 红色遮罩 */
  &.vox-chip--off.vox-chip--active {
    background: color-mix(in oklab, var(--voxver-error) 18%, transparent);
    &:hover { background: color-mix(in oklab, var(--voxver-error) 24%, transparent); }
  }
}

/* ===== 自动检查更新按钮行 ===== */
.update-toggle-row {
  margin-top: 12px;
}

/* ===== 设置行布局 ===== */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.setting-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--voxver-text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.status-dot--stable { background: var(--voxver-success); }
  &.status-dot--beta   { background: var(--voxver-warning); }
  &.status-dot--on     { background: var(--voxver-success); }
  &.status-dot--off    { background: var(--voxver-text-muted); }
}

/* toggle chip 继承 vox-chip 样式 */
.vox-chip--toggle {
  padding: 6px 20px;
}

/* ========== 文件夹列表样式 ========== */
.folder-list-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.folder-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .action-list {
    display: flex;
    flex-direction: row;
    gap: 4px;
  }

  .action-item {
    padding: 6px 10px;
  }
}

.folder-content {
  background: var(--voxver-bg-hover);
  border-radius: var(--voxver-radius-md);
  padding: 8px;
}

.current-folder {
  padding: 10px 12px;
  background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  border-radius: var(--voxver-radius-md);
  border-left: 3px solid var(--voxver-primary);
  margin-bottom: 6px;
  position: relative;

  .cf-remove {
    position: absolute;
    right: 8px;
    top: 10px;
    font-size: 10px;
    color: var(--voxver-text-muted);
    opacity: 0;
    transition: opacity 0.12s;
    padding: 2px 4px;
    border-radius: 3px;

    &:hover {
      color: var(--voxver-error);
      background: rgb(239 68 68 / 0.08);
    }
  }

  &:hover .cf-remove {
    opacity: 1;
  }

  .cf-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--voxver-primary-muted);
    margin-bottom: 4px;
  }

  .cf-top {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 2px;
  }

  .cf-name {
    font-size: 12px;
    color: var(--voxver-text-primary);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cf-path {
    font-size: 10px;
    color: var(--voxver-text-muted);
    word-break: break-all;
    line-height: 1.4;
    font-family: var(--voxver-font-mono);
    padding-left: 18px;
  }
}

.sidebar-divider {
  height: 1px;
  background: var(--voxver-border-color);
  margin: 10px 0;
}

.folder-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 7px 28px 7px 10px;
  border-radius: var(--voxver-radius-sm);
  cursor: pointer;
  transition: background 0.12s;
  gap: 2px;
  position: relative;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  }

  .fi-top {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .fi-name {
    font-size: 12px;
    color: var(--voxver-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fi-path {
    font-size: 10px;
    color: var(--voxver-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 17px;
  }

  .folder-remove {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: var(--voxver-text-muted);
    opacity: 0;
    transition: opacity 0.12s;
    padding: 2px 4px;
    border-radius: 3px;

    &:hover {
      color: var(--voxver-error);
      background: rgb(239 68 68 / 0.08);
    }
  }

  &:hover .folder-remove {
    opacity: 1;
  }
}

.sidebar-subtitle {
  margin: 4px 0 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--voxver-text-muted);
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: var(--voxver-radius-md);
  font-size: 12px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all 0.13s;
  text-align: left;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
    color: var(--voxver-primary-muted);

    .action-icon.add {
      color: var(--voxver-success);
    }

    .action-icon.import {
      color: var(--voxver-primary-muted);
    }
  }
}

.action-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;

  &.add { color: var(--voxver-text-muted); }
  &.import { color: var(--voxver-text-muted); }
}

/* ===== 服务联通性测试 ===== */
.service-test-page {
  position: absolute;
  inset: 0;
  z-index: var(--voxver-z-overlay);
  display: flex;
  flex-direction: column;
  padding: 18px 28px 24px;
  background: var(--voxver-bg-primary);
  overflow-y: auto;
}

.service-test-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.service-test-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--voxver-radius-sm);
  border: 1px solid var(--voxver-border-color-light);
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  color: var(--voxver-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--voxver-text-primary);
    background: var(--voxver-bg-hover);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.row-control--right-center {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  align-self: center;
}

.service-goto-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-sm);
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  color: var(--voxver-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    color: var(--voxver-text-primary);
    background: var(--voxver-bg-hover);
  }
}

.service-test-btn {
  padding: 8px 18px;
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  background: var(--voxver-primary, #4a7cf3);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.service-test-title {
  flex: 1;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--voxver-text-primary);
}

.service-test-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
}

.service-test-hint {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--voxver-text-muted);

  &.is-error {
    color: var(--voxver-text-error);
    word-break: break-all;
  }
}

.service-test-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 10px 0 16px;
  padding: 14px 18px;
  border: 1px solid color-mix(in oklab, var(--voxver-primary, #4a7cf3) 45%, transparent);
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-primary, #4a7cf3) 12%, transparent);
  color: var(--voxver-primary, #4a7cf3);
  font-size: 13.5px;
  font-weight: 600;

  svg {
    flex-shrink: 0;
    opacity: 0.85;
  }
}

.service-group {
  margin-bottom: 12px;
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-md);
  overflow: hidden;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;

  & + & {
    border-top: 1px solid var(--voxver-border-color-light);
  }
}

.service-item-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.service-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
}

.service-item-url {
  font-size: 11.5px;
  color: var(--voxver-text-muted);
  word-break: break-all;
}

.service-item-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;

  &.is-online {
    color: var(--voxver-text-warning);
    background: var(--voxver-warning-bg);
  }

  &.is-offline {
    color: var(--voxver-text-error);
    background: var(--voxver-error-bg);
  }

  &.is-pending {
    color: var(--voxver-text-muted);
    background: color-mix(in oklab, var(--voxver-text) 8%, transparent);
  }
}
</style>
