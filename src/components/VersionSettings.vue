<template>
  <Teleport to="body" :disabled="inline">
    <transition name="modal-fade">
      <div
        v-if="inline || visible"
        :class="[inline ? 'ver-settings-embed' : 'ver-settings-overlay', { 'is-kor': isKoring }]"
        @click.self="inline ? undefined : close()"
      >
        <div class="ver-settings-window" :class="{ 'is-inline': inline, 'is-kor': isKoring }">
          <!-- 标题栏 -->
          <header class="vs-header">
            <button class="vs-back" :title="inline ? $t('common.back') : undefined" @click="goBack">
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
              <span v-if="inline" class="vs-back__label">{{ $t('common.back') }}</span>
            </button>
            <span class="vs-title">{{ $t('version.settings.title', { name: versionName }) }}</span>
            <div v-if="!inline" class="vs-wc">
              <button class="vs-wc-btn" @click="close">
                <svg width="10" height="1" viewBox="0 0 10 1">
                  <rect width="10" height="1" fill="currentColor" />
                </svg>
              </button>
              <button class="vs-wc-btn vs-close" @click="close">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
                </svg>
              </button>
            </div>
          </header>

          <!-- 主体 -->
          <div class="vs-body">
            <!-- 左侧导航 -->
            <nav class="vs-nav" :class="{ 'is-kor': isKoring }">
              <template v-if="!isKoring">
                <button
                  v-for="item in navItems"
                  :key="item.id"
                  class="vs-nav-item"
                  :class="{ active: activeTab === item.id }"
                  @click="activeTab = item.id"
                >
                  <span v-html="item.icon"></span>
                  {{ item.label }}
                </button>
              </template>
              <template v-else>
                <KorSettingListItem
                  v-for="item in navItems"
                  :key="item.id"
                  class="vs-kor-nav-item"
                  :label="item.label"
                  :active="activeTab === item.id"
                  :arrow="false"
                  @click="activeTab = item.id"
                >
                  <template #icon>
                    <span class="vs-kor-nav-icon" v-html="item.icon"></span>
                  </template>
                </KorSettingListItem>
              </template>
            </nav>

            <!-- 右侧内容 -->
            <main class="vs-content">
              <!-- ===== 概览 ===== -->
              <template v-if="activeTab === 'overview' && !isKoring">
                <!-- 版本信息卡片 -->
                <div class="ver-info-card">
                  <div class="ver-icon">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--voxver-accent)"
                      stroke-width="1.5"
                    >
                      <path
                        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                      />
                    </svg>
                  </div>
                  <div class="ver-detail">
                    <p class="ver-full-name">{{ versionName }}</p>
                    <p class="ver-sub">
                      {{
                        $t('version.settings.genuineInfo', {
                          base: versionBase,
                          loader: loaderInfo
                        })
                      }}
                    </p>
                  </div>
                </div>

                <!-- 个性化 -->
                <section class="vs-section">
                  <h3 class="sec-title">{{ $t('version.settings.personalized') }}</h3>
                  <div class="form-row">
                    <label>{{ $t('version.settings.icon') }}</label>
                    <select class="form-select">
                      <option>{{ $t('version.settings.iconAuto') }}</option>
                      <option>{{ $t('version.settings.iconGrassBlock') }}</option>
                      <option>{{ $t('version.settings.iconCreeper') }}</option>
                      <option>{{ $t('version.settings.iconCustom') }}</option>
                    </select>
                  </div>
                  <div class="form-row">
                    <label>{{ $t('version.settings.category') }}</label>
                    <select class="form-select">
                      <option>{{ $t('version.settings.categoryAuto') }}</option>
                      <option>{{ $t('version.settings.categoryVanilla') }}</option>
                      <option>Modded</option>
                      <option>{{ $t('version.settings.categoryModpack') }}</option>
                    </select>
                  </div>
                  <div class="form-btns">
                    <button class="form-action-btn" @click="editVersionName">
                      {{ $t('version.settings.editVersionName') }}
                    </button>
                    <button class="form-action-btn" @click="editVersionDescription">
                      {{ $t('version.settings.editVersionDescription') }}
                    </button>
                    <button
                      class="form-action-btn"
                      :class="{ active: isFavorited }"
                      @click="toggleFavorite"
                    >
                      {{
                        isFavorited
                          ? $t('version.settings.removeFavorite')
                          : $t('version.settings.addFavorite')
                      }}
                    </button>
                  </div>
                </section>

                <!-- 快捷方式 -->
                <section class="vs-section">
                  <h3 class="sec-title">{{ $t('version.settings.shortcuts') }}</h3>
                  <div class="form-btns">
                    <button class="form-action-btn" @click="openFolder('')">
                      {{ $t('version.settings.versionFiles') }}
                    </button>
                    <button class="form-action-btn" @click="openFolder('saves')">
                      {{ $t('version.settings.saveFiles') }}
                    </button>
                    <button class="form-action-btn" @click="openFolder('mods')">
                      {{ $t('version.settings.modFiles') }}
                    </button>
                  </div>
                </section>

                <!-- 高级管理 -->
                <section class="vs-section">
                  <h3 class="sec-title">{{ $t('version.settings.advancedManagement') }}</h3>
                  <div class="form-btns">
                    <button class="form-action-btn outline" @click="exportScript">
                      {{ $t('version.settings.exportLaunchScript') }}
                    </button>
                    <button class="form-action-btn outline" @click="completeFiles">
                      {{ $t('version.settings.completeFiles') }}
                    </button>
                    <button class="form-action-btn danger" @click="deleteVersion">
                      {{ $t('version.settings.deleteVersion') }}
                    </button>
                  </div>
                </section>
              </template>

              <!-- ===== 概览（Koring 排版） ===== -->
              <template v-else-if="activeTab === 'overview'">
                <div class="vs-kor-page">
                  <KorSurface class="vs-kor-hero">
                    <div class="vs-kor-hero__icon">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                      >
                        <path
                          d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                        />
                      </svg>
                    </div>
                    <div class="vs-kor-hero__body">
                      <p class="vs-kor-hero__name">{{ versionName }}</p>
                      <p class="vs-kor-hero__desc">
                        {{
                          $t('version.settings.genuineInfo', {
                            base: versionBase,
                            loader: loaderInfo
                          })
                        }}
                      </p>
                    </div>
                    <KorBadge v-if="isFavorited" class="vs-kor-hero__badge">★</KorBadge>
                  </KorSurface>

                  <KorSectionTitle>{{ $t('version.settings.personalized') }}</KorSectionTitle>
                  <KorSettingCard>
                    <KorSettingRow :label="$t('version.settings.icon')">
                      <KorSelect v-model="korIconChoice" :options="korIconOptions" :width="200" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.category')">
                      <KorSelect
                        v-model="korCategoryChoice"
                        :options="korCategoryOptions"
                        :width="200"
                      />
                    </KorSettingRow>
                    <div class="vs-kor-actions">
                      <KorButton size="sm" @click="editVersionName">
                        {{ $t('version.settings.editVersionName') }}
                      </KorButton>
                      <KorButton size="sm" @click="editVersionDescription">
                        {{ $t('version.settings.editVersionDescription') }}
                      </KorButton>
                      <KorButton
                        size="sm"
                        :variant="isFavorited ? 'primary' : 'outline'"
                        @click="toggleFavorite"
                      >
                        {{
                          isFavorited
                            ? $t('version.settings.removeFavorite')
                            : $t('version.settings.addFavorite')
                        }}
                      </KorButton>
                    </div>
                  </KorSettingCard>

                  <KorSectionTitle>{{ $t('version.settings.shortcuts') }}</KorSectionTitle>
                  <KorSettingCard>
                    <div class="vs-kor-actions">
                      <KorButton size="sm" @click="openFolder('')">
                        {{ $t('version.settings.versionFiles') }}
                      </KorButton>
                      <KorButton size="sm" @click="openFolder('saves')">
                        {{ $t('version.settings.saveFiles') }}
                      </KorButton>
                      <KorButton size="sm" @click="openFolder('mods')">
                        {{ $t('version.settings.modFiles') }}
                      </KorButton>
                    </div>
                  </KorSettingCard>

                  <KorSectionTitle>{{ $t('version.settings.advancedManagement') }}</KorSectionTitle>
                  <KorSettingCard>
                    <div class="vs-kor-actions">
                      <KorButton size="sm" @click="exportScript">
                        {{ $t('version.settings.exportLaunchScript') }}
                      </KorButton>
                      <KorButton size="sm" @click="completeFiles">
                        {{ $t('version.settings.completeFiles') }}
                      </KorButton>
                      <KorButton size="sm" variant="danger" @click="deleteVersion">
                        {{ $t('version.settings.deleteVersion') }}
                      </KorButton>
                    </div>
                  </KorSettingCard>
                </div>
              </template>

              <!-- ===== 设置 ===== -->
              <template v-if="activeTab === 'settings' && !isKoring">
                <!-- 提示 -->
                <div class="vs-tip-bar">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  {{ $t('version.settings.settingsTip') }}
                  <button class="tip-close" @click="showTip = false">×</button>
                </div>

                <section class="vs-section">
                  <h3 class="sec-title">{{ $t('version.settings.launchOptions') }}</h3>
                  <div class="form-row">
                    <label>{{ $t('version.settings.versionIsolationLabel') }}</label>
                    <select class="form-select" v-model="settingsForm.versionIsolation">
                      <option value="enabled">{{ $t('version.settings.enabledBtn') }}</option>
                      <option value="disabled">{{ $t('version.settings.disabledBtn') }}</option>
                    </select>
                  </div>
                  <div class="form-row">
                    <label>{{ $t('version.settings.gameWindowTitle') }}</label>
                    <input
                      type="text"
                      class="form-input"
                      v-model="settingsForm.gameWindowTitle"
                      :placeholder="$t('version.settings.followGlobal')"
                    />
                  </div>
                  <div class="form-row">
                    <label>{{ $t('version.settings.customPath') }}</label>
                    <input
                      type="text"
                      class="form-input"
                      v-model="settingsForm.customPath"
                      :placeholder="$t('version.settings.followGlobal')"
                    />
                  </div>
                  <div class="form-row">
                    <label>{{ $t('version.settings.gameJavaLabel') }}</label>
                    <select class="form-select" v-model="settingsForm.javaPath">
                      <option value="follow-global">
                        {{ $t('version.settings.followGlobal') }}
                      </option>
                      <option value="java17">{{ $t('version.settings.java17') }}</option>
                      <option value="java21">{{ $t('version.settings.java21') }}</option>
                      <option value="custom">{{ $t('version.settings.customPath') }}</option>
                    </select>
                  </div>
                </section>

                <section class="vs-section">
                  <h3 class="sec-title">{{ $t('version.settings.memoryAllocation') }}</h3>
                  <div class="mem-options">
                    <label class="radio-item" :class="{ active: memMode === 'global' }">
                      <input type="radio" name="mem" value="global" v-model="memMode" />
                      {{ $t('version.settings.followGlobal') }}
                    </label>
                    <label class="radio-item" :class="{ active: memMode === 'auto' }">
                      <input type="radio" name="mem" value="auto" v-model="memMode" />
                      {{ $t('version.settings.autoConfig') }}
                    </label>
                    <label class="radio-item" :class="{ active: memMode === 'custom' }">
                      <input type="radio" name="mem" value="custom" v-model="memMode" />
                      {{ $t('version.settings.customConfig') }}
                    </label>
                  </div>

                  <!-- 滑块（自定义模式显示） -->
                  <div v-if="memMode === 'custom'" class="slider-area">
                    <input
                      type="range"
                      class="mem-slider"
                      min="512"
                      max="16384"
                      step="256"
                      v-model="memCustom"
                    />
                  </div>

                  <div v-if="memMode !== 'global'" class="form-row" style="margin-top: 10px">
                    <label>{{ $t('version.settings.memOptimize') }}</label>
                    <select class="form-select short-select" v-model="settingsForm.memOptimize">
                      <option value="follow-global">
                        {{ $t('version.settings.followGlobal') }}
                      </option>
                      <option value="enabled">{{ $t('version.settings.enabledBtn') }}</option>
                      <option value="disabled">{{ $t('version.settings.disabledBtn') }}</option>
                    </select>
                  </div>

                  <div class="mem-stats">
                    <div class="mem-stat">
                      <span class="mem-stat-label">{{ $t('version.settings.usedMemory') }}</span>
                      <span class="mem-stat-value">{{ usedMem }} GB / {{ totalMem }} GB</span>
                    </div>
                    <div class="mem-stat">
                      <span class="mem-stat-label">{{
                        $t('version.settings.gameAllocation')
                      }}</span>
                      <span class="mem-stat-value">{{ gameMem }} GB</span>
                    </div>
                  </div>
                </section>

                <section class="vs-section">
                  <h3 class="sec-title">{{ $t('version.settings.serviceLogin') }}</h3>
                  <div class="form-row">
                    <label>{{ $t('version.settings.loginMethod') }}</label>
                    <select class="form-select" v-model="settingsForm.loginMethod">
                      <option value="official-or-offline">
                        {{ $t('version.settings.officialOrOffline') }}
                      </option>
                      <option value="official-only">
                        {{ $t('version.settings.officialOnly') }}
                      </option>
                      <option value="offline-only">{{ $t('version.settings.offlineOnly') }}</option>
                    </select>
                  </div>
                  <div class="form-row">
                    <label>{{ $t('version.settings.autoJoinServer') }}</label>
                    <input
                      type="text"
                      class="form-input"
                      v-model="settingsForm.autoJoinServer"
                      :placeholder="$t('version.settings.serverAddressOptional')"
                    />
                  </div>
                </section>

                <section class="vs-section collapsible" :class="{ collapsed: !showAdvanced }">
                  <h3 class="sec-title clickable" @click="showAdvanced = !showAdvanced">
                    {{ $t('version.settings.advancedOptions') }}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      :style="{ transform: showAdvanced ? 'rotate(180deg)' : '' }"
                      style="transition: transform 0.2s"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </h3>
                  <div v-show="showAdvanced" class="adv-content">
                    <div class="form-row">
                      <label>{{ $t('version.settings.jvmArgsLabel') }}</label>
                      <textarea
                        class="form-textarea"
                        rows="2"
                        v-model="settingsForm.jvmArgs"
                        :placeholder="$t('version.settings.followGlobal')"
                      ></textarea>
                    </div>
                    <div class="form-row">
                      <label>{{ $t('version.settings.gameArgsLabel') }}</label>
                      <input
                        type="text"
                        class="form-input"
                        v-model="settingsForm.gameArgs"
                        :placeholder="$t('version.settings.followGlobal')"
                      />
                    </div>
                    <div class="form-row">
                      <label>{{ $t('version.settings.memoryMgmtLabel') }}</label>
                      <select class="form-select" v-model="settingsForm.gcSelection">
                        <option value="follow-global">
                          {{ $t('version.settings.followGlobal') }}
                        </option>
                        <option value="g1gc">G1GC</option>
                        <option value="zgc">ZGC</option>
                        <option value="parallel">Parallel GC</option>
                      </select>
                    </div>
                    <div class="form-row">
                      <label>{{ $t('version.settings.preLaunchCmdLabel') }}</label>
                      <input
                        type="text"
                        class="form-input"
                        v-model="settingsForm.preLaunchCmd"
                        placeholder=""
                      />
                    </div>
                    <div class="checkbox-group">
                      <label class="checkbox-label"
                        ><input type="checkbox" v-model="settingsForm.disableModUpdate" />
                        {{ $t('version.settings.disableModUpdate') }}</label
                      >
                      <label class="checkbox-label"
                        ><input type="checkbox" v-model="settingsForm.ignoreJavaWarning" />
                        {{ $t('version.settings.ignoreJavaWarning') }}</label
                      >
                      <label class="checkbox-label"
                        ><input type="checkbox" v-model="settingsForm.disableFileCheck" />
                        {{ $t('version.settings.disableFileCheck') }}</label
                      >
                      <label class="checkbox-label"
                        ><input type="checkbox" v-model="settingsForm.disableJavaWrapper" />
                        {{ $t('version.settings.disableJavaWrapper') }}</label
                      >
                      <label class="checkbox-label"
                        ><input type="checkbox" v-model="settingsForm.disableLwjglAgent" />
                        {{ $t('version.settings.disableLwjglAgent') }}</label
                      >
                      <label class="checkbox-label"
                        ><input type="checkbox" v-model="useHighPerformanceGPU" />
                        {{ $t('version.settings.useHighPerfGPU') }}</label
                      >
                    </div>
                  </div>
                </section>

                <!-- 保存按钮 -->
                <button
                  class="vox-btn vox-btn--primary btn-save-settings"
                  @click="saveSettings"
                  :disabled="settingsSaving"
                >
                  <template v-if="settingsSaving">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="spin-icon"
                    >
                      <path
                        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      />
                    </svg>
                  </template>
                  <template v-else-if="settingsSaveStatus === 'success'">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </template>
                  <template v-else-if="settingsSaveStatus === 'error'">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </template>
                  <template v-else>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17,21 17,13 7,13 7,21" />
                      <polyline points="7,3 7,8 15,8" />
                    </svg>
                  </template>
                  {{
                    settingsSaving
                      ? $t('version.settings.saving')
                      : $t('version.settings.saveSettings')
                  }}
                </button>

                <!-- 底部按钮 -->
                <button class="btn-global-settings" @click="$router.push('/settings')">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {{ $t('version.settings.globalSettingsBtn') }}
                </button>
              </template>

              <!-- ===== 设置（Koring 排版） ===== -->
              <template v-else-if="activeTab === 'settings'">
                <div class="vs-kor-page">
                  <KorSurface v-if="showTip" class="vs-kor-tip">
                    <span class="vs-kor-tip__text">{{ $t('version.settings.settingsTip') }}</span>
                    <button type="button" class="vs-kor-tip__close" @click="showTip = false">×</button>
                  </KorSurface>

                  <KorSectionTitle>{{ $t('version.settings.launchOptions') }}</KorSectionTitle>
                  <KorSettingCard>
                    <KorSettingRow :label="$t('version.settings.versionIsolationLabel')">
                      <KorSelect
                        v-model="settingsForm.versionIsolation"
                        :options="korIsolationOptions"
                        :width="180"
                      />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.gameWindowTitle')">
                      <KorInput
                        v-model="settingsForm.gameWindowTitle"
                        :placeholder="$t('version.settings.followGlobal')"
                        class="vs-kor-input"
                      />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.customPath')">
                      <KorInput
                        v-model="settingsForm.customPath"
                        :placeholder="$t('version.settings.followGlobal')"
                        class="vs-kor-input"
                      />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.gameJavaLabel')">
                      <KorSelect
                        v-model="settingsForm.javaPath"
                        :options="korJavaOptions"
                        :width="200"
                      />
                    </KorSettingRow>
                  </KorSettingCard>

                  <KorSectionTitle>{{ $t('version.settings.memoryAllocation') }}</KorSectionTitle>
                  <KorSettingCard>
                    <KorSettingRow :label="$t('version.settings.memoryAllocation')">
                      <KorSettingRadioGroup
                        v-model="memMode"
                        :options="korMemModeOptions"
                        inline
                      />
                    </KorSettingRow>
                    <KorSettingRow
                      v-if="memMode === 'custom'"
                      :label="$t('version.settings.customConfig')"
                      desc="512 MB – 16384 MB"
                    >
                      <div class="kor-inline">
                        <KorSlider
                          v-model="memCustomMb"
                          :min="512"
                          :max="16384"
                          :step="256"
                          :width="190"
                        />
                        <span class="kor-value">{{ memCustomGB }} GB</span>
                      </div>
                    </KorSettingRow>
                    <KorSettingRow
                      v-if="memMode !== 'global'"
                      :label="$t('version.settings.memOptimize')"
                    >
                      <KorSelect
                        v-model="settingsForm.memOptimize"
                        :options="korMemOptimizeOptions"
                        :width="180"
                      />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.usedMemory')">
                      <span class="kor-value">{{ usedMem }} GB / {{ totalMem }} GB</span>
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.gameAllocation')">
                      <span class="kor-value">{{ gameMem }} GB</span>
                    </KorSettingRow>
                  </KorSettingCard>

                  <KorSectionTitle>{{ $t('version.settings.serviceLogin') }}</KorSectionTitle>
                  <KorSettingCard>
                    <KorSettingRow :label="$t('version.settings.loginMethod')">
                      <KorSelect
                        v-model="settingsForm.loginMethod"
                        :options="korLoginOptions"
                        :width="220"
                      />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.autoJoinServer')">
                      <KorInput
                        v-model="settingsForm.autoJoinServer"
                        :placeholder="$t('version.settings.serverAddressOptional')"
                        class="vs-kor-input"
                      />
                    </KorSettingRow>
                  </KorSettingCard>

                  <KorSectionTitle>
                    <button
                      type="button"
                      class="vs-kor-collapse"
                      :class="{ 'is-open': showAdvanced }"
                      @click="showAdvanced = !showAdvanced"
                    >
                      <span>{{ $t('version.settings.advancedOptions') }}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </KorSectionTitle>
                  <KorSettingCard v-show="showAdvanced">
                    <KorSettingRow :label="$t('version.settings.jvmArgsLabel')">
                      <textarea
                        v-model="settingsForm.jvmArgs"
                        rows="2"
                        class="vs-kor-textarea"
                        :placeholder="$t('version.settings.followGlobal')"
                      ></textarea>
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.gameArgsLabel')">
                      <KorInput
                        v-model="settingsForm.gameArgs"
                        :placeholder="$t('version.settings.followGlobal')"
                        class="vs-kor-input"
                      />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.memoryMgmtLabel')">
                      <KorSelect
                        v-model="settingsForm.gcSelection"
                        :options="korGcOptions"
                        :width="200"
                      />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.preLaunchCmdLabel')">
                      <KorInput v-model="settingsForm.preLaunchCmd" class="vs-kor-input" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.disableModUpdate')">
                      <KorSwitch v-model="settingsForm.disableModUpdate" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.ignoreJavaWarning')">
                      <KorSwitch v-model="settingsForm.ignoreJavaWarning" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.disableFileCheck')">
                      <KorSwitch v-model="settingsForm.disableFileCheck" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.disableJavaWrapper')">
                      <KorSwitch v-model="settingsForm.disableJavaWrapper" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.disableLwjglAgent')">
                      <KorSwitch v-model="settingsForm.disableLwjglAgent" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.useHighPerfGPU')">
                      <KorSwitch v-model="useHighPerformanceGPU" />
                    </KorSettingRow>
                  </KorSettingCard>

                  <div class="vs-kor-save">
                    <KorButton
                      variant="primary"
                      :loading="settingsSaving"
                      @click="saveSettings"
                    >
                      {{
                        settingsSaving
                          ? $t('version.settings.saving')
                          : $t('version.settings.saveSettings')
                      }}
                    </KorButton>
                    <span
                      v-if="settingsSaveStatus === 'success'"
                      class="vs-kor-save__status is-ok"
                      >✓</span
                    >
                    <span v-else-if="settingsSaveStatus === 'error'" class="vs-kor-save__status is-err"
                      >×</span
                    >
                    <KorButton
                      variant="ghost"
                      size="sm"
                      class="vs-kor-save__global"
                      @click="$router.push('/settings')"
                    >
                      {{ $t('version.settings.globalSettingsBtn') }}
                    </KorButton>
                  </div>
                </div>
              </template>

              <!-- ===== Mod 管理 ===== -->
              <div v-show="activeTab === 'mods'" style="display: contents">
                <ModManager
                  :gameDir="gameDir"
                  :mcVersion="versionBase"
                  :loader="detectedLoader"
                  @navigate="close"
                />
              </div>

              <!-- ===== 导出 ===== -->
              <template v-if="activeTab === 'export' && !isKoring">
                <!-- 基础信息 -->
                <section class="vs-section">
                  <div class="export-header-row">
                    <div class="form-row compact">
                      <label>{{ $t('version.settings.modpackName') }}</label>
                      <input type="text" class="form-input" v-model="exportPackName" />
                    </div>
                    <div class="form-row compact">
                      <label>{{ $t('version.settings.modpackVersion') }}</label>
                      <input
                        type="text"
                        class="form-input short"
                        v-model="exportPackVersion"
                        style="flex: 0 0 120px"
                      />
                    </div>
                  </div>
                </section>

                <!-- 导出内容列表 -->
                <section class="vs-section export-list-section">
                  <h3 class="sec-title">
                    {{ $t('version.settings.exportContentList') }}
                    <span v-if="exportLoading" class="export-loading-hint">{{
                      $t('common.loading')
                    }}</span>
                  </h3>
                  <div class="export-tree">
                    <!-- 游戏本体 -->
                    <div class="tree-node">
                      <label class="tree-checkbox"
                        ><input type="checkbox" checked disabled /><span class="tree-label-bold">{{
                          $t('version.settings.gameCore')
                        }}</span
                        ><span class="tree-sub">{{ versionBase }} {{ loaderInfo }}</span></label
                      >
                    </div>
                    <!-- Mod -->
                    <div class="tree-node tree-parent">
                      <label class="tree-checkbox">
                        <input type="checkbox" v-model="exportOpts.includeMods" />
                        <span class="tree-label-bold">{{ $t('version.settings.modLabel') }}</span>
                        <span class="tree-sub">{{
                          $t('version.settings.modsCount', { n: exportMods.length })
                        }}</span>
                      </label>
                      <div class="tree-children" v-if="exportMods.length > 0">
                        <div
                          class="tree-child export-mod-item"
                          v-for="mod in exportMods"
                          :key="mod.fileName"
                        >
                          <label class="tree-checkbox export-mod-checkbox">
                            <input type="checkbox" checked disabled />
                            <img
                              v-if="mod.logoUrl"
                              :src="mod.logoUrl"
                              class="export-mod-icon"
                              alt=""
                              @error="
                                (e: Event) =>
                                  ((e.target as HTMLImageElement).style.display = 'none')
                              "
                            />
                            <span v-else class="export-mod-icon-default">{{
                              mod.name.slice(0, 1).toUpperCase()
                            }}</span>
                            <span class="export-mod-name">{{ mod.name }}</span>
                            <span class="export-mod-version">{{ mod.version }}</span>
                            <span v-if="!mod.enabled" class="mod-disabled-badge">{{
                              $t('version.settings.disabledBadge')
                            }}</span>
                          </label>
                        </div>
                      </div>
                      <div class="tree-children" v-else-if="!exportLoading">
                        <div class="tree-child">
                          <span class="tree-sub">{{ $t('version.settings.notFoundMod') }}</span>
                        </div>
                      </div>
                      <div class="tree-children">
                        <div class="tree-child">
                          <label class="tree-checkbox"
                            ><input
                              type="checkbox"
                              v-model="exportOpts.includeDisabledMods"
                            /><span>{{ $t('version.settings.disabledModsCheckbox') }}</span></label
                          >
                        </div>
                        <div class="tree-child">
                          <label class="tree-checkbox"
                            ><input
                              type="checkbox"
                              v-model="exportOpts.includeModConfigs"
                            /><span>{{ $t('version.settings.modConfigsCheckbox') }}</span></label
                          >
                        </div>
                      </div>
                    </div>
                    <!-- 资源包组 -->
                    <div class="tree-node tree-parent">
                      <label class="tree-checkbox">
                        <input type="checkbox" v-model="exportOpts.includeResourcePacks" />
                        <span class="tree-label-bold">{{
                          $t('version.settings.resourcePacksLabel')
                        }}</span>
                        <span class="tree-sub">{{
                          $t('version.settings.textureMaterials', { n: exportResourcePacks.length })
                        }}</span>
                      </label>
                      <div class="tree-children" v-if="exportResourcePacks.length > 0">
                        <div class="tree-child" v-for="rp in exportResourcePacks" :key="rp.name">
                          <label class="tree-checkbox"
                            ><input type="checkbox" checked /><span>{{ rp.name }}</span
                            ><span class="tree-sub">{{ formatFileSize(rp.size) }}</span></label
                          >
                        </div>
                      </div>
                      <div class="tree-children" v-else-if="!exportLoading">
                        <div class="tree-child">
                          <span class="tree-sub">{{
                            $t('version.settings.notFoundResourcePack')
                          }}</span>
                        </div>
                      </div>
                    </div>
                    <!-- 光影包组 -->
                    <div class="tree-node tree-parent">
                      <label class="tree-checkbox">
                        <input type="checkbox" v-model="exportOpts.includeShaderPacks" />
                        <span class="tree-label-bold">{{
                          $t('version.settings.shaderPacksLabel')
                        }}</span>
                        <span class="tree-sub">{{
                          $t('version.settings.shaderPacksCount', { n: exportShaderPacks.length })
                        }}</span>
                      </label>
                      <div class="tree-children" v-if="exportShaderPacks.length > 0">
                        <div class="tree-child" v-for="sp in exportShaderPacks" :key="sp.name">
                          <label class="tree-checkbox"
                            ><input type="checkbox" checked /><span>{{ sp.name }}</span
                            ><span class="tree-sub">{{ formatFileSize(sp.size) }}</span></label
                          >
                        </div>
                      </div>
                      <div class="tree-children" v-else-if="!exportLoading">
                        <div class="tree-child">
                          <span class="tree-sub">{{
                            $t('version.settings.notFoundShaderPack')
                          }}</span>
                        </div>
                      </div>
                    </div>
                    <!-- 其他可选项 -->
                    <div class="tree-node">
                      <label class="tree-checkbox"
                        ><input type="checkbox" v-model="exportOpts.includeSaves" /><span>{{
                          $t('version.settings.singleSave')
                        }}</span
                        ><span class="tree-sub">{{ $t('version.settings.worldMap') }}</span></label
                      >
                    </div>
                    <div class="tree-node">
                      <label class="tree-checkbox"
                        ><input type="checkbox" v-model="exportOpts.includeLauncher" /><span>{{
                          $t('version.settings.voxverLauncher')
                        }}</span
                        ><span class="tree-sub">{{
                          $t('version.settings.packOfficialDesc')
                        }}</span></label
                      >
                    </div>
                    <div class="tree-node">
                      <label class="tree-checkbox"
                        ><input
                          type="checkbox"
                          v-model="exportOpts.includePersonalization"
                        /><span>{{ $t('version.settings.voxverPersonalization') }}</span
                        ><span class="tree-sub">{{
                          $t('version.settings.voxverPersonalizationDesc')
                        }}</span></label
                      >
                    </div>
                  </div>
                </section>

                <!-- 高级选项（可折叠） -->
                <section class="vs-section collapsible" :class="{ collapsed: !showExportAdvanced }">
                  <h3 class="sec-title clickable" @click="showExportAdvanced = !showExportAdvanced">
                    {{ $t('version.settings.advancedOptions') }}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      :style="{ transform: showExportAdvanced ? 'rotate(180deg)' : '' }"
                      style="transition: transform 0.2s"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </h3>
                  <div v-show="showExportAdvanced" class="adv-content">
                    <label class="checkbox-label block"
                      ><input type="checkbox" /> {{ $t('version.settings.packResources') }}</label
                    >
                    <label class="checkbox-label block"
                      ><input type="checkbox" /> {{ $t('version.settings.modrinthOnly') }}</label
                    >
                    <div class="export-tip-box" style="white-space: pre-line">
                      {{ $t('version.settings.advancedExportTip') }}
                    </div>
                  </div>
                </section>

                <!-- 底部大按钮 -->
                <div class="export-bottom-btn-wrap">
                  <button class="btn-export-primary" @click="doExport" :disabled="exportLoading">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    {{ $t('version.settings.startExport') }}
                  </button>
                </div>
              </template>

              <!-- ===== 导出（Koring 排版） ===== -->
              <template v-else-if="activeTab === 'export'">
                <div class="vs-kor-page">
                  <KorSectionTitle>{{ $t('version.settings.navExport') }}</KorSectionTitle>
                  <KorSettingCard>
                    <KorSettingRow :label="$t('version.settings.modpackName')">
                      <KorInput v-model="exportPackName" class="vs-kor-input" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.modpackVersion')">
                      <KorInput
                        v-model="exportPackVersion"
                        class="vs-kor-input vs-kor-input--short"
                      />
                    </KorSettingRow>
                  </KorSettingCard>

                  <KorSectionTitle>
                    {{ $t('version.settings.exportContentList') }}
                    <span v-if="exportLoading" class="vs-kor-loading">{{
                      $t('common.loading')
                    }}</span>
                  </KorSectionTitle>
                  <KorSettingCard>
                    <KorSettingRow
                      :label="$t('version.settings.gameCore')"
                      :desc="`${versionBase} ${loaderInfo}`"
                    >
                      <KorSwitch :model-value="true" disabled />
                    </KorSettingRow>

                    <KorSettingRow
                      :label="$t('version.settings.modLabel')"
                      :desc="$t('version.settings.modsCount', { n: exportMods.length })"
                    >
                      <KorSwitch v-model="exportOpts.includeMods" />
                    </KorSettingRow>
                    <ul v-if="exportMods.length > 0" class="vs-kor-list">
                      <li
                        v-for="mod in exportMods"
                        :key="mod.fileName"
                        class="vs-kor-list__item"
                      >
                        <img
                          v-if="mod.logoUrl"
                          :src="mod.logoUrl"
                          class="vs-kor-list__icon"
                          alt=""
                          @error="
                            (e: Event) => ((e.target as HTMLImageElement).style.display = 'none')
                          "
                        />
                        <span v-else class="vs-kor-list__icon vs-kor-list__icon--text">{{
                          mod.name.slice(0, 1).toUpperCase()
                        }}</span>
                        <span class="vs-kor-list__name">{{ mod.name }}</span>
                        <span class="vs-kor-list__meta">{{ mod.version }}</span>
                        <KorBadge v-if="!mod.enabled">{{
                          $t('version.settings.disabledBadge')
                        }}</KorBadge>
                      </li>
                    </ul>
                    <p v-else-if="!exportLoading" class="vs-kor-list__empty">
                      {{ $t('version.settings.notFoundMod') }}
                    </p>
                    <KorSettingRow
                      class="vs-kor-subrow"
                      :label="$t('version.settings.disabledModsCheckbox')"
                    >
                      <KorSwitch v-model="exportOpts.includeDisabledMods" />
                    </KorSettingRow>
                    <KorSettingRow
                      class="vs-kor-subrow"
                      :label="$t('version.settings.modConfigsCheckbox')"
                    >
                      <KorSwitch v-model="exportOpts.includeModConfigs" />
                    </KorSettingRow>

                    <KorSettingRow
                      :label="$t('version.settings.resourcePacksLabel')"
                      :desc="
                        $t('version.settings.textureMaterials', {
                          n: exportResourcePacks.length
                        })
                      "
                    >
                      <KorSwitch v-model="exportOpts.includeResourcePacks" />
                    </KorSettingRow>
                    <ul v-if="exportResourcePacks.length > 0" class="vs-kor-list">
                      <li v-for="rp in exportResourcePacks" :key="rp.name" class="vs-kor-list__item">
                        <span class="vs-kor-list__name">{{ rp.name }}</span>
                        <span class="vs-kor-list__meta">{{ formatFileSize(rp.size) }}</span>
                      </li>
                    </ul>
                    <p v-else-if="!exportLoading" class="vs-kor-list__empty">
                      {{ $t('version.settings.notFoundResourcePack') }}
                    </p>

                    <KorSettingRow
                      :label="$t('version.settings.shaderPacksLabel')"
                      :desc="
                        $t('version.settings.shaderPacksCount', { n: exportShaderPacks.length })
                      "
                    >
                      <KorSwitch v-model="exportOpts.includeShaderPacks" />
                    </KorSettingRow>
                    <ul v-if="exportShaderPacks.length > 0" class="vs-kor-list">
                      <li v-for="sp in exportShaderPacks" :key="sp.name" class="vs-kor-list__item">
                        <span class="vs-kor-list__name">{{ sp.name }}</span>
                        <span class="vs-kor-list__meta">{{ formatFileSize(sp.size) }}</span>
                      </li>
                    </ul>
                    <p v-else-if="!exportLoading" class="vs-kor-list__empty">
                      {{ $t('version.settings.notFoundShaderPack') }}
                    </p>

                    <KorSettingRow
                      :label="$t('version.settings.singleSave')"
                      :desc="$t('version.settings.worldMap')"
                    >
                      <KorSwitch v-model="exportOpts.includeSaves" />
                    </KorSettingRow>
                    <KorSettingRow
                      :label="$t('version.settings.voxverLauncher')"
                      :desc="$t('version.settings.packOfficialDesc')"
                    >
                      <KorSwitch v-model="exportOpts.includeLauncher" />
                    </KorSettingRow>
                    <KorSettingRow
                      :label="$t('version.settings.voxverPersonalization')"
                      :desc="$t('version.settings.voxverPersonalizationDesc')"
                    >
                      <KorSwitch v-model="exportOpts.includePersonalization" />
                    </KorSettingRow>
                  </KorSettingCard>

                  <KorSectionTitle>
                    <button
                      type="button"
                      class="vs-kor-collapse"
                      :class="{ 'is-open': showExportAdvanced }"
                      @click="showExportAdvanced = !showExportAdvanced"
                    >
                      <span>{{ $t('version.settings.advancedOptions') }}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </KorSectionTitle>
                  <KorSettingCard v-show="showExportAdvanced">
                    <KorSettingRow :label="$t('version.settings.packResources')">
                      <KorSwitch v-model="korPackResources" />
                    </KorSettingRow>
                    <KorSettingRow :label="$t('version.settings.modrinthOnly')">
                      <KorSwitch v-model="korModrinthOnly" />
                    </KorSettingRow>
                    <p class="vs-kor-tip__text vs-kor-tip__text--inline">
                      {{ $t('version.settings.advancedExportTip') }}
                    </p>
                  </KorSettingCard>

                  <div class="vs-kor-export">
                    <KorButton
                      variant="primary"
                      block
                      :loading="exportLoading"
                      @click="doExport"
                    >
                      {{ $t('version.settings.startExport') }}
                    </KorButton>
                  </div>
                </div>
              </template>
            </main>
          </div>
        </div>
      </div>
    </transition>

    <!-- 补全文件弹窗 -->
    <transition name="modal-fade">
      <div
        v-if="showCompleteModal"
        class="ver-settings-overlay"
        @click.self="showCompleteModal = false"
      >
        <div class="ver-settings-window" style="width: 520px">
          <header class="vs-header">
            <button class="vs-back" @click="showCompleteModal = false">
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
            </button>
            <span class="vs-title">{{ $t('version.settings.completeFiles') }}</span>
            <div class="vs-wc">
              <button class="vs-wc-btn vs-close" @click="showCompleteModal = false">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
                </svg>
              </button>
            </div>
          </header>

          <div class="vs-body" style="padding: 20px; max-height: 70vh; overflow-y: auto">
            <!-- 检测中 -->
            <div v-if="completeState === 'checking'" class="complete-status checking">
              <div class="complete-spinner"></div>
              <p class="complete-status-text">{{ $t('version.settings.checkingMissing') }}</p>
              <p class="complete-status-sub">{{ completeTarget }}</p>
            </div>

            <!-- 检测完成：文件完整 -->
            <div v-else-if="completeState === 'complete'" class="complete-status success">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-success)"
                stroke-width="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <p class="complete-status-text">{{ $t('version.settings.allComplete') }}</p>
              <p class="complete-status-sub">
                {{ completeTarget }} ·
                {{ $t('version.settings.totalChecked', { n: completeTotal }) }}
              </p>
            </div>

            <!-- 检测完成：有缺失文件 -->
            <div v-else-if="completeState === 'missing'" class="complete-status warning">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-warning)"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p class="complete-status-text">
                {{ $t('version.settings.foundMissingPrefix')
                }}<strong>{{ missingFiles.length }}</strong
                >{{ $t('version.settings.foundMissingSuffix') }}
              </p>
              <p class="complete-status-sub">{{ $t('version.settings.downloadFromBMCLAPI') }}</p>

              <!-- 缺失文件列表（仅显示前10 个） -->
              <div v-if="missingFiles.length" class="missing-file-list">
                <div v-for="f in missingFiles.slice(0, 10)" :key="f" class="missing-file-item">
                  <span class="missing-file-dot"></span>
                  <span class="missing-file-path">{{ f }}</span>
                </div>
                <div v-if="missingFiles.length > 10" class="missing-file-more">
                  {{ $t('version.settings.moreFiles', { n: missingFiles.length - 10 }) }}
                </div>
              </div>

              <!-- 下载按钮 -->
              <button
                class="form-action-btn"
                style="margin-top: 16px; width: 100%"
                @click="startDownloadMissing"
              >
                {{ $t('version.settings.startDownload') }}
              </button>
            </div>

            <!-- 下载中 -->
            <div v-else-if="completeState === 'downloading'" class="complete-status downloading">
              <p class="complete-status-text">{{ $t('version.settings.downloadingMissing') }}</p>
              <p class="complete-status-sub">{{ completeTarget }}</p>
              <div class="dl-progress-wrap">
                <div class="dl-progress-bar">
                  <div class="dl-progress-fill" :style="{ width: dlProgress + '%' }"></div>
                </div>
                <p class="dl-progress-text">{{ dlCurrent }} / {{ dlTotal }}</p>
                <p class="dl-progress-file">{{ dlCurrentFile }}</p>
              </div>
            </div>

            <!-- 下载完成 -->
            <div v-else-if="completeState === 'done'" class="complete-status success">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-success)"
                stroke-width="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <p class="complete-status-text">{{ $t('version.settings.completed') }}</p>
              <p class="complete-status-sub">
                {{ $t('version.settings.completedFiles', { n: dlTotal }) }}
              </p>
              <button
                class="form-action-btn"
                style="margin-top: 16px"
                @click="showCompleteModal = false"
              >
                {{ $t('version.settings.doneBtn') }}
              </button>
            </div>

            <!-- 错误 -->
            <div v-else-if="completeState === 'error'" class="complete-status error">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-error)"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p class="complete-status-text">{{ $t('version.settings.failed') }}</p>
              <p class="complete-status-sub" style="color: var(--voxver-error)">
                {{ completeError }}
              </p>
              <button class="form-action-btn" style="margin-top: 16px" @click="completeFiles">
                {{ $t('common.retry') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 输入弹窗 -->
    <transition name="modal-fade">
      <div v-if="showInputModal" class="ver-settings-overlay" @click.self="cancelInputModal">
        <div class="ver-settings-window input-modal-win">
          <header class="vs-header">
            <button class="vs-back" @click="cancelInputModal">
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
            </button>
            <span class="vs-title">{{ inputModalTitle }}</span>
            <div class="vs-wc">
              <button class="vs-wc-btn vs-close" @click="cancelInputModal">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" />
                </svg>
              </button>
            </div>
          </header>
          <div class="vs-body" style="padding: 20px; flex-direction: column; gap: 12px">
            <input
              v-if="!inputModalMultiline"
              v-model="inputModalValue"
              type="text"
              class="form-input"
              :placeholder="inputModalPlaceholder"
              @keydown.enter="confirmInputModal"
              @keydown.esc="cancelInputModal"
              style="width: 100%"
            />
            <textarea
              v-else
              v-model="inputModalValue"
              class="form-textarea"
              :placeholder="inputModalPlaceholder"
              rows="4"
              style="width: 100%; resize: vertical; min-height: 80px"
              @keydown.esc="cancelInputModal"
            />
            <div style="display: flex; gap: 8px; justify-content: flex-end">
              <button class="form-action-btn" @click="cancelInputModal">
                {{ $t('common.cancel') }}
              </button>
              <button class="form-action-btn primary" @click="confirmInputModal">
                {{ $t('common.ok') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ModManager from './ModManager.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useInstancesStore } from '../stores/instances.store'
import { useAppStore } from '../stores/app.store'
import {
  KorBadge,
  KorButton,
  KorInput,
  KorSectionTitle,
  KorSelect,
  KorSettingCard,
  KorSettingListItem,
  KorSettingRadioGroup,
  KorSettingRow,
  KorSlider,
  KorSwitch
} from '@/components/kor'

const { t } = useI18n()
const { confirm: pxConfirm } = useConfirm()
const instancesStore = useInstancesStore()
const appStore = useAppStore()

/** Koring 排版皮肤：版本设置页改用 Kor 组件重排（经典皮肤保持原样） */
const isKoring = computed(() => appStore.skin === 'koring')

const props = defineProps<{
  visible: boolean
  versionName: string
  gameDir: string
  instanceId: string
  /** 内嵌到页面（非弹窗）：不显示遮罩与窗口按钮，返回按钮交由页面处理 */
  inline?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'version-deleted'): void
  (e: 'back'): void
}>()

function close() {
  emit('update:visible', false)
}

/** 标题栏返回：内嵌模式交给页面跳转，弹窗模式关闭弹窗 */
function goBack() {
  if (props.inline) emit('back')
  else close()
}

const activeTab = ref('overview')

// * 每次打开弹窗时重置到概览页
watch(
  () => props.visible,
  (v) => {
    if (v) activeTab.value = 'overview'
  }
)

// * 从实例 store 获取真实的结构化数据（避免用正则解析 versionName 字符串）
const currentInstance = computed(() =>
  instancesStore.instances.find((i) => i.id === props.instanceId)
)

/** MC 原版版本号（如 "1.20.1"），从实例数据直接获取 */
const versionBase = computed(() => currentInstance.value?.mcVersion ?? '')

const loaderInfo = computed(() => {
  const parts = props.versionName.split('-')
  return parts.length > 1 ? parts.slice(1).join('-') : ''
})

/** 加载器类型（如 "forge"/"fabric"），从实例数据直接获取，用于 Mod 下载页自动填充 */
const detectedLoader = computed(() => currentInstance.value?.loaderType ?? '')

// * 示例数据
const playerName = ref('Steve')
const playerUuid = ref('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
const isFavorited = ref(false)

// * 输入弹窗状态
const showInputModal = ref(false)
const inputModalTitle = ref('')
const inputModalValue = ref('')
const inputModalPlaceholder = ref('')
const inputModalMultiline = ref(false)
let inputModalResolve: ((value: string | null) => void) | null = null

function openInputModal(
  title: string,
  value: string,
  placeholder: string,
  multiline = false
): Promise<string | null> {
  return new Promise((resolve) => {
    inputModalTitle.value = title
    inputModalValue.value = value
    inputModalPlaceholder.value = placeholder
    inputModalMultiline.value = multiline
    inputModalResolve = resolve
    showInputModal.value = true
  })
}

function confirmInputModal() {
  inputModalResolve?.(inputModalValue.value)
  showInputModal.value = false
}

function cancelInputModal() {
  inputModalResolve?.(null)
  showInputModal.value = false
}

// * ====== 快捷方式：打开文件夹 ======
async function openFolder(subPath: string) {
  const api = window.electronAPI
  if (!api?.shell) return

  if (!subPath) {
    // * 版本文件夹：直接打开 props.gameDir
    await api.shell.openPath(props.gameDir)
    return
  }

  // * saves / mods：在当前版本目录下查找
  const target = `${props.gameDir}/${subPath}`
  await api.shell.openPath(target)
  return
}

// * ====== 个性化 ======
async function editVersionName() {
  const newName = await openInputModal(
    t('version.settings.editVersionNameTitle'),
    props.versionName,
    t('version.settings.newNamePlaceholder')
  )
  if (!newName || newName === props.versionName) return
  await window.electronAPI?.instance.updateName(props.instanceId, newName)
  emit('update:visible', false)
}

async function editVersionDescription() {
  const newDesc = await openInputModal(
    t('version.settings.editVersionDescTitle'),
    '',
    t('version.settings.newDescPlaceholder'),
    true
  )
  if (newDesc === null) return
  await window.electronAPI?.instance.updateDescription(props.instanceId, newDesc)
}

async function toggleFavorite() {
  if (!props.instanceId) return
  isFavorited.value = !isFavorited.value
  await window.electronAPI?.instance.toggleFavorite(props.instanceId)
}

// * ====== 导出启动脚本 ======
async function exportScript() {
  const name = props.versionName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const script = [
    '@echo off',
    `title ${props.versionName}`,
    'cd /d "%~dp0"',
    `start javaw -jar "${name}.jar"`
  ].join('\r\n')

  const blob = new Blob([script], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.bat`
  a.click()
  URL.revokeObjectURL(url)
}

// * ====== 删除版本 ======
async function deleteVersion() {
  if (!props.instanceId) return
  if (
    !(await pxConfirm({
      title: t('common.warning'),
      message:
        t('version.settings.deleteConfirm', { name: props.versionName }) +
        '\n\n' +
        t('version.settings.deleteConfirmAgain'),
      type: 'danger',
      confirmText: t('common.confirm')
    }))
  )
    return
  await window.electronAPI?.instance.delete(props.instanceId)
  emit('version-deleted')
}

// * 设置页状态
const showTip = ref(true)
const showAdvanced = ref(false)
const memMode = ref<'global' | 'auto' | 'custom'>('global')
const memCustom = ref('4096')
const useHighPerformanceGPU = ref(false)

// 系统内存（真实数据，从主进程获取）
const systemMemory = ref<{ totalGB: number; freeGB: number; usedGB: number }>({
  totalGB: 0,
  freeGB: 0,
  usedGB: 0
})

const usedMem = computed(() => systemMemory.value.usedGB.toFixed(1))
const totalMem = computed(() => systemMemory.value.totalGB.toFixed(1))
const gameMem = computed(() => {
  const totalGB = systemMemory.value.totalGB

  if (memMode.value === 'custom') {
    return (parseInt(memCustom.value) / 1024).toFixed(1)
  }
  // 跟随全局/自动：与 calculateMaxMemory 一致 —— max(4096MB, 系统内存 50%)，上限 60%
  if (!totalGB) return '...'
  const maxMB = Math.min(
    Math.max(4096, Math.floor(totalGB * 0.5 * 1024)),
    Math.floor(totalGB * 0.6 * 1024)
  )
  return (maxMB / 1024).toFixed(1)
})

// * ====== 设置页表单数据 ======
const settingsForm = reactive({
  versionIsolation: 'enabled',
  gameWindowTitle: '',
  customPath: '',
  javaPath: 'follow-global',
  memOptimize: 'follow-global',
  loginMethod: 'official-or-offline',
  autoJoinServer: '',
  jvmArgs: '',
  gameArgs: '',
  gcSelection: 'follow-global',
  preLaunchCmd: '',
  disableModUpdate: false,
  ignoreJavaWarning: false,
  disableFileCheck: false,
  disableJavaWrapper: false,
  disableLwjglAgent: false
})

/* * ====== Koring 分支：选项表与本地状态 ====== */
/** 自定义内存：字符串 MB ↔ 滑杆数字 */
const memCustomMb = computed({
  get: () => Number(memCustom.value) || 4096,
  set: (mb: number) => (memCustom.value = String(mb))
})
const memCustomGB = computed(() => (memCustomMb.value / 1024).toFixed(1))

/** 个性化：Koring 下拉的本地选中值（经典皮肤的两个 select 未绑状态，行为保持一致） */
const korIconChoice = ref('auto')
const korCategoryChoice = ref('auto')

/** 选项表：value 与经典 <select> 完全对齐，label 走 i18n */
const korIconOptions = computed(() => [
  { value: 'auto', label: t('version.settings.iconAuto') },
  { value: 'grass', label: t('version.settings.iconGrassBlock') },
  { value: 'creeper', label: t('version.settings.iconCreeper') },
  { value: 'custom', label: t('version.settings.iconCustom') }
])

const korCategoryOptions = computed(() => [
  { value: 'auto', label: t('version.settings.categoryAuto') },
  { value: 'vanilla', label: t('version.settings.categoryVanilla') },
  { value: 'modded', label: 'Modded' },
  { value: 'modpack', label: t('version.settings.categoryModpack') }
])

const korIsolationOptions = computed(() => [
  { value: 'enabled', label: t('version.settings.enabledBtn') },
  { value: 'disabled', label: t('version.settings.disabledBtn') }
])

const korJavaOptions = computed(() => [
  { value: 'follow-global', label: t('version.settings.followGlobal') },
  { value: 'java17', label: t('version.settings.java17') },
  { value: 'java21', label: t('version.settings.java21') },
  { value: 'custom', label: t('version.settings.customPath') }
])

const korMemModeOptions = computed(() => [
  { value: 'global', label: t('version.settings.followGlobal') },
  { value: 'auto', label: t('version.settings.autoConfig') },
  { value: 'custom', label: t('version.settings.customConfig') }
])

const korMemOptimizeOptions = computed(() => [
  { value: 'follow-global', label: t('version.settings.followGlobal') },
  { value: 'enabled', label: t('version.settings.enabledBtn') },
  { value: 'disabled', label: t('version.settings.disabledBtn') }
])

const korLoginOptions = computed(() => [
  { value: 'official-or-offline', label: t('version.settings.officialOrOffline') },
  { value: 'official-only', label: t('version.settings.officialOnly') },
  { value: 'offline-only', label: t('version.settings.offlineOnly') }
])

const korGcOptions = computed(() => [
  { value: 'follow-global', label: t('version.settings.followGlobal') },
  { value: 'g1gc', label: 'G1GC' },
  { value: 'zgc', label: 'ZGC' },
  { value: 'parallel', label: 'Parallel GC' }
])

const settingsSaving = ref(false)
const settingsSaveStatus = ref<'idle' | 'success' | 'error'>('idle')

// * 从 props 初始化设置表单
function initSettingsForm() {
  settingsForm.versionIsolation = 'enabled'
  settingsForm.gameWindowTitle = ''
  settingsForm.customPath = ''
  settingsForm.javaPath = 'follow-global'
  settingsForm.memOptimize = 'follow-global'
  settingsForm.loginMethod = 'official-or-offline'
  settingsForm.autoJoinServer = ''
  settingsForm.jvmArgs = ''
  settingsForm.gameArgs = ''
  settingsForm.gcSelection = 'follow-global'
  settingsForm.preLaunchCmd = ''
  settingsForm.disableModUpdate = false
  settingsForm.ignoreJavaWarning = false
  settingsForm.disableFileCheck = false
  settingsForm.disableJavaWrapper = false
  settingsForm.disableLwjglAgent = false
  memMode.value = 'global'
  memCustom.value = '4096'
  useHighPerformanceGPU.value = false
}

// * watch: modal 打开时重置表单并获取真实系统内存
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      initSettingsForm()
      try {
        const mem = await window.electronAPI?.app?.getMemoryInfo?.()
        if (mem) systemMemory.value = mem
      } catch {
        /* 获取失败则保持上次值 */
      }
    }
  }
)

// * ====== 保存设置 ======
async function saveSettings() {
  settingsSaving.value = true
  settingsSaveStatus.value = 'idle'
  try {
    const formData = {
      versionIsolation: settingsForm.versionIsolation,
      gameWindowTitle: settingsForm.gameWindowTitle,
      customPath: settingsForm.customPath,
      javaPath: settingsForm.javaPath,
      memMode: memMode.value,
      memCustom: memCustom.value,
      memOptimize: settingsForm.memOptimize,
      loginMethod: settingsForm.loginMethod,
      autoJoinServer: settingsForm.autoJoinServer,
      jvmArgs: settingsForm.jvmArgs,
      gameArgs: settingsForm.gameArgs,
      gcSelection: settingsForm.gcSelection,
      preLaunchCmd: settingsForm.preLaunchCmd,
      disableModUpdate: settingsForm.disableModUpdate,
      ignoreJavaWarning: settingsForm.ignoreJavaWarning,
      disableFileCheck: settingsForm.disableFileCheck,
      disableJavaWrapper: settingsForm.disableJavaWrapper,
      disableLwjglAgent: settingsForm.disableLwjglAgent,
      useHighPerformanceGPU: useHighPerformanceGPU.value
    }
    await window.electronAPI?.version?.saveSettings?.(props.instanceId, formData)
    settingsSaveStatus.value = 'success'
    window.electronAPI?.notification?.send({
      title: t('version.settings.saveSuccessTitle'),
      body: t('version.settings.saveSuccessBody', { name: props.versionName }),
      type: 'info'
    })
  } catch (e: unknown) {
    settingsSaveStatus.value = 'error'
    window.electronAPI?.notification?.send({
      title: t('version.settings.saveFailedTitle'),
      body: (e as Error)?.message || t('version.settings.saveFailedBody'),
      type: 'error'
    })
  } finally {
    settingsSaving.value = false
  }
}

// * 导出页状态
const showExportAdvanced = ref(false)
/** 导出高级选项（经典皮肤里这两个复选框未绑状态，Koring 分支用本地状态承接） */
const korPackResources = ref(false)
const korModrinthOnly = ref(false)
const exportLoading = ref(false)
const exportLoaded = ref(false)
const exportMods = ref<
  Array<{
    name: string
    version: string
    logoUrl: string
    enabled: boolean
    fileName: string
  }>
>([])
const exportResourcePacks = ref<Array<{ name: string; size: number }>>([])
const exportShaderPacks = ref<Array<{ name: string; size: number }>>([])
const exportPackName = ref('')
const exportPackVersion = ref('1.0.0')
const exportOpts = ref({
  includeMods: true,
  includeDisabledMods: false,
  includeModConfigs: true,
  includeResourcePacks: true,
  includeShaderPacks: true,
  includeSaves: false,
  includeLauncher: true,
  includePersonalization: true
})

async function loadExportData() {
  if (exportLoading.value) return
  exportLoading.value = true
  exportPackName.value = props.versionName
  try {
    const result = await window.electronAPI?.instance?.exportPreview(props.gameDir)
    if (result?.ok && result.data) {
      exportMods.value = (result.data.mods || []).map(
        (m: {
          name?: string
          fileName?: string
          version?: string
          logoUrl?: string
          enabled?: boolean
        }) => ({
          name: m.name || m.fileName || t('version.settings.unknownMod'),
          version: m.version || t('version.settings.unknown'),
          logoUrl: m.logoUrl || '',
          enabled: m.enabled !== false,
          fileName: m.fileName || ''
        })
      )
      exportResourcePacks.value = result.data.resourcePacks || []
      exportShaderPacks.value = result.data.shaderPacks || []
      exportLoaded.value = true
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('version.settings.loadExportFailed'),
      body: (e as Error)?.message || t('version.settings.cannotReadExport'),
      type: 'error'
    })
  }
  exportLoading.value = false
}

watch(activeTab, (tab) => {
  if (tab === 'export' && !exportLoaded.value && !exportLoading.value) {
    loadExportData()
  }
})

watch(
  () => props.gameDir,
  () => {
    exportLoaded.value = false
    exportMods.value = []
    exportResourcePacks.value = []
    exportShaderPacks.value = []
  }
)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function doExport() {
  try {
    const destPath = await window.electronAPI?.dialog?.selectFile({
      title: t('version.settings.selectExportPath'),
      filters: [{ name: t('version.settings.mclaPack'), extensions: ['mcla'] }]
    })
    if (!destPath) return
    const fullPath = destPath.endsWith('.mcla') ? destPath : destPath + '.mcla'
    const opts = {
      includeMods: exportOpts.value.includeMods,
      includeDisabledMods: exportOpts.value.includeDisabledMods,
      includeConfigs: exportOpts.value.includeModConfigs,
      includeResourcePacks: exportOpts.value.includeResourcePacks,
      includeShaderPacks: exportOpts.value.includeShaderPacks,
      includeSaves: exportOpts.value.includeSaves
    }
    const res = await window.electronAPI?.instance?.exportInstance(props.instanceId, fullPath, opts)
    if (res?.ok) {
      window.electronAPI?.notification?.send({
        title: t('version.settings.exportSuccessTitle'),
        body: t('version.settings.exportedTo') + fullPath,
        type: 'info'
      })
    } else {
      window.electronAPI?.notification?.send({
        title: t('version.settings.exportFailedTitle'),
        body: res?.error || t('version.settings.unknownError'),
        type: 'error'
      })
    }
  } catch (e: unknown) {
    window.electronAPI?.notification?.send({
      title: t('version.settings.exportFailedTitle'),
      body: (e as Error)?.message || t('version.settings.unknownError'),
      type: 'error'
    })
  }
}

// * ===== 补全文件 =====
type CompleteState = 'idle' | 'checking' | 'complete' | 'missing' | 'downloading' | 'done' | 'error'

const showCompleteModal = ref(false)
const completeState = ref<CompleteState>('idle')
const completeError = ref('')
const completeTarget = ref('')
const completeTotal = ref(0)
const missingFiles = ref<string[]>([])
const dlProgress = ref(0)
const dlCurrent = ref(0)
const dlTotal = ref(0)
const dlCurrentFile = ref('')
let dlProgressUnsubscribe: (() => void) | null = null

async function completeFiles() {
  // * 从 gameDir 提取版本 ID（gameDir 格式: .../.minecraft/versions/1.20.1-Fabric）
  const parts = props.gameDir.split(/[/\\]/)
  const versionsIdx = parts.findIndex((p) => p === 'versions')
  const versionId = versionsIdx >= 0 ? parts[versionsIdx + 1] : props.versionName
  // * 找到 .minecraft 目录
  const mcIdx = parts.findIndex((p) => p === '.minecraft')
  const gameDir =
    mcIdx >= 0 ? parts.slice(0, mcIdx + 1).join('/') : props.gameDir.replace(/[/\\][^/\\]+$/, '')

  showCompleteModal.value = true
  completeState.value = 'checking'
  completeError.value = ''
  completeTarget.value = versionId
  missingFiles.value = []

  // * 监听下载进度
  dlProgressUnsubscribe = window.electronAPI?.versions.onDownloadProgress?.((data) => {
    if (data.versionId !== versionId) return
    dlCurrent.value = data.downloaded
    dlTotal.value = data.total
    dlProgress.value = data.total > 0 ? Math.round((data.downloaded / data.total) * 100) : 0
    dlCurrentFile.value = data.phaseLabel
  })

  try {
    const result = await window.electronAPI?.versions.validate(versionId, gameDir)
    if (
      !result ||
      typeof result !== 'object' ||
      !('ok' in result) ||
      !result.ok ||
      !('data' in result) ||
      !result.data
    ) {
      completeState.value = 'error'
      completeError.value =
        (result as { error?: string }).error || t('version.settings.checkFailed')
      return
    }

    const { missing, total } = result.data as { missing: string[]; total: number }
    completeTotal.value = total
    missingFiles.value = missing

    if (!missing.length) {
      completeState.value = 'complete'
    } else {
      completeState.value = 'missing'
    }
  } catch (e: unknown) {
    completeState.value = 'error'
    completeError.value = (e as Error).message
  }
}

async function startDownloadMissing() {
  const parts = props.gameDir.split(/[/\\]/)
  const versionsIdx = parts.findIndex((p) => p === 'versions')
  const versionId = versionsIdx >= 0 ? parts[versionsIdx + 1] : props.versionName
  const mcIdx = parts.findIndex((p) => p === '.minecraft')
  const gameDir =
    mcIdx >= 0 ? parts.slice(0, mcIdx + 1).join('/') : props.gameDir.replace(/[/\\][^/\\]+$/, '')

  dlCurrent.value = 0
  dlTotal.value = missingFiles.value.length || 1
  dlProgress.value = 0
  completeState.value = 'downloading'

  try {
    const result = await window.electronAPI?.versions.downloadMissing(versionId, gameDir)
    if (result?.ok) {
      dlTotal.value = result.data?.downloaded || 0
      completeState.value = 'done'
    } else {
      completeState.value = 'error'
      completeError.value = result?.error || t('version.settings.downloadFailed')
    }
  } catch (e: unknown) {
    completeState.value = 'error'
    completeError.value = (e as Error).message
  }
}

const navItems = [
  {
    id: 'overview',
    label: t('version.settings.navOverview'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>'
  },
  {
    id: 'settings',
    label: t('version.settings.navSettings'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
  },
  {
    id: 'mods',
    label: t('version.settings.navMods'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>'
  },
  {
    id: 'export',
    label: t('version.settings.navExport'),
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'
  }
]
</script>

<style scoped lang="scss">
/* * ====== VoxVer Design System ====== */

/* * ---- 遮罩层 ---- */
.ver-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--voxver-z-overlay);
}

/* * ---- 窗口容器 ---- */
.ver-settings-window {
  width: 800px;
  max-width: 90vw;
  height: 560px;
  max-height: 85vh;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-xl);
  border: 1px solid var(--voxver-border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--voxver-shadow-xl);
}

/* * ---- 内嵌到页面（/versions）：铺满内容区，不带遮罩，也不套外容器 ---- */
.ver-settings-embed {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  /* 让 padding 计入 100% 高度，否则会溢出 40px 并多出一层滚动条 */
  box-sizing: border-box;
  padding: 20px 24px;
}

/* Koring：/versions 已走 is-kor-bleed（main-content 无内边距），
   由页面自己给出与其它 Koring 页面一致的 24px 基线；
   右侧少 10px 是因为滚动条改成了 thin + 透明（仍占一条 10px 的槽），
   减掉它，卡片到窗口边缘的视觉留白才是 24px */
.ver-settings-embed.is-kor {
  padding: 24px;
}

.ver-settings-window.is-inline {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

/* 标题栏直接铺在页面上：透明、无分割线 */
.ver-settings-window.is-inline .vs-header {
  height: auto;
  padding: 0 0 16px;
  background: transparent;
  border-bottom: 0;
}

.ver-settings-window.is-inline .vs-title {
  font-size: 15px;
}

/* 设置导航也不再是一块面板 */
.ver-settings-window.is-inline .vs-nav {
  padding-left: 0;
  background: transparent;
  border-right: 0;
}

/* 内嵌时标题栏在正文里，不能当作窗口拖拽区 */
.ver-settings-window.is-inline .vs-header {
  -webkit-app-region: no-drag;
}

/* 内嵌时的返回按钮：带上文字，明确「返回主页」 */
.ver-settings-window.is-inline .vs-back {
  width: auto;
  padding: 0 8px;
  gap: 4px;
}

.vs-back__label {
  font-size: 12.5px;
  font-weight: 500;
}

/* * ---- 标题栏 ---- */
.vs-header {
  height: 42px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border-bottom: 1px solid var(--voxver-border-color);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.vs-back {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--voxver-radius-sm);
  transition: all 0.12s;
  -webkit-app-region: no-drag;

  &:hover {
    background: var(--voxver-bg-hover);
    color: var(--voxver-text-primary);
  }
}

.vs-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vs-wc {
  margin-left: auto;
  display: flex;
  -webkit-app-region: no-drag;

  .vs-wc-btn {
    width: 42px;
    height: 42px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--voxver-text-tertiary);
    transition: background 0.12s;

    &:hover {
      background: var(--voxver-bg-hover);
      color: var(--voxver-text-primary);
    }

    &.vs-close:hover {
      background: rgb(239 68 68 / 0.15);
      color: var(--voxver-error);
    }
  }
}

/* * ---- 主体布局 ---- */
.vs-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* * ---- 左侧导航 ---- */
.vs-nav {
  width: 160px;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 65%, transparent);
  border-right: 1px solid var(--voxver-border-color);
  padding: 10px 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vs-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 18px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 400;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.12s;
  position: relative;

  > span {
    flex-shrink: 0;
    display: flex;
    color: var(--voxver-text-muted);
  }

  &:hover {
    color: var(--voxver-primary-muted);
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);

    > span {
      color: var(--voxver-primary-muted);
    }
  }

  &.active {
    color: var(--voxver-primary-muted);
    font-weight: 600;
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 4px;
      bottom: 4px;
      width: 3px;
      background: var(--voxver-primary);
      border-radius: 0 2px 2px 0;
    }

    > span {
      color: var(--voxver-primary-muted);
    }
  }
}

/* * ---- 右侧内容 ---- */
.vs-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--voxver-border-color);
    border-radius: 3px;
  }
}

/* * ---- 版本信息卡片 ---- */
.ver-info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-lg);
  border: 1px solid var(--voxver-border-color);
  margin-bottom: 14px;

  .ver-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--voxver-radius-md);
    background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ver-detail {
    .ver-full-name {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--voxver-text-primary);
    }

    .ver-sub {
      margin: 3px 0 0;
      font-size: 12px;
      color: var(--voxver-text-muted);
    }
  }
}

/* * ---- 区块 ---- */
.vs-section {
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-lg);
  border: 1px solid var(--voxver-border-color);
  padding: 16px 18px;
  margin-bottom: 14px;

  .sec-title {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    color: var(--voxver-text-primary);
  }

  /* * 区块内的按钮组不需要额外上边距 */
  .form-btns {
    margin-top: 4px;
  }
}

/* * ---- 表单行 ---- */
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  > label {
    min-width: 70px;
    font-size: 13px;
    font-weight: 400;
    color: var(--voxver-text-secondary);
  }
}

.form-select,
.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  font-size: 13px;
  color: var(--voxver-text-primary);
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  outline: none;
  transition: border-color 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--voxver-primary) 15%, transparent);
  }

  &.short {
    flex: 0 0 80px;
  }
}

.form-select {
  color-scheme: dark light;
}

.form-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  font-size: 12px;
  font-family: inherit;
  color: var(--voxver-text-primary);
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  outline: none;
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.14s;

  &:focus {
    border-color: var(--voxver-primary);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--voxver-primary) 15%, transparent);
  }
}

/* * ---- 复选框标签 ---- */
.checkbox-label {
  display: inline-flex !important;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: normal;
  color: var(--voxver-text-primary);
  min-width: auto !important;
  cursor: pointer;
  margin-right: 16px;
  margin-bottom: 6px;

  input[type='checkbox'] {
    width: 15px;
    height: 15px;
    accent-color: var(--voxver-primary);
    cursor: pointer;
  }
}

/* * ---- 操作按钮组 ---- */
.form-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* * 独立按钮组 */
.vs-content > .form-btns {
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border-radius: var(--voxver-radius-lg);
  border: 1px solid var(--voxver-border-color);
  padding: 14px 18px;
}

.form-action-btn {
  padding: 8px 18px;
  border: 1.5px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  font-size: 12px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all 0.13s;

  &:hover {
    border-color: var(--voxver-primary);
    color: var(--voxver-primary);
  }

  &.primary {
    background: var(--voxver-gradient-primary);
    border-color: transparent;
    color: #fff;

    &:hover {
      filter: brightness(1.1);
    }
  }

  &.outline {
    &:hover {
      border-color: var(--voxver-primary);
      color: var(--voxver-primary);
      background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
    }
  }

  &.danger {
    border-color: rgb(239 68 68 / 0.5);
    color: var(--voxver-error);

    &:hover {
      background: rgb(239 68 68 / 0.1);
      border-color: var(--voxver-error);
    }
  }

  &.active {
    border-color: var(--voxver-warning);
    color: var(--voxver-warning);
    background: rgb(245 158 11 / 0.08);
  }
}


/* * ---- 动画 ---- */
.modal-fade-enter-active {
  transition: opacity 0.18s ease;
}

.modal-fade-leave-active {
  transition: opacity 0.12s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ---- 补全文件弹窗 ---- */
.complete-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px;
  gap: 8px;

  &.checking svg,
  &.downloading svg {
    animation: spin 1s linear infinite;
  }
}

.complete-status-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  margin: 4px 0 0;
}

.complete-status-sub {
  font-size: 12px;
  color: var(--voxver-text-muted);
  margin: 0;
  word-break: break-all;
  text-align: center;
}

.complete-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.missing-file-list {
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-md);
  padding: 8px 12px;
  text-align: left;
  margin-top: 12px;
}

.missing-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid var(--voxver-border-color);

  &:last-child {
    border-bottom: none;
  }
}

.missing-file-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--voxver-warning);
  flex-shrink: 0;
}

.missing-file-path {
  font-size: 11px;
  color: var(--voxver-text-secondary);
  word-break: break-all;
  font-family: monospace;
}

.missing-file-more {
  font-size: 11px;
  color: var(--voxver-text-muted);
  text-align: center;
  padding: 4px 0 0;
}

.dl-progress-wrap {
  width: 100%;
  margin-top: 12px;
}

.dl-progress-bar {
  width: 100%;
  height: 8px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color);
  border-radius: var(--voxver-radius-xs);
  overflow: hidden;
}

.dl-progress-fill {
  height: 100%;
  background: var(--voxver-primary);
  border-radius: var(--voxver-radius-xs);
  transition: width 0.3s ease;
}

.dl-progress-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-primary);
  margin: 8px 0 2px;
}

.dl-progress-file {
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-family: monospace;
  word-break: break-all;
  margin: 0;
}

.modal-fade-enter-active .ver-settings-window {
  transition:
    transform 0.2s ease,
    opacity 0.18s ease;
}

.modal-fade-enter-from .ver-settings-window {
  transform: scale(0.96) translateY(10px);
  opacity: 0;
}

/* * ====== 设置页专用样式 ===== */

/* * 提示栏 */
.vs-tip-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
  border-radius: var(--voxver-radius-md);
  font-size: 12px;
  color: var(--voxver-primary-muted);
  margin-bottom: 14px;

  svg {
    flex-shrink: 0;
    opacity: 0.7;
  }

  .tip-close {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 16px;
    color: var(--voxver-primary-muted);
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;

    &:hover {
      opacity: 0.6;
    }
  }
}

/* 内存选项 - radio 按钮组 */
.mem-options {
  display: flex;
  gap: 20px;
  margin-bottom: 14px;
}

.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  cursor: pointer;
  color: var(--voxver-text-secondary);

  input {
    accent-color: var(--voxver-primary);
  }

  &.active {
    color: var(--voxver-primary-muted);
    font-weight: 600;
  }
}

/* * 滑块 */
.slider-area {
  padding: 8px 4px;
}

.mem-slider {
  width: 100%;
  height: 4px;
  accent-color: var(--voxver-primary);
  cursor: pointer;
}

/* * 内存统计 */
.mem-stats {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--voxver-border-color);
  padding-top: 8px;
  margin-top: 10px;
}

.mem-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .mem-stat-label {
    font-size: 11px;
    color: var(--voxver-text-muted);
  }

  .mem-stat-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--voxver-text-primary);
  }
}

/* * 可折叠区域 */
.collapsed {
  .sec-title.clickable {
    margin-bottom: 0;
  }

  .adv-content {
    display: none;
  }
}

.sec-title.clickable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--voxver-primary-muted);
  }

  svg {
    flex-shrink: 0;
  }
}

.adv-content {
  animation: slideDown 0.2s ease;
}

/* checkbox 组 */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.checkbox-label.block {
  display: flex !important;
  width: 100%;
  margin-right: 0;
  margin-bottom: 0;
  padding: 3px 0;
}

.short-select {
  flex: 0 0 auto !important;
  min-width: 160px;
}

/* * 全局设置按钮 */
.btn-global-settings {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px 0;
  margin-top: 8px;
  background: var(--voxver-gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--voxver-radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    filter: brightness(1.08);
  }
}

.spin-icon {
  animation: spin 1.2s linear infinite;
}

/* * 输入弹窗尺寸（名称单行为窄窗，描述多行自动撑高） */
.input-modal-win {
  width: 420px;
  max-width: 90vw;
  height: auto;
  min-height: 160px;
  max-height: 70vh;

  .vs-body {
    padding: 20px !important;
  }

  textarea {
    min-height: 90px;
  }
}

.export-header-row {
  display: flex;
  gap: 24px;

  .form-row.compact {
    flex: 1;

    > label {
      min-width: 70px;
    }
  }
}

.export-list-section {
  padding: 16px 18px !important;
}

/* * 导出选项树 */
.export-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tree-node {
  padding: 5px 0;
}

.tree-parent {
  padding-bottom: 2px;
}

.tree-children {
  padding-left: 22px;
  margin-top: 2px;
}

.tree-child {
  padding: 3px 0;
}

.tree-checkbox {
  display: flex;
  align-items: baseline;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--voxver-text-primary);

  input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: var(--voxver-primary);
    cursor: pointer;
    flex-shrink: 0;
  }

  > span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-label-bold {
    font-weight: 600;
  }

  .tree-sub {
    font-size: 11px;
    color: var(--voxver-text-muted);
    margin-left: 4px;
    flex-shrink: 0;
    min-width: unset;
    overflow: visible;
    white-space: normal;
    align-self: center;
  }
}

/* 导出 mod 列表项 */
.export-loading-hint {
  font-size: 11px;
  color: var(--voxver-text-muted);
  font-weight: 400;
  margin-left: 8px;
}

.export-mod-item {
  padding: 4px 0;
}

.export-mod-checkbox {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.export-mod-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
  flex-shrink: 0;
}

.export-mod-icon-default {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: color-mix(in oklab, var(--voxver-primary) 15%, transparent);
  color: var(--voxver-primary);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-mod-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.export-mod-version {
  font-size: 11px;
  color: var(--voxver-text-muted);
  flex-shrink: 0;
}

.mod-disabled-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--voxver-radius-full);
  background: color-mix(in oklab, var(--voxver-warning) 15%, transparent);
  color: var(--voxver-warning);
  flex-shrink: 0;
}

.export-tip-box {
  margin-top: 10px;
  padding: 10px 12px;
  background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
  border-radius: var(--voxver-radius-md);
  font-size: 11px;
  color: var(--voxver-primary-muted);
  line-height: 1.55;
}

/* * 底部大按钮 */
.export-bottom-btn-wrap {
  display: flex;
  justify-content: center;
  padding: 18px 0 4px;
}

.btn-export-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 36px;
  background: var(--voxver-gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--voxver-radius-full);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--voxver-shadow-glow-primary);
  transition: all 0.16s;

  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 4px 24px color-mix(in oklab, var(--voxver-primary) 50%, transparent);
    transform: translateY(-1px);
  }
}

/* * 保存设置按钮 */
.btn-save-settings {
  width: 100%;
  margin-bottom: 10px;
  padding: 11px 0;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

/* * ====== Koring 排版：版本设置页 ====== */
/* 顶栏：Koring 页头（返回 + 标题），inline 时更像页面标题 */
.ver-settings-window.is-kor .vs-header {
  height: auto;
  padding: 16px 20px 10px;
  border-bottom: 0;
  background: transparent;
}

.ver-settings-window.is-kor .vs-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
}

.ver-settings-window.is-kor.is-inline .vs-header {
  padding: 2px 0 14px;
}

.ver-settings-window.is-kor.is-inline .vs-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--voxver-text-primary);
}

/* 导航：Kor 列表条目改造成胶囊导航（去 hairline、补选中底色） */
.ver-settings-window.is-kor .vs-nav.is-kor {
  width: 216px;
  padding: 10px;
  gap: 0;
  background: color-mix(in oklab, var(--voxver-bg-secondary) 55%, transparent);
  border-right: 1px solid rgba(var(--kor-fg-rgb, 255, 255, 255), 0.07);
}

.ver-settings-window.is-kor.is-inline .vs-nav.is-kor {
  background: transparent;
  border-right: 0;
  padding-left: 0;
}

.vs-kor-nav-item {
  padding: 8px 10px;
  border-radius: 12px;
  border-top: 0 !important;
  color: var(--voxver-text-secondary);
  transition:
    background 0.14s ease,
    color 0.14s ease;

  :deep(.kor-list-item__icon) {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: transparent;
    color: inherit;
  }

  :deep(.kor-list-item__label) {
    font-size: 13.5px;
    font-weight: 500;
    color: inherit;
  }

  &:hover {
    background: rgba(var(--kor-fg-rgb, 255, 255, 255), 0.05);
    color: var(--voxver-text-primary);
  }

  &.is-active {
    background: rgba(var(--kor-fg-rgb, 255, 255, 255), 0.1);
    color: var(--voxver-text-primary);

    :deep(.kor-list-item__icon) {
      color: var(--voxver-primary);
    }
  }
}

.vs-kor-nav-icon {
  display: flex;
}

/* inline 时内容区不叠第二层底色 */
.ver-settings-window.is-kor.is-inline .vs-content {
  background: transparent;
  /* 左右内边距交给 .ver-settings-embed.is-kor（24px 基线），这里只留与导航的间距 */
  padding: 4px 0 20px 24px;
}

/* 内容区滚动条：平时隐形，滚动时淡入（与全局 Koring 一致）
   global.scss 里 `* { scrollbar-color: … }` 会让 Chromium 走「标准滚动条」，
   ::-webkit-scrollbar 那套在这之后会被忽略，所以只用标准属性收口。 */
.ver-settings-window.is-kor .vs-content {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &.is-scrolling {
    scrollbar-color: rgba(var(--kor-fg-rgb, 255, 255, 255), 0.3) transparent;
  }

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  &::-webkit-scrollbar-button {
    display: none;
    width: 0;
    height: 0;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: transparent;
    border: 3px solid transparent;
    border-radius: 999px;
    background-clip: padding-box;
    transition: background-color 200ms ease;
  }

  &.is-scrolling::-webkit-scrollbar-thumb {
    background: rgba(var(--kor-fg-rgb, 255, 255, 255), 0.3);
    background-clip: padding-box;
  }
}

/* 内容排版：Koring 的「标题 + 磨砂卡片」节奏 */
.vs-kor-page {
  display: flex;
  flex-direction: column;
  /* 底部只留一点余量：概览页刚好一屏，不该为多出的留白凭空长出滚动条 */
  padding: 2px 2px 16px;
  width: 100%;
  min-width: 0;
}

.vs-kor-page > .kor-section-title {
  margin: 26px 2px 10px;

  &:first-child {
    margin-top: 0;
  }
}

/* 版本信息卡 */
.vs-kor-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px 18px 16px;
}

.vs-kor-hero__icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: color-mix(in oklab, var(--voxver-primary) 14%, transparent);
  color: var(--voxver-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.vs-kor-hero__body {
  flex: 1;
  min-width: 0;
}

.vs-kor-hero__name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--voxver-text-primary);
}

.vs-kor-hero__desc {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--voxver-text-secondary);
}

.vs-kor-hero__badge {
  flex: none;
}

/* 卡片内的行尾按钮组（与 .kor-row 的 hairline 节奏一致） */
.vs-kor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(128, 128, 128, 0.14);

  &:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }
}

/* 提示条 */
.vs-kor-tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 2px;

  &.kor-surface {
    background: color-mix(in oklab, var(--voxver-primary) 8%, transparent);
    border-color: color-mix(in oklab, var(--voxver-primary) 20%, transparent);
    box-shadow: none;
  }
}

.vs-kor-tip__text {
  flex: 1;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--voxver-text-secondary);
}

.vs-kor-tip__text--inline {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in oklab, var(--voxver-primary) 7%, transparent);
  white-space: pre-line;
}

.vs-kor-tip__close {
  border: 0;
  padding: 0 2px;
  background: transparent;
  color: var(--voxver-text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: var(--voxver-text-primary);
  }
}

/* 输入控件在 Kor 行内的固定宽度 */
.vs-kor-input {
  width: 220px;
}

.vs-kor-input--short {
  width: 120px;
}

.vs-kor-textarea {
  width: 360px;
  min-height: 62px;
  padding: 9px 12px;
  border: 1px solid rgba(var(--kor-fg-rgb, 255, 255, 255), 0.12);
  border-radius: 10px;
  background: rgba(var(--kor-fg-rgb, 255, 255, 255), 0.04);
  color: var(--voxver-text-primary);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;

  &::placeholder {
    color: var(--voxver-text-muted);
  }

  &:focus-visible {
    outline: 2px solid color-mix(in oklab, var(--voxver-primary) 55%, transparent);
    outline-offset: 1px;
  }
}

/* 可折叠段标题 */
.vs-kor-collapse {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;

  svg {
    transition: transform 0.18s ease;
  }

  &.is-open svg {
    transform: rotate(180deg);
  }

  &:hover {
    color: var(--voxver-text-primary);
  }
}

/* 保存区 */
.vs-kor-save {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
}

.vs-kor-save__status {
  font-size: 13px;
  font-weight: 600;

  &.is-ok {
    color: #3fb950;
  }

  &.is-err {
    color: #f85149;
  }
}

.vs-kor-save__global {
  margin-left: auto;
}

/* 导出：条目列表 */
.vs-kor-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.vs-kor-list__item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--voxver-text-primary);

  &:hover {
    background: rgba(var(--kor-fg-rgb, 255, 255, 255), 0.04);
  }
}

.vs-kor-list__icon {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  object-fit: contain;
  flex: none;
}

.vs-kor-list__icon--text {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--voxver-primary) 15%, transparent);
  color: var(--voxver-primary);
  font-size: 11px;
  font-weight: 600;
}

.vs-kor-list__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vs-kor-list__meta {
  flex: none;
  font-size: 11.5px;
  color: var(--voxver-text-muted);
}

.vs-kor-list__empty {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: var(--voxver-text-muted);
}

/* 列表之后的子开关行：补回被列表打断的 hairline */
.vs-kor-subrow {
  margin-top: 14px !important;
  padding-top: 14px !important;
  border-top: 1px solid rgba(128, 128, 128, 0.14) !important;
}

.vs-kor-loading {
  margin-left: 8px;
  font-size: 11.5px;
  font-weight: 400;
  color: var(--voxver-text-muted);
}

.vs-kor-export {
  margin-top: 22px;
}
</style>
