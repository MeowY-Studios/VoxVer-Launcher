<template>
  <div class="settings-page">
    <!-- ========== 主页 ========== -->
    <template v-if="activeCategory === 'home'">
      <!-- 查找设置 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          查找设置
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
            placeholder="搜索设置名称..."
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
          快速浏览
        </h3>
        <div class="quick-grid">
          <button class="quick-grid-item" @click="switchCategory('account')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <span class="quick-grid-label">VoxVer 账户</span>
            <span class="quick-grid-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </button>
          <button class="quick-grid-item" @click="switchCategory('launch')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span class="quick-grid-label">启动设置</span>
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
            <span class="quick-grid-label">主题与个性化</span>
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
            <span class="quick-grid-label">下载与网络</span>
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
          常用设置
        </h3>
        <div class="quick-grid">
          <button class="quick-grid-item" @click="switchCategory('launch')">
            <div class="quick-grid-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span class="quick-grid-label">
              Java 虚拟机与内存
              <small class="quick-grid-desc">配置 Java 路径、分配内存大小</small>
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
              语言切换
              <small class="quick-grid-desc">更改启动器界面语言</small>
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
              主题与背景
              <small class="quick-grid-desc">切换主题配色、设置背景图片</small>
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
              关于与更新
              <small class="quick-grid-desc">查看版本信息、检查更新</small>
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
      <div class="coming-soon">
        <div class="coming-soon-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 class="coming-soon-title">VoxVer 账户</h3>
        <p class="coming-soon-desc">管理你的 VoxVer 启动器账户与登录信息</p>
        <span class="coming-soon-badge">{{ $t('more.notAvailable') }}</span>
      </div>
    </template>

    <!-- ========== 关于 ========== -->
    <template v-if="activeCategory === 'about'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          关于
        </h3>
        <p class="sec-desc" style="margin-bottom:0">{{ $t('more.aboutSubtitle') }}</p>
      </section>

      <div style="height:4px"></div>
      <section class="sec">
        <div class="about-card">
          <div class="about-logo">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h4 class="about-name">{{ $t('more.appName') }}</h4>
          <p class="about-ver">{{ $t('more.currentVersion') }}{{ appVersion }}</p>
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
              <a class="action-btn small ghost" href="https://github.com/nnkmn/voxver-launcher/releases" target="_blank">
                {{ $t('more.viewSource') }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 项目信息 -->
      <section class="sec">
        <h3 class="sec-title">项目信息</h3>
        <p class="sec-desc">VoxVer Launcher 是一个开源的非官方 Minecraft 启动器，仅供学习与交流使用。</p>
        <div class="credit-list">
          <div class="credit-item">
            <div class="credit-avatar">V</div>
            <div class="credit-info">
              <span class="credit-name">VoxVer Launcher Team</span>
              <span class="credit-role">开发与维护（Meow Studio）</span>
            </div>
          </div>
          <div class="credit-item">
            <div class="credit-avatar" style="background:color-mix(in oklab,#e74c3c 14%,transparent);color:#e74c3c">G</div>
            <div class="credit-info">
              <span class="credit-name">GNU General Public License 3.0</span>
              <span class="credit-role">项目开源协议</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 相关链接 -->
      <section class="sec">
        <h3 class="sec-title">相关链接</h3>
        <p class="sec-desc">了解关于 VoxVer Launcher 的更多信息。</p>
        <div class="link-grid">
          <a class="link-item" href="https://github.com/nnkmn/voxver-launcher" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
            </svg>
            <span class="link-text">GitHub</span>
            <span class="link-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
            </span>
          </a>
          <a class="link-item" href="https://github.com/nnkmn/voxver-launcher/releases" target="_blank">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span class="link-text">发布与更新</span>
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
            <span class="link-text">GPLv3 许可证</span>
            <span class="link-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
            </span>
          </a>
        </div>
      </section>
    </template>

    <!-- ========== 版权声明 ========== -->
    <template v-if="activeCategory === 'copyright'">
      <!-- 版权声明 -->
      <section class="sec">
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
      <section class="sec">
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
            <div class="btn-row" style="margin-top: 12px">
              <a class="action-btn outline" href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                {{ $t('more.viewGplv3') }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 开源依赖 -->
      <section class="sec">
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
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
          {{ $t('more.fontLicense') }}
        </h3>
        <div class="copyright-card" style="text-align: left; padding: 20px 24px">
          <p class="copyright-text" style="text-align: left">{{ $t('more.fontLicenseText') }}</p>
          <div class="btn-row" style="margin-top: 12px">
            <a class="action-btn outline" href="https://scripts.sil.org/OFL" target="_blank">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              SIL Open Font License 1.1
            </a>
          </div>
        </div>
      </section>

      <!-- VoxVer 归属 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          {{ $t('more.voxverAttribution') }}
        </h3>
        <div class="copyright-card" style="text-align: left; padding: 20px 24px">
          <p class="copyright-text" style="text-align: left">{{ $t('more.attributionText') }}</p>
        </div>
      </section>
    </template>

    <!-- ========== 游戏档案 ========== -->
    <template v-if="activeCategory === 'profile'">
      <div class="account-settings-wrapper">
        <AccountPage />
      </div>
    </template>

    <!-- ========== 启动选项 ========== -->
    <!-- ========== Java虚拟机与内存 ========== -->
    <template v-if="activeCategory === 'java-memory'">
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
              <select class="sel java-preset-sel" v-model="selectedJavaPreset">
                <option value="auto">{{ $t('settings.autoSelect') }}</option>
                <option value="java8">Java 8</option>
                <option value="java17">Java 17</option>
                <option value="java21">Java 21</option>
                <option v-if="detectedJava.length > 0" disabled>──────────────</option>
                <option v-for="java in detectedJava" :key="java.id" :value="`detected:${java.id}`">
                  {{ java.vendor }} {{ java.version }} ({{ java.arch }}位)
                </option>
                <option v-if="detectedJava.length > 0" disabled>──────────────</option>
                <option value="custom">{{ $t('settings.customPath') }}</option>
              </select>
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
          内存分配
        </h3>
        <div class="sec-body">
            <div class="memory-alloc-card">
              <div class="mem-options">
                <label class="radio-item-k" :class="{ active: s.memoryMode === 'auto' }">
                  <input type="radio" name="memoryMode" value="auto" v-model="s.memoryMode" />
                  自动配置
                </label>
                <label class="radio-item-k" :class="{ active: s.memoryMode === 'custom' }">
                  <input type="radio" name="memoryMode" value="custom" v-model="s.memoryMode" />
                  自定义
                </label>
              </div>
              <div v-if="s.memoryMode === 'custom'" class="mem-custom-row">
                  <label class="mem-custom-label">分配内存</label>
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
          JVM 额外启动参数
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
    </template>

    <!-- ========== 游戏目录 ========== -->
    <template v-if="activeCategory === 'game-dir'">
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
              <select class="sel" v-model="s.versionIsolation">
                <option value="none">{{ $t('settings.noIsolation') }}</option>
                <option value="version">{{ $t('settings.byVersion') }}</option>
                <option value="versionAndGroup">{{ $t('settings.byVersionAndGroup') }}</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- ========== 高级设置 ========== -->
    <template v-if="activeCategory === 'advanced'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          高级设置
        </h3>
      </section>
      <div style="height:4px"></div>
      <p class="sec-desc" style="margin:0 0 12px">游戏高级启动参数、调试选项与实验性功能</p>
      <!-- 启动行为 -->
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          启动行为
        </h3>
        <div class="sec-body">
          <div class="memory-alloc-card" style="margin-bottom:12px">
            <label class="row-label" style="margin-bottom:8px">{{ $t('settings.whenLaunching') }}</label>
            <div class="mem-options" style="flex-direction:column;gap:6px">
              <label class="radio-item-k" :class="{ active: s.launchVisibility === 'hide' }">
                <input type="radio" name="launchVisibility" value="hide" v-model="s.launchVisibility" />
                {{ $t('settings.hideLauncher') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.launchVisibility === 'minimize' }">
                <input type="radio" name="launchVisibility" value="minimize" v-model="s.launchVisibility" />
                {{ $t('settings.minimizeLauncher') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.launchVisibility === 'keep' }">
                <input type="radio" name="launchVisibility" value="keep" v-model="s.launchVisibility" />
                {{ $t('settings.keepLauncher') }}
              </label>
            </div>
          </div>
          <div class="memory-alloc-card">
            <label class="row-label" style="margin-bottom:8px">{{ $t('settings.processPriority') }}</label>
            <p class="row-desc" style="margin-bottom:8px">{{ $t('settings.processPriorityDesc') }}</p>
            <div class="mem-options" style="flex-direction:column;gap:6px">
              <label class="radio-item-k" :class="{ active: s.processPriority === 'low' }">
                <input type="radio" name="processPriority" value="low" v-model="s.processPriority" />
                {{ $t('settings.priorityLow') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.processPriority === 'belowNormal' }">
                <input type="radio" name="processPriority" value="belowNormal" v-model="s.processPriority" />
                {{ $t('settings.priorityBelowNormal') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.processPriority === 'normal' }">
                <input type="radio" name="processPriority" value="normal" v-model="s.processPriority" />
                {{ $t('settings.priorityNormal') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.processPriority === 'aboveNormal' }">
                <input type="radio" name="processPriority" value="aboveNormal" v-model="s.processPriority" />
                {{ $t('settings.priorityAboveNormal') }}
              </label>
              <label class="radio-item-k" :class="{ active: s.processPriority === 'high' }">
                <input type="radio" name="processPriority" value="high" v-model="s.processPriority" />
                {{ $t('settings.priorityHigh') }}
              </label>
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
          窗口设置
        </h3>
        <div class="sec-body">
          <div class="game-param-group" style="margin-bottom:16px">
            <label class="row-label" style="margin-bottom:4px">{{ $t('settings.windowTitle') }}</label>
            <p class="row-desc" style="margin-bottom:8px">{{ $t('settings.windowTitleDesc') }}</p>
            <input type="text" class="inp" v-model="s.windowTitle" placeholder="Minecraft {version}" style="width:100%" />
          </div>
          <div class="memory-alloc-card">
            <label class="row-label" style="margin-bottom:8px">{{ $t('settings.windowSize') }}</label>
            <div class="mem-options" style="flex-direction:column;gap:8px">
              <label class="radio-item-k" :class="{ active: s.windowPreset === 'default' }">
                <input type="radio" name="windowPreset" value="default" v-model="s.windowPreset" />
                默认窗口大小
              </label>
              <label class="radio-item-k" :class="{ active: s.windowPreset === 'fullscreen' }">
                <input type="radio" name="windowPreset" value="fullscreen" v-model="s.windowPreset" />
                全屏启动
              </label>
              <label class="radio-item-k" :class="{ active: s.windowPreset === 'custom' }">
                <input type="radio" name="windowPreset" value="custom" v-model="s.windowPreset" />
                自定义尺寸
              </label>
            </div>
            <div v-if="s.windowPreset === 'custom'" class="mem-custom-row" style="margin-top:8px">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="sep">宽</span>
                <input type="number" class="inp short" v-model="s.winW" placeholder="854" min="1" style="width:80px" />
                <span class="sep">&times;</span>
                <span class="sep">高</span>
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
          游戏参数
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
          启动命令
        </h3>
        <div class="sec-body">
          <div class="row">
            <div class="row-control full">
              <textarea class="textarea" rows="4" readonly placeholder="启动命令将在游戏启动时生成…" style="font-family:var(--font-mono,monospace);font-size:12px;opacity:0.7"></textarea>
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
          调试
        </h3>
        <div class="sec-body">
          <div class="debug-mode-row">
            <div class="debug-mode-info">
              <span class="debug-mode-label">调试模式</span>
              <p class="debug-mode-desc">启用后将在控制台输出详细日志，可能影响性能</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="s.debugMode" @change="toggleDebugMode" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="debug-card">
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
    </template>

    <!-- ========== 个性化 ========== -->
    <template v-if="activeCategory === 'personalize'">
      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('appearance')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="13.5" cy="6.5" r="2.5" />
            <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
          </svg>
          {{ $t('settings.appearance') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.appearance }"
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

        <div class="sec-body" v-show="collapsed.appearance">
          <!-- 不透明度 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.opacity') }}</label>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="range"
                  class="range"
                  v-model.number="s.opacity"
                  min="30"
                  max="100"
                  step="5"
                />
                <span class="range-val">{{ s.opacity }}%</span>
              </div>
            </div>
          </div>

          <!-- 主题模式 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.themeMode') }}</label>
            </div>
            <div class="row-control">
              <div class="theme-mode-options">
                <button
                  class="theme-mode-btn"
                  :class="{ active: appStore.theme === 'dark' }"
                  @click="appStore.setTheme('dark')"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <span>{{ $t('settings.themeDark') }}</span>
                </button>
                <button
                  class="theme-mode-btn"
                  :class="{ active: appStore.theme === 'light' }"
                  @click="appStore.setTheme('light')"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  <span>{{ $t('settings.themeLight') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 主题色 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.themeColor') }}</label>
            </div>
            <div class="row-control">
              <div class="color-options">
                <button
                  v-for="c in colorPresets"
                  :key="c.name"
                  class="color-swatch"
                  :class="{ active: s.themeColor === c.value }"
                  :style="{ background: c.value }"
                  @click="applyThemeColor(c.value)"
                  :title="c.name"
                ></button>
              </div>
            </div>
          </div>

          <!-- 语言 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.interfaceLanguage') }}</label>
            </div>
            <div class="row-control">
              <select class="sel" v-model="s.lang">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          <!-- 字号 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.fontSize') }}</label>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="range"
                  class="range"
                  v-model.number="s.fontSize"
                  min="12"
                  max="20"
                  step="1"
                />
                <span class="range-val">{{ s.fontSize }}px</span>
              </div>
            </div>
          </div>

          <!-- 动画 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.animations') }}</label>
            </div>
            <div class="row-control">
              <label class="chk">
                <input type="checkbox" v-model="s.enableAnimations" />
                {{ s.enableAnimations ? $t('settings.enabled') : $t('settings.disabled') }}
              </label>
            </div>
          </div>

          <!-- 特效 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.effects') }}</label>
            </div>
            <div class="row-control">
              <label class="chk">
                <input type="checkbox" v-model="s.enableEffects" />
                {{ s.enableEffects ? $t('settings.enabled') : $t('settings.disabled') }}
              </label>
            </div>
          </div>

          <!-- 音效 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.sounds') }}</label>
            </div>
            <div class="row-control">
              <label class="chk">
                <input type="checkbox" v-model="s.enableSounds" />
                {{ s.enableSounds ? $t('settings.enabled') : $t('settings.disabled') }}
              </label>
            </div>
          </div>
        </div>
        <!-- /sec-body -->
      </section>

      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('background')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {{ $t('settings.background') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.background }"
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

        <div class="sec-body" v-show="collapsed.background">
          <!-- 背景图片 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.bgImage') }}</label>
            </div>
            <div class="row-control">
              <div class="input-group">
                <select class="sel" :value="appStore.bgImageMode" @change="appStore.setBgImageMode(($event.target as HTMLSelectElement).value as 'none' | 'custom')">
                  <option value="none">{{ $t('settings.noBgImage') }}</option>
                  <option value="custom">{{ $t('settings.customImage') }}</option>
                </select>
                <button v-if="appStore.bgImageMode === 'custom'" class="btn-sm" @click="browseBgImage">
                  {{ $t('settings.selectImage') }}
                </button>
              </div>
            </div>
          </div>

          <div class="row" v-if="appStore.bgImageMode === 'custom'">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.colorOverlay') }}</label>
            </div>
            <div class="row-control">
              <div class="input-group">
                <label class="chk"
                  ><input type="checkbox" :checked="appStore.bgColorOverlay" @change="appStore.setBgColorOverlay(($event.target as HTMLInputElement).checked)" /> {{ $t('settings.enabled') }}</label
                >
                <input
                  v-if="appStore.bgColorOverlay"
                  type="color"
                  class="color-picker"
                  :value="appStore.bgOverlayColor"
                  @input="appStore.setBgOverlayColor(($event.target as HTMLInputElement).value)"
                  style="width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; flex-shrink: 0"
                />
              </div>
            </div>
          </div>

          <!-- 背景模糊 -->
          <div class="row" v-if="appStore.bgImageMode === 'custom'">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.bgBlur') }}</label>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="range"
                  class="range"
                  :value="appStore.themeBgBlur"
                  @input="appStore.setThemeBgBlur(Number(($event.target as HTMLInputElement).value))"
                  min="0"
                  max="20"
                  step="1"
                />
                <span class="range-val">{{ appStore.themeBgBlur }}px</span>
              </div>
            </div>
          </div>

          <!-- 背景暗化 -->
          <div class="row" v-if="appStore.bgImageMode === 'custom'">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.bgDim') }}</label>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="range"
                  class="range"
                  :value="appStore.bgDimAmount"
                  @input="appStore.setBgDimAmount(Number(($event.target as HTMLInputElement).value))"
                  min="0"
                  max="100"
                  step="5"
                />
                <span class="range-val">{{ appStore.bgDimAmount }}%</span>
              </div>
            </div>
          </div>

          <!-- 背景音乐 -->
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.bgMusic') }}</label>
              <p class="row-desc">{{ $t('settings.bgMusicDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group">
                <select class="sel" v-model="s.bgMusicMode">
                  <option value="none">{{ $t('settings.musicOff') }}</option>
                  <option value="custom">{{ $t('settings.customMusic') }}</option>
                </select>
                <button v-if="s.bgMusicMode === 'custom'" class="btn-sm">{{ $t('settings.selectFolder') }}</button>
              </div>
            </div>
          </div>
        </div>
        <!-- /sec-body -->
      </section>

      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('titlebar')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          {{ $t('settings.titlebar') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.titlebar }"
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

        <div class="sec-body" v-show="collapsed.titlebar">
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.titlebarMode') }}</label>
            </div>
            <div class="row-control">
              <select class="sel" v-model="s.titleBarMode">
                <option value="default">{{ $t('settings.defaultTitlebar') }}</option>
                <option value="none">{{ $t('settings.hideTitlebar') }}</option>
                <option value="text">{{ $t('settings.textOnly') }}</option>
                <option value="image">{{ $t('settings.customImageTitlebar') }}</option>
              </select>
            </div>
          </div>
        </div>
        <!-- /sec-body -->
      </section>

      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('homepage')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          {{ $t('settings.homepage') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.homepage }"
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

        <div class="sec-body" v-show="collapsed.homepage">
          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.homepageContent') }}</label>
            </div>
            <div class="row-control">
              <select class="sel" v-model="s.homeContent">
                <option value="blank">{{ $t('settings.blankPage') }}</option>
                <option value="preset">{{ $t('settings.presetHomepage') }}</option>
                <option value="local">{{ $t('settings.localFile') }}</option>
                <option value="online">{{ $t('settings.onlineUpdate') }}</option>
              </select>
            </div>
          </div>
        </div>
        <!-- /sec-body -->
      </section>

      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('features')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
            />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          {{ $t('settings.features') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.features }"
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

        <div class="sec-body" v-show="collapsed.features">
          <p class="sec-desc">
            {{ $t('settings.featuresDesc') }}
          </p>
          <div class="feature-hide-table">
            <template v-for="row in featureRows" :key="row.label">
              <span class="fh-row-label">{{ row.label }}</span>
              <template v-for="feat in row.items" :key="feat.key">
                <label class="fh-cell" :class="{ hidden: feat.hidden, disabled: feat.disabled }">
                  <input type="checkbox" v-model="feat.hidden" :disabled="feat.disabled" />
                  <span class="feat-name">{{ feat.name }}</span>
                </label>
              </template>
              <!-- 补空格占位，保证每行满4列 -->
              <span
                v-for="i in 4 - row.items.length"
                :key="'pad-' + i + row.label"
                class="fh-cell fh-pad"
              />
            </template>
          </div>
          <div class="warn-bar warn-orange" style="margin-top: 12px">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ $t('settings.featuresWarning') }}
          </div>
        </div>
        <!-- /sec-body -->
      </section>

      <!-- ========== 全局快捷键 ========== -->
      <section class="sec">
        <h3 class="sec-title" @click="toggleSec('hotkey')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
          </svg>
          {{ $t('settings.globalHotkeys') }}
          <svg
            class="sec-arrow"
            :class="{ open: collapsed.hotkey }"
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

        <div class="sec-body" v-show="collapsed.hotkey">
          <p class="sec-desc">
            {{ $t('settings.hotkeyDesc') }}<code>Ctrl+Shift+L</code>、<code
              >Alt+F12</code
            >
          </p>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.launchGame') }}</label>
              <p class="row-desc">{{ $t('settings.launchGameDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.hotkeyLaunch"
                  placeholder="Ctrl+Shift+L"
                />
                <button class="btn-sm" @click="updateHotkey('launch-game', s.hotkeyLaunch)">
                  {{ $t('settings.save') }}
                </button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.toggleWindow') }}</label>
              <p class="row-desc">{{ $t('settings.toggleWindowDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.hotkeyToggleWindow"
                  placeholder="Ctrl+Shift+H"
                />
                <button class="btn-sm" @click="updateHotkey('toggle-window', s.hotkeyToggleWindow)">
                  {{ $t('settings.save') }}
                </button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.openHome') }}</label>
              <p class="row-desc">{{ $t('settings.openHomeDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.hotkeyOpenHome"
                  placeholder="Ctrl+Shift+O"
                />
                <button class="btn-sm" @click="updateHotkey('open-home', s.hotkeyOpenHome)">
                  {{ $t('settings.save') }}
                </button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">{{ $t('settings.openSettings') }}</label>
              <p class="row-desc">{{ $t('settings.openSettingsDesc') }}</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.hotkeyOpenSettings"
                  placeholder="Ctrl+,"
                />
                <button class="btn-sm" @click="updateHotkey('open-settings', s.hotkeyOpenSettings)">
                  {{ $t('settings.save') }}
                </button>
              </div>
            </div>
          </div>

          <div class="btn-row">
            <button class="action-btn outline" @click="reloadHotkeys">{{ $t('settings.reloadHotkeys') }}</button>
          </div>
        </div>
        <!-- /sec-body -->
      </section>
    </template>

    <!-- ========== 主界面 ========== -->
    <template v-if="activeCategory === 'interface'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          {{ $t('settings.sidebar.interface') }}
        </h3>
        <p class="sec-desc">自定义主界面布局与显示。</p>
      </section>
    </template>

    <!-- ========== 语言 ========== -->
    <template v-if="activeCategory === 'language'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          {{ $t('settings.sidebar.lang') }}
        </h3>
        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.interfaceLanguage') }}</label>
          </div>
          <div class="row-control">
            <select class="sel" v-model="s.lang">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
      </section>
    </template>

    <!-- ========== 辅助功能 ========== -->
    <template v-if="activeCategory === 'accessibility'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          {{ $t('settings.sidebar.accessibility') }}
        </h3>
        <p class="sec-desc">辅助功能设置。</p>
      </section>
    </template>

    <!-- ========== 下载与网络 ========== -->
    <template v-if="activeCategory === 'download-net'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ $t('settings.sidebar.downloadNet') }}
        </h3>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.downloadSource') }}</label>
            <p class="row-desc">{{ $t('settings.downloadSourceDesc') }}</p>
          </div>
          <div class="row-control">
            <select class="sel" v-model="s.downloadSource">
              <option value="bmclapi">{{ $t('settings.bmclapi') }}</option>
              <option value="official">{{ $t('settings.official') }}</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.versionListSource') }}</label>
          </div>
          <div class="row-control">
            <select class="sel" v-model="s.versionListSource">
              <option value="bmclapi">BMCLAPI</option>
              <option value="official">{{ $t('settings.official') }}</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.maxThreads') }}</label>
          </div>
          <div class="row-control">
            <div class="input-group compact">
              <input type="range" class="range" v-model.number="s.maxThreads" min="1" max="64" step="1" />
              <span class="range-val">{{ s.maxThreads }} {{ $t('settings.threads') }}</span>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.speedLimit') }}</label>
          </div>
          <div class="row-control">
            <div class="input-group compact">
              <input type="number" class="inp short" v-model.number="s.speedLimit" min="0" step="1024" />
              <span class="sep">KB/s</span>
              <span class="row-hint">{{ $t('settings.speedLimitHint') }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- ========== 联机 ========== -->
    <template v-if="activeCategory === 'online'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
          {{ $t('settings.sidebar.online') }}
        </h3>
        <p class="sec-desc">联机与网络对战设置。</p>
      </section>
    </template>

    <!-- ========== 安全识别服务 ========== -->
    <template v-if="activeCategory === 'auth-service'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          {{ $t('settings.sidebar.authService') }}
        </h3>
        <p class="sec-desc">安全识别服务设置。</p>
      </section>
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
            <select class="sel" v-model="s.modSource">
              <option value="curseforge">{{ $t('settings.curseforge') }}</option>
              <option value="modrinth">{{ $t('settings.modrinth') }}</option>
              <option value="both">{{ $t('settings.both') }}</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.fileNameFormat') }}</label>
            <p class="row-desc">{{ $t('settings.fileNameFormatDesc') }}</p>
          </div>
          <div class="row-control">
            <select class="sel" v-model="s.fileNameFormat">
              <option value="name-version">{{ $t('settings.nameVersion') }}</option>
              <option value="id-name">{{ $t('settings.idName') }}</option>
              <option value="original">{{ $t('settings.original') }}</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.modManageStyle') }}</label>
          </div>
          <div class="row-control">
            <select class="sel" v-model="s.modManageStyle">
              <option value="list">{{ $t('settings.listMode') }}</option>
              <option value="card">{{ $t('settings.cardMode') }}</option>
            </select>
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
          <button class="action-btn outline">
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
          <button class="action-btn outline">{{ $t('settings.clearDownloadCache') }}</button>
          <button class="action-btn outline">{{ $t('settings.clearVersionCache') }}</button>
        </div>

        <div class="btn-row danger-zone" style="margin-top: 18px">
          <button class="action-btn danger">{{ $t('settings.resetSettings') }}</button>
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
            创建或导入 Modrinth 格式（.mrpack）整合包。一个整合包可包含 Mod、配置、资源包、存档等。
          </p>

          <!-- 打包整合包 -->
          <h4 class="sec-subtitle">📦 打包整合包</h4>

          <div class="row">
            <div class="row-main">
              <label class="row-label">实例目录</label>
              <p class="row-desc">选择要打包的 .minecraft 或实例目录</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.modpackInstancePath"
                  placeholder="例如：C:/Users/xxx/.minecraft"
                />
                <button class="btn-sm" @click="browseModpackInstance">浏览...</button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">输出目录</label>
              <p class="row-desc">生成的 .mrpack 文件保存位置</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input
                  type="text"
                  class="inp"
                  v-model="s.modpackOutputDir"
                  placeholder="留空使用默认目录"
                />
                <button class="btn-sm" @click="browseModpackOutput">浏览...</button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">整合包信息</label>
              <p class="row-desc">名称、版本号、作者</p>
            </div>
            <div class="row-control">
              <div class="input-group compact">
                <input type="text" class="inp short" v-model="s.modpackName" placeholder="名称" />
                <input
                  type="text"
                  class="inp short"
                  v-model="s.modpackVersion"
                  placeholder="版本"
                />
                <input type="text" class="inp short" v-model="s.modpackAuthor" placeholder="作者" />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">包含内容</label>
              <p class="row-desc">选择要打包到整合包中的文件类型</p>
            </div>
            <div class="row-control">
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeMods" /> Mods
              </label>
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeConfigs" /> 配置文件
              </label>
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeSaves" /> 存档
              </label>
              <label class="chk">
                <input type="checkbox" v-model="s.modpackIncludeResourcepacks" /> 资源包
              </label>
            </div>
          </div>

          <div class="btn-row">
            <button class="action-btn primary" @click="packAsMrpack" :disabled="isWorkingModpack">
              {{ isWorkingModpack ? '正在打包...' : '生成 .mrpack' }}
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
          <h4 class="sec-subtitle" style="margin-top: 20px">📥 导入整合包</h4>
          <p class="sec-desc">从 .mrpack 文件创建新的实例</p>

          <div class="btn-row">
            <button class="action-btn outline" @click="importMrpack" :disabled="isWorkingModpack">
              {{ isWorkingModpack ? '处理中...' : '选择 .mrpack 文件导入' }}
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
          数据备份与恢复
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
            备份启动器的所有配置、实例信息等数据，可用于迁移到新设备或恢复状态。
          </p>

          <div class="row">
            <div class="row-main">
              <label class="row-label">上次备份</label>
              <p class="row-desc">{{ s.backupLastTime || '尚未备份' }}</p>
            </div>
            <div class="row-control">
              <button class="action-btn primary" @click="createBackup" :disabled="isWorkingBackup">
                {{ isWorkingBackup ? '备份中...' : '立即备份' }}
              </button>
            </div>
          </div>

          <div class="row">
            <div class="row-main">
              <label class="row-label">恢复备份</label>
              <p class="row-desc">从 .zip 备份文件恢复数据（会覆盖当前）</p>
            </div>
            <div class="row-control">
              <button class="action-btn outline" @click="restoreBackup" :disabled="isWorkingBackup">
                选择备份文件恢复
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
            <h4 class="sec-subtitle">📁 已有备份</h4>
            <div class="backup-item" v-for="f in backupFiles" :key="f.name">
              <div class="backup-info">
                <div class="backup-name">{{ f.name }}</div>
                <div class="backup-meta">
                  <span v-if="f.size">{{ (f.size / 1024).toFixed(1) }} KB</span>
                  <span v-if="f.created">{{ new Date(f.created).toLocaleString() }}</span>
                </div>
              </div>
              <button class="btn-sm danger-btn" @click="deleteBackup(f.name)">删除</button>
            </div>
          </div>
        </div>
        <!-- /sec-body -->
      </section>
    </template>

    <!-- ========== 服务与反馈 ========== -->
    <template v-if="activeCategory === 'service'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {{ $t('settings.sidebar.service') }}
        </h3>
      </section>

      <section class="sec">
        <h3 class="sec-title">{{ $t('more.help') }}</h3>
        <p class="sec-desc">{{ $t('more.helpSubtitle') }}</p>

        <div class="faq-list">
          <div class="faq-item">
            <div class="faq-question">如何安装 Mod？</div>
            <div class="faq-answer">在下载页面选择对应游戏版本的 Mod，点击安装即可。支持 CurseForge 和 Modrinth 源。</div>
          </div>
          <div class="faq-item">
            <div class="faq-question">启动游戏时提示 Java 未找到？</div>
            <div class="faq-answer">请前往「设置 → 启动选项 → 游戏 Java」中手动选择或检测 Java 安装路径。</div>
          </div>
          <div class="faq-item">
            <div class="faq-question">如何导入整合包？</div>
            <div class="faq-answer">在「设置 → 其他 → 整合包工具」中选择导入 .mrpack 文件即可。</div>
          </div>
          <div class="faq-item">
            <div class="faq-question">如何备份数据？</div>
            <div class="faq-answer">在「设置 → 其他 → 数据备份与恢复」中创建备份，可用于迁移或恢复。</div>
          </div>
          <div class="faq-item">
            <div class="faq-question">启动器卡顿或显示异常？</div>
            <div class="faq-answer">尝试在「个性化」中调整界面不透明度、关闭动画或特效。也可以在「开发者选项」中打开调试模式查看日志。</div>
          </div>
        </div>
      </section>

      <section class="sec">
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
            <a class="action-btn outline" href="https://github.com/nnkmn/voxver-launcher/issues" target="_blank">
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
            <button class="action-btn outline" @click="copyEmail">
              {{ $t('more.sendEmail') }}
            </button>
          </div>
        </div>
      </section>
    </template>

    <!-- ========== 赞助我们 ========== -->
    <template v-if="activeCategory === 'sponsor'">
      <section class="sec">
        <h3 class="sec-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {{ $t('settings.sidebar.sponsor') }}
        </h3>
        <p class="sec-desc">如果你喜欢 VoxVer Launcher，欢迎赞助支持我们的开发！你的支持将用于服务器维护、域名续费以及开发者激励。</p>
        <div class="btn-row" style="margin-top: 12px">
          <button class="action-btn primary" @click="openSponsorLink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            {{ $t('more.sponsorMcla') }}
          </button>
        </div>
      </section>
    </template>

    <!-- ========== 开发者选项 ========== -->
    <template v-if="activeCategory === 'developer'">
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
        <h3 class="sec-title">调试与诊断</h3>
        <p class="sec-desc">调试模式会记录更详细的日志，便于排查问题。导出诊断日志可将日志打包，方便提交 Bug 报告。</p>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.debugMode') }}</label>
            <p class="row-desc">记录 DEBUG 级别日志（重启后生效）</p>
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
            <p class="row-desc">将日志和应用信息打包为 .zip，用于 Bug 报告</p>
          </div>
          <div class="row-control">
            <button class="action-btn" @click="exportDiagnostics" :disabled="isExportingDiagnostics">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {{ isExportingDiagnostics ? '导出中...' : '导出日志' }}
            </button>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.openDevTools') }}</label>
            <p class="row-desc">打开 Chrome 开发者工具，用于调试界面问题</p>
          </div>
          <div class="row-control">
            <button class="action-btn outline" @click="openDevTools">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              打开开发者工具
            </button>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.logLevel') }}</label>
            <p class="row-desc">设置日志输出级别</p>
          </div>
          <div class="row-control">
            <select class="sel" v-model="s.logLevel">
              <option value="TRACE">TRACE</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO" selected>INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="row-main">
            <label class="row-label">{{ $t('settings.useProxy') }}</label>
            <p class="row-desc">配置 HTTP/HTTPS 代理</p>
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
            <label class="row-label">关闭到托盘</label>
            <p class="row-desc">关闭窗口时最小化到系统托盘而非退出</p>
          </div>
          <div class="row-control">
            <label class="chk">
              <input type="checkbox" v-model="s.closeToTray" />
              {{ s.closeToTray ? $t('settings.enabled') : $t('settings.disabled') }}
            </label>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, inject, computed, onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { setLocale } from '../locale/i18n'
import { useAppStore } from '../stores/app.store'
import AccountPage from './AccountPage.vue'

const router = useRouter()
const appStore = useAppStore()

const settingsActive = inject('settingsActive') as any
const activeCategory = computed(() => settingsActive?.value || 'home')

const searchQuery = ref('')
function switchCategory(cat: string) {
  if (settingsActive) settingsActive.value = cat
}
function onSearchInput() {
  // 搜索过滤 - 后续可扩展为全局设置搜索
}

// 加载保存的 Java 设置
onMounted(async () => {
  await loadJavaSettings()
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
const detectedJava = ref<any[]>([])
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

const s = reactive({
  // 启动
  versionIsolation: 'version',
  windowTitle: 'Minecraft {version}',
  launchVisibility: 'hide',
  processPriority: 'normal',
  winW: '854',
  winH: '480',
  windowPreset: 'default',
  fullscreen: false,
  javaPreset: 'auto',
  javaPath: '',
  memoryMode: 'auto',
  memoryCustomGB: 4,
  memoryMin: 1024,
  memoryMax: 4096,
  offlineSkin: 'default',
  customSkinPath: '',
  officialSkinName: '',
  jvmArgs: '',
  gameArgs: '',
  preLaunchCmd: '',
  memoryManage: 'g1gc',
  disableJavaLaunchWrapper: false,
  disableLwjglUnsafeAgent: false,
  useHighPerformanceGPU: false,

  // 个性化
  opacity: 100,
  themeColor: localStorage.getItem('voxver_themeColor') || '#6366f1',
  lang: (localStorage.getItem('voxver-language') as 'zh-CN' | 'en-US') || 'zh-CN',
  bgMusicMode: 'none',
  titleBarMode: 'default',
  homeContent: 'blank',
  fontSize: 14,
  enableAnimations: true,
  enableEffects: true,
  enableSounds: true,

  // 其他
  downloadSource: 'bmclapi',
  versionListSource: 'bmclapi',
  maxThreads: 32,
  speedLimit: 0,
  modSource: 'both',
  fileNameFormat: 'name-version',
  modManageStyle: 'card',

  // P2: 全局快捷键
  hotkeyLaunch: 'Ctrl+Shift+L',
  hotkeyToggleWindow: 'Ctrl+Shift+H',
  hotkeyOpenHome: 'Ctrl+Shift+O',
  hotkeyOpenSettings: 'Ctrl+,',

  // P2: 主题自定义
  themeCustomColor: '#6366f1',
  themeBgOpacity: 100,

  // P2: 整合包工具
  modpackInstancePath: '',
  modpackOutputDir: '',
  modpackIncludeConfigs: true,
  modpackIncludeMods: true,
  modpackIncludeSaves: true,
  modpackIncludeResourcepacks: false,
  modpackName: '',
  modpackAuthor: '',
  modpackVersion: '1.0.0',

  // P2: 数据备份
  backupLastTime: '',
  backupFile: '',

  // v0.5.3: 调试模式
  debugMode: false,

  // v0.6.0: 开发者选项
  logLevel: 'INFO',
  useProxy: false,
  proxyHost: '127.0.0.1',
  proxyPort: 7890,
  closeToTray: false
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

// P2 状态变量
const hotkeyList = ref<any[]>([])
const modpackProgress = ref({ stage: '', progress: 0, currentFile: '' })
const backupProgress = ref({ stage: '', progress: 0, currentItem: '' })
const isWorkingModpack = ref(false)
const isWorkingBackup = ref(false)

// v0.5.3: 诊断日志导出状态
const isExportingDiagnostics = ref(false)
const systemTotalGB = ref(16)
const backupFiles = ref<any[]>([])

// 更新检查状态
const updateStatus = ref({
  checking: false,
  available: false,
  downloading: false,
  downloadProgress: 0,
  downloaded: false,
  error: null as string | null,
  version: null as string | null,
  releaseNotes: null as string | null
})

const memoryPercent = computed(() => {
  // 假设 16GB 系统
  const total = 16384
  return Math.round((s.memoryMax / total) * 100)
})

const colorPresets = [
  { name: '靛蓝紫（默认）', value: '#6366f1' },
  { name: '玫瑰粉', value: '#ec4899' },
  { name: '翡翠绿', value: '#10b981' },
  { name: '琥珀橙', value: '#f59e0b' },
  { name: '珊瑚红', value: '#ef4444' },
  { name: '天际蓝', value: '#0ea5e9' },
  { name: '紫罗兰', value: '#8b5cf6' }
]

const featureRows = reactive([
  {
    label: '主页面',
    items: [
      { key: 'hideDownload', name: '下载', hidden: false, disabled: false },
      { key: 'hideOnline1', name: '联机', hidden: true, disabled: true },
      { key: 'hideSettings', name: '设置', hidden: false, disabled: false },
      { key: 'hideMore', name: '更多', hidden: false, disabled: false }
    ]
  },
  {
    label: '设置 子页面',
    items: [
      { key: 'hideLaunch', name: '启动', hidden: false, disabled: false },
      { key: 'hideOnline2', name: '联机', hidden: true, disabled: true },
      { key: 'hidePersonalize', name: '个性化', hidden: false, disabled: false },
      { key: 'hideOther', name: '其他', hidden: false, disabled: false }
    ]
  },
  {
    label: '更多 子页面',
    items: [
      { key: 'hideHelp', name: '帮助', hidden: false, disabled: false },
      { key: 'hideAbout', name: '关于与鸣谢', hidden: false, disabled: false },
      { key: 'hideBaibao', name: '百宝箱', hidden: false, disabled: false },
      { key: 'hideFeedback', name: '反馈', hidden: false, disabled: false }
    ]
  },
  {
    label: '特定功能',
    items: [
      { key: 'hideEmailHide', name: '邮箱隐藏', hidden: false, disabled: false },
      { key: 'hideVersionMgr', name: '版本管理', hidden: false, disabled: false },
      { key: 'hideModUpdate', name: 'Mod 更新', hidden: false, disabled: false },
      { key: 'hideFeatureHide', name: '功能隐藏', hidden: false, disabled: false }
    ]
  }
])

async function browseJava() {
  const path = await window.electronAPI?.dialog.selectFile({
    title: '选择 java.exe',
    filters: [{ name: 'Java 可执行文件', extensions: ['exe'] }]
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
    { name: '检查环境变量', progress: 25 },
    { name: '扫描常见安装目录', progress: 50 },
    { name: '检查系统特定位置', progress: 75 },
    { name: '验证检测到的 Java', progress: 100 }
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
      detectedJava.value = javas

      // 如果有检测到Java，自动选择第一个或标记为默认的Java
      if (javas.length > 0) {
        const defaultJava = javas.find((j: any) => j.isDefault) || javas[0]
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
function selectJava(java: any) {
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
        title: '成功',
        body: `Java 验证成功！ Java 版本: ${result.javaVersion || '未知'} ${result.javacVersion ? `Javac 版本: ${result.javacVersion}` : ''}`,
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: '错误',
        body: `Java 验证失败：${result?.error || '未知错误'}`,
        type: 'error'
      })
    }
  } catch (error) {
    console.error('验证 Java 失败:', error)
    window.electronAPI?.notification?.send({ title: '错误', body: '验证过程出错', type: 'error' })
  }
}
async function browseSkin() {
  const path = await window.electronAPI?.dialog?.selectFile({
    title: '选择皮肤文件（PNG）',
    filters: [{ name: 'PNG 图片', extensions: ['png'] }]
  })
  if (path) {
    s.customSkinPath = path
    s.offlineSkin = 'custom'
  }
}
async function browseBgImage() {
  const path = await window.electronAPI?.dialog?.selectFile({
    title: '选择背景图片',
    filters: [{ name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }]
  })
  if (path) {
    appStore.setBgImagePath(path)
  }
}
async function openMcDir() {
  try {
    const mcDir = await window.electronAPI?.path?.getMinecraft()
    if (mcDir) {
      await window.electronAPI?.shell.openPath(mcDir)
    } else {
      window.electronAPI?.notification?.send({
        title: '提示',
        body: '无法确定 .minecraft 目录位置',
        type: 'warning'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `打开目录失败: ${e.message}`,
      type: 'error'
    })
  }
}

const skinOptions = [
  { value: 'random', label: '随机' },
  { value: 'default', label: 'Steve' },
  { value: 'alex', label: 'Alex' },
  { value: 'official', label: '正版皮肤' },
  { value: 'custom', label: '自定义' }
]

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
      title: '提示',
      body: '请先输入正版玩家名',
      type: 'warning'
    })
    return
  }
  try {
    window.electronAPI?.notification?.send({ title: '成功', body: '皮肤已保存', type: 'success' })
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `皮肤保存失败: ${e.message}`,
      type: 'error'
    })
  }
}

async function refreshSkin() {
  if (!s.officialSkinName) {
    window.electronAPI?.notification?.send({
      title: '提示',
      body: '请先输入正版玩家名',
      type: 'warning'
    })
    return
  }
  try {
    window.electronAPI?.notification?.send({ title: '成功', body: '皮肤已刷新', type: 'success' })
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `皮肤刷新失败: ${e.message}`,
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
      hotkeyList.value = list
      list.forEach((h: any) => {
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
        title: '错误',
        body: `快捷键保存失败: ${res.error}`,
        type: 'error'
      })
      return
    }
    window.electronAPI?.notification?.send({ title: '成功', body: '快捷键已更新', type: 'success' })
    await loadHotkeys()
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `快捷键更新失败: ${e.message}`,
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
      title: '成功',
      body: '快捷键已重新加载',
      type: 'success'
    })
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `重载失败: ${e.message}`,
      type: 'error'
    })
  }
}

// ========== P2: 整合包工具 ==========
async function browseModpackInstance() {
  try {
    const path = await window.electronAPI?.dialog?.selectFolder({
      title: '选择实例目录（.minecraft）'
    })
    if (path) s.modpackInstancePath = path
  } catch (e: any) {
    console.error('选择实例目录失败:', e)
  }
}

async function browseModpackOutput() {
  try {
    const path = await window.electronAPI?.dialog?.selectFolder({
      title: '选择整合包输出目录'
    })
    if (path) s.modpackOutputDir = path
  } catch (e: any) {
    console.error('选择输出目录失败:', e)
  }
}

async function packAsMrpack() {
  if (!s.modpackInstancePath) {
    window.electronAPI?.notification?.send({
      title: '提示',
      body: '请先选择实例目录',
      type: 'warning'
    })
    return
  }
  if (!s.modpackName) {
    window.electronAPI?.notification?.send({
      title: '提示',
      body: '请填写整合包名称',
      type: 'warning'
    })
    return
  }
  try {
    isWorkingModpack.value = true
    modpackProgress.value = { stage: '准备中', progress: 0, currentFile: '' }

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
        title: '成功',
        body: `整合包创建成功！ 输出文件: ${result.filePath || '(未知)'}`,
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: '错误',
        body: `创建失败: ${result?.error || '未知错误'}`,
        type: 'error'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `创建整合包失败: ${e.message}`,
      type: 'error'
    })
  } finally {
    isWorkingModpack.value = false
  }
}

async function importMrpack() {
  try {
    const mrpackPath = await window.electronAPI?.dialog?.selectFile({
      title: '选择 mrpack 文件',
      filters: [{ name: 'Modrinth 整合包', extensions: ['mrpack'] }]
    })
    if (!mrpackPath) return

    const targetDir = await window.electronAPI?.dialog?.selectFolder({
      title: '选择安装位置（父目录，将创建子目录）'
    })
    if (!targetDir) return

    const instanceName = prompt('请输入新实例名称:', 'New Modpack')
    if (!instanceName) return

    isWorkingModpack.value = true
    modpackProgress.value = { stage: '导入中', progress: 0, currentFile: '' }

    const result = await window.electronAPI?.modpack?.import({
      mrpackPath,
      targetParentDir: targetDir,
      instanceName
    })

    if (result?.ok) {
      window.electronAPI?.notification?.send({
        title: '成功',
        body: `整合包导入成功！ 位置: ${result.instancePath || '(未知)'}`,
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: '错误',
        body: `导入失败: ${result?.error || '未知错误'}`,
        type: 'error'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `导入整合包失败: ${e.message}`,
      type: 'error'
    })
  } finally {
    isWorkingModpack.value = false
  }
}

// ========== P2: 主题自定义增强 ==========
async function applyCustomThemeColor(hex: string) {
  try {
    const vars = await window.electronAPI?.theme?.computeVars(hex)
    if (vars) {
      const root = document.documentElement
      Object.entries(vars).forEach(([k, v]) => {
        root.style.setProperty(k, String(v))
      })
      s.themeColor = hex
      s.themeCustomColor = hex
    }
  } catch (e: any) {
    console.error('应用主题色失败:', e)
  }
}

async function importBgImage() {
  try {
    const path = await window.electronAPI?.dialog?.selectFile({
      title: '选择背景图片',
      filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] }]
    })
    if (!path) return
    const local = await window.electronAPI?.theme?.importBackground(path)
    if (local) {
      appStore.setBgImageMode('custom')
      appStore.setBgImagePath(local)
      window.electronAPI?.notification?.send({
        title: '成功',
        body: '背景已保存到启动器目录',
        type: 'success'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `导入背景失败: ${e.message}`,
      type: 'error'
    })
  }
}

// ========== P2: 数据备份/恢复 ==========
async function createBackup() {
  try {
    isWorkingBackup.value = true
    backupProgress.value = { stage: '备份中', progress: 0, currentItem: '' }
    const result = await window.electronAPI?.backup?.create()
    if (result?.ok) {
      s.backupLastTime = new Date().toLocaleString()
      window.electronAPI?.notification?.send({
        title: '成功',
        body: `备份成功！ 文件: ${result.filePath || '(未知)'} 大小: ${result.size != null ? (result.size / 1024).toFixed(1) : '(未知)'} KB`,
        type: 'success'
      })
      await listBackups()
    } else {
      window.electronAPI?.notification?.send({
        title: '错误',
        body: `备份失败: ${result?.error || '未知错误'}`,
        type: 'error'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `备份失败: ${e.message}`,
      type: 'error'
    })
  } finally {
    isWorkingBackup.value = false
  }
}

async function restoreBackup() {
  try {
    const path = await window.electronAPI?.dialog?.selectFile({
      title: '选择备份文件（.zip）',
      filters: [{ name: '备份文件', extensions: ['zip'] }]
    })
    if (!path) return

    if (!confirm('恢复备份将覆盖当前数据，确认继续？')) return

    isWorkingBackup.value = true
    backupProgress.value = { stage: '恢复中', progress: 0, currentItem: '' }

    const result = await window.electronAPI?.backup?.restore(path)
    if (result?.ok) {
      window.electronAPI?.notification?.send({
        title: '成功',
        body: '恢复成功！请重启启动器以生效',
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: '错误',
        body: `恢复失败: ${result?.error || '未知错误'}`,
        type: 'error'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `恢复失败: ${e.message}`,
      type: 'error'
    })
  } finally {
    isWorkingBackup.value = false
  }
}

async function listBackups() {
  try {
    const list = await window.electronAPI?.backup?.list()
    backupFiles.value = list || []
  } catch (e: any) {
    console.warn('列出备份失败:', e)
  }
}

async function deleteBackup(fileName: string) {
  if (!confirm(`确定删除备份文件 ${fileName} 吗？`)) return
  try {
    await window.electronAPI?.backup?.delete(fileName)
    await listBackups()
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `删除失败: ${e.message}`,
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
      title: '调试模式',
      body: s.debugMode ? '已开启调试模式，重启后生效' : '已关闭调试模式',
      type: 'info'
    })
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `设置日志级别失败: ${e.message}`,
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
        title: '导出成功',
        body: `诊断日志已保存到: ${result.path}`,
        type: 'success'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: '导出失败',
        body: result?.error || '未知错误',
        type: 'error'
      })
    }
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `导出诊断日志失败: ${e.message}`,
      type: 'error'
    })
  } finally {
    isExportingDiagnostics.value = false
  }
}

// ====== 更新检查 ======
async function checkForUpdate() {
  try {
    updateStatus.value.checking = true
    updateStatus.value.error = null
    await window.electronAPI?.updater?.check()
  } catch (e: any) {
    updateStatus.value.checking = false
    updateStatus.value.error = e.message
  }
}

async function checkForUpdateDownload() {
  try {
    await window.electronAPI?.updater?.download()
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `下载失败: ${e.message}`,
      type: 'error'
    })
  }
}

async function installUpdate() {
  try {
    await window.electronAPI?.updater?.install()
  } catch (e: any) {
    window.electronAPI?.notification?.send({
      title: '错误',
      body: `安装失败: ${e.message}`,
      type: 'error'
    })
  }
}

function setupUpdateListener() {
  const unsub = window.electronAPI?.updater?.onStatusChange((status: any) => {
    updateStatus.value = {
      checking: status.checking,
      available: status.available,
      downloading: status.downloading,
      downloadProgress: status.downloadProgress,
      downloaded: status.downloaded,
      error: status.error,
      version: status.version,
      releaseNotes: status.releaseNotes
    }
  })
  return unsub
}

// P2 初始化
onMounted(async () => {
  // 先恢复主题色（避免等待异步操作）
  const savedColor = localStorage.getItem('voxver_themeColor')
  if (savedColor && /^#[0-9a-f]{6}$/i.test(savedColor)) {
    s.themeColor = savedColor
  }

  await loadHotkeys()
  await listBackups()
  setupUpdateListener()
})

// ====== 应用版本 ======
const appVersion = ref('Alpha')

onMounted(async () => {
  try {
    const v = await window.electronAPI?.app?.getVersion?.()
    if (v) appVersion.value = v
  } catch { /* fallback to Alpha */ }
})

// ====== 开发者选项辅助函数 ======
function openDevTools() {
  window.electronAPI?.devTools?.open?.()
}

function copyEmail() {
  const email = 'voxver@example.com'
  navigator.clipboard.writeText(email).then(() => {
    window.electronAPI?.notification?.send({
      title: '已复制',
      body: '邮箱已复制到剪贴板',
      type: 'info'
    })
  })
}

function openSponsorLink() {
  window.electronAPI?.shell?.openExternal?.('https://example.com/sponsor')
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

  // 渐变色和阴影
  const darker = mixColor(rgb, { r: 0, g: 0, b: 0 }, 0.2)
  root.style.setProperty('--voxver-gradient-primary', `linear-gradient(135deg, ${hex}, ${darker})`)
  root.style.setProperty('--voxver-shadow-glow-primary', `0 4px 20px rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`)
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
    '--voxver-primary-light': `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`,
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
.settings-page {
  padding: 20px 28px;
  overflow-y: auto;
  height: 100%;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;
  }
}

/* ---- 区块 ---- */
.sec {
  margin-bottom: 28px;

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
      color: var(--voxver-text-muted, #888);
      transition: transform 0.2s ease;
      &.open {
        transform: rotate(180deg);
      }
    }
  }
}

/* ---- 表单行 ---- */
.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;

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
    font-size: 11.5px;
    color: var(--voxver-text-muted);
    line-height: 1.4;
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

/* ---- 输入控件 ---- */
.inp {
  padding: 8px 12px;
  border: 1.5px solid var(--voxver-border-color);
  border-radius: 7px;
  font-size: 13px;
  color: var(--voxver-text-primary);
  background: var(--voxver-bg-elevated);
  outline: none;
  transition: all 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.08);
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
  border: 1.5px solid var(--voxver-border-color);
  border-radius: 7px;
  font-size: 13px;
  color: var(--voxver-text-primary);
  background: var(--voxver-bg-elevated)
    url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b6f9a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: all 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.08);
  }
}

.textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid var(--voxver-border-color);
  border-radius: 7px;
  font-size: 12.5px;
  font-family: 'Consolas', 'Courier New', monospace;
  color: var(--voxver-text-primary);
  background: var(--voxver-bg-elevated);
  outline: none;
  resize: vertical;
  min-height: 56px;
  transition: all 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.08);
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
  border: 1.5px solid var(--voxver-border-color);
  border-radius: 7px;
  background: var(--voxver-bg-elevated);
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
  background: var(--voxver-bg-elevated);
  border-radius: 6px;
  margin-bottom: 4px;
  border: 1px solid var(--voxver-border-color);
}

.java-info {
  font-size: 13px;
  color: var(--voxver-text-primary);
  font-weight: 500;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Progress styles
.java-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--voxver-bg-elevated);
  border-radius: 8px;
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
  background: linear-gradient(90deg, var(--voxver-primary), #42a5f5);
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
  font-weight: 500;
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
  background: var(--voxver-bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--voxver-border-color);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--voxver-primary);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
}

.java-item-default {
  border-color: var(--voxver-primary);
  background: rgba(99, 102, 241, 0.05);
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
  background: var(--voxver-bg-primary);
  border-radius: 8px;
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
  border-radius: 4px;
  font-weight: 500;
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
  background: rgba(239, 68, 68, 0.05);
  border: 1px dashed rgba(239, 68, 68, 0.3);
  border-radius: 8px;
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
  border: 1.5px solid var(--voxver-border-color);
  border-radius: 7px;
  background: var(--voxver-bg-elevated);
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
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
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
  background: var(--voxver-bg-primary);
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--voxver-primary), #42a5f5);
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
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
  border: 1.5px solid var(--voxver-border-color);
  background: var(--voxver-bg-elevated);
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);

  &:hover {
    transform: scale(1.12);
  }
  &.active {
    border-color: var(--voxver-text-primary);
    box-shadow:
      0 0 0 2px #fff,
      0 0 0 4px var(--voxver-text-primary);
  }
}

/* ---- 功能隐藏表格 ---- */
.sec-desc {
  font-size: 12px;
  color: var(--voxver-text-muted, #888);
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
    color: var(--voxver-text-muted, #888);
    pointer-events: none;
  }

  .search-box-input {
    width: 100%;
    padding: 9px 12px 9px 36px;
    border: 1px solid color-mix(in oklab, var(--voxver-text-primary) 12%, transparent);
    border-radius: 8px;
    background: color-mix(in oklab, var(--voxver-text-primary) 4%, transparent);
    color: var(--voxver-text-primary);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;

    &::placeholder {
      color: var(--voxver-text-muted, #888);
    }

    &:focus {
      border-color: var(--voxver-accent);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--voxver-accent) 20%, transparent);
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
  border-radius: 10px;
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
  border-radius: 8px;
  background: color-mix(in oklab, var(--voxver-accent) 12%, transparent);
  color: var(--voxver-accent);
}

.quick-grid-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}

.quick-grid-desc {
  display: block;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--voxver-text-muted, #888);
  line-height: 1.4;
  margin-top: 2px;
}

.quick-grid-arrow {
  flex-shrink: 0;
  color: var(--voxver-text-muted, #888);
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
    border-radius: 8px;
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
    background: var(--voxver-bg-primary);
  }

  &.hidden .feat-name {
    color: var(--voxver-text-muted, #aaa);
    text-decoration: line-through;
    opacity: 0.6;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.55;
    .feat-name {
      color: var(--voxver-text-muted, #aaa);
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
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #b45309;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  svg {
    flex-shrink: 0;
    color: #f59e0b;
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
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: var(--voxver-bg-primary);
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
  border: 1.5px solid var(--voxver-border-color);
  border-radius: 7px;
  background: var(--voxver-bg-elevated);
  font-size: 12.5px;
  font-weight: 500;
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

  &.outline:hover {
    background: rgba(21, 101, 192, 0.04);
  }

  &.danger {
    border-color: rgba(229, 57, 53, 0.4);
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
  border-radius: 5px;
}

/* ---- 关于卡片 ---- */
.about-card {
  text-align: center;
  padding: 28px 24px;
  background: var(--voxver-bg-primary);
  border-radius: 10px;
  border: 1px solid var(--voxver-border-color-light);

  .about-logo {
    width: 72px;
    height: 72px;
    margin: 0 auto 12px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(21, 101, 192, 0.2);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .about-name {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 700;
  }
  .about-ver {
    margin: 0 0 14px;
    font-size: 12px;
    color: var(--voxver-text-muted);
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
  }
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
  background: color-mix(in oklab, var(--voxver-accent) 14%, transparent);
  color: var(--voxver-accent);
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
  color: var(--voxver-text-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.12s;
  cursor: pointer;

  &:hover {
    background: color-mix(in oklab, var(--voxver-accent) 8%, transparent);
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
  text-align: center;
  padding: 32px 24px;
  background: var(--voxver-bg-primary);
  border-radius: 10px;
  border: 1px solid var(--voxver-border-color-light);

  .copyright-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: color-mix(in oklab, var(--voxver-accent) 10%, transparent);
    color: var(--voxver-accent);
    opacity: 0.7;
  }

  .copyright-text {
    font-size: 12.5px;
    line-height: 1.8;
    color: var(--voxver-text-secondary);
    margin: 0 0 8px;
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;

    &:last-of-type {
      margin-bottom: 0;
    }
  }
}

/* ---- 项目协议卡片 ---- */
.license-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--voxver-bg-primary);
  border-radius: 10px;
  border: 1px solid var(--voxver-border-color-light);

  .license-badge {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: color-mix(in oklab, var(--voxver-accent) 14%, transparent);
    color: var(--voxver-accent);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .license-info {
    flex: 1;
    min-width: 0;
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
  gap: 2px;
}

.oss-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 8px;
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
    font-weight: 500;
  }

  .oss-version {
    font-size: 11px;
    color: var(--voxver-text-muted);
    background: color-mix(in oklab, var(--voxver-text-primary) 6%, transparent);
    padding: 1px 8px;
    border-radius: 4px;
  }

  .oss-license {
    font-size: 11.5px;
    color: var(--voxver-text-muted);
    padding: 2px 10px;
    border-radius: 4px;
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
}

.coming-soon-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in oklab, var(--voxver-accent) 10%, transparent);
  color: var(--voxver-accent);
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
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
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
  background: rgba(251, 140, 0, 0.1);
  border: 1px solid rgba(251, 140, 0, 0.3);
  border-radius: 7px;
  font-size: 12px;
  color: #b85c00;
  margin-bottom: 12px;

  svg {
    flex-shrink: 0;
    color: #fb8c00;
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
  background: color-mix(in oklab, var(--voxver-text, #fff) 4%, transparent);
  border-radius: 8px;
  padding: 12px 16px;
}
.debug-mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  background: color-mix(in oklab, var(--voxver-text, #fff) 4%, transparent);
  border-radius: 8px;
  padding: 12px 16px;
}
.debug-mode-info {
  flex: 1;
  min-width: 0;
}
.debug-mode-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text, #e0e0e0);
}
.debug-mode-desc {
  font-size: 11px;
  color: var(--voxver-text-muted, #888);
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
  background: var(--voxver-border-color, #555);
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
  background: var(--voxver-accent, #42b883);
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
  background: color-mix(in oklab, var(--voxver-text, #fff) 4%, transparent);
  border-radius: 8px;
  padding: 12px 16px;
}
.java-alloc-card {
  background: color-mix(in oklab, var(--voxver-text, #fff) 4%, transparent);
  border-radius: 8px;
  padding: 16px;
}

/* ---- FAQ ---- */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.faq-item {
  background: color-mix(in oklab, var(--voxver-text, #fff) 3%, transparent);
  border-radius: 6px;
  padding: 10px 14px;
}
.faq-question {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text, #e0e0e0);
  margin-bottom: 4px;
}
.faq-answer {
  font-size: 12px;
  line-height: 1.5;
  color: var(--voxver-text-muted, #888);
}

/* ---- 反馈卡片 ---- */
.feedback-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.feedback-card {
  background: color-mix(in oklab, var(--voxver-text, #fff) 3%, transparent);
  border-radius: 8px;
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
  color: var(--voxver-text, #e0e0e0);
}
.feedback-card-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--voxver-text-muted, #888);
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
  color: var(--voxver-text-secondary, #aaa);
}
.radio-item-k input {
  accent-color: var(--voxver-accent, #6c5ce7);
}
.radio-item-k.active {
   color: var(--voxver-accent, #6c5ce7);
   font-weight: 600;
 }
.mem-custom-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in oklab, var(--voxver-text, #fff) 10%, transparent);
}
.mem-custom-label {
  font-size: 13px;
  color: var(--voxver-text-secondary, #aaa);
}
.mem-slider-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mem-slider {
  flex: 1;
  height: 4px;
  accent-color: var(--voxver-accent, #6c5ce7);
  cursor: pointer;
}
.mem-slider-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text, #fff);
  min-width: 52px;
  text-align: right;
  white-space: nowrap;
}
.mem-slider-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--voxver-text-muted, #666);
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
    font-weight: 500;
  }
  &:hover:not(.active) {
    color: var(--voxver-text-primary);
  }
}

.skin-radio-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--voxver-border-color);
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
  border-radius: 6px;
  background: var(--voxver-bg-elevated);
  color: var(--voxver-text-primary);
  cursor: pointer;
  transition:
    border-color 0.13s,
    background 0.13s;

  &:hover {
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
    background: rgba(21, 101, 192, 0.05);
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
  background: var(--voxver-bg-primary);
  border-radius: 7px;
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
  background: var(--voxver-bg-elevated);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--voxver-primary, #6366f1), var(--voxver-primary));
  transition: width 0.2s ease;
  border-radius: 4px;
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
  border-color: rgba(229, 57, 53, 0.3);
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
  background: var(--voxver-bg-primary);
  border-radius: 7px;
  margin-bottom: 6px;
  border: 1px solid var(--voxver-border-color-light);
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-size: 13px;
  font-weight: 500;
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
  background: var(--voxver-bg-primary);
  border-radius: 8px;
  border: 1px solid var(--voxver-border-color-light);

  &.checking {
    border-color: var(--voxver-primary);
    background: rgba(21, 101, 192, 0.05);
  }

  &.available {
    border-color: var(--voxver-green);
    background: rgba(46, 125, 50, 0.05);
  }

  &.error {
    border-color: var(--voxver-error);
    background: rgba(229, 57, 53, 0.05);
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
</style>