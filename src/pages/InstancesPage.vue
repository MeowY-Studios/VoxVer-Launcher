<template>
  <div class="instances-page">
    <!-- 顶部操作栏 -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">{{ $t('instance.manager') }}</h2>
        <span class="instance-count">{{ $t('instance.count', { count: instances.length }) }}</span>
      </div>
      <div class="toolbar-right">
        <!-- 视图切换 -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            :title="$t('instance.gridView')"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            :title="$t('instance.listView')"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
        <button class="vox-btn vox-btn--primary" @click="router.push('/versions')">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ $t('instance.newInstance') }}
        </button>
        <button class="vox-btn" @click="showImport = true" :title="$t('instance.import')">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ $t('instance.import') }}
        </button>
        <button
          class="vox-btn"
          @click="showExport = true"
          :disabled="!selectedId"
          :title="$t('instance.exportSelected')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {{ $t('instance.export') }}
        </button>
      </div>
    </div>

    <!-- 当前 .minecraft 路径提示 -->
    <div class="current-mc-path" v-if="currentMcPath">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
      <span>{{ currentMcPath }}</span>
    </div>

    <!-- 搜索栏 + 筛选/排序工具栏 -->
    <div class="toolbar-row">
      <div class="search-bar">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input type="text" v-model="searchQuery" :placeholder="$t('instance.searchInstance')" />
      </div>

      <div class="filter-row">
        <!-- 加载器筛选 -->
        <div class="filter-pills">
          <button
            class="pill"
            :class="{ active: filterLoader === 'all' }"
            @click="filterLoader = 'all'"
          >
            {{ $t('instance.filterAll') }}
          </button>
          <button
            v-for="l in loaderFilterOptions"
            :key="l.value"
            class="pill"
            :class="{ active: filterLoader === l.value }"
            @click="filterLoader = l.value"
          >
            {{ l.label }}
          </button>
        </div>

        <!-- 收藏筛选 -->
        <div class="fav-filter" :title="$t('instance.favoriteOnly')">
          <button
            class="icon-btn"
            :class="{ active: filterFavorite }"
            @click="filterFavorite = !filterFavorite"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="filterFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        </div>

        <!-- 排序 -->
        <select class="sort-select vox-input" v-model="sortBy">
          <option value="lastPlayed">{{ $t('instance.sortLastPlayed') }}</option>
          <option value="createdAt">{{ $t('instance.sortCreatedAt') }}</option>
          <option value="name">{{ $t('instance.sortName') }}</option>
          <option value="mcVersion">{{ $t('instance.sortMcVersion') }}</option>
        </select>

        <!-- 分组 -->
        <select class="sort-select vox-input" v-model="groupBy">
          <option value="none">{{ $t('instance.groupNone') }}</option>
          <option value="favorite">{{ $t('instance.groupFavorite') }}</option>
          <option value="loader">{{ $t('instance.groupLoader') }}</option>
          <option value="mcVersion">{{ $t('instance.groupMcVersion') }}</option>
        </select>

        <!-- 刷新：重扫当前 MC 文件夹 -->
        <button class="vox-btn refresh-btn" @click="rescanVersions" :disabled="scanning" :title="$t('instance.refresh')">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ spinning: scanning }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ===== 我的实例 ====== -->
    <div class="my-instances-section">
      <div class="section-header">
        <h3 class="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {{ $t('instance.myInstances') }}
        </h3>
        <div class="section-header-right">
          <span v-if="scanning" class="spin-loader" style="--size: 14px" />
          <span class="section-count">{{ mergedTotalCount }}</span>
        </div>
      </div>

      <!-- 无路径提示（从系统通知移到主内容区） -->
      <div v-if="!currentMcPath" class="mc-path-banner">
        <div class="mc-path-banner__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div class="mc-path-banner__body">
          <div class="mc-path-banner__title">未配置 .minecraft 文件夹</div>
          <div class="mc-path-banner__desc">{{ $t('instance.noCustomPathHint') }}</div>
        </div>
        <div class="mc-path-banner__actions">
          <button class="vox-btn vox-btn--primary" @click="pickMcFolder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            选择已有文件夹
          </button>
        </div>
      </div>

      <!-- 网格视图（支持分组） -->
      <template v-if="viewMode === 'grid'">
        <!-- 已管理实例 -->
        <template v-if="sortedInstances.length">
          <template v-for="group in groupedInstances" :key="`m-${group.key}`">
            <div v-if="groupBy !== 'none' || group.key === '__managed__'" class="group-header managed-group-header">
              <h4 class="group-title">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {{ groupBy !== 'none' ? group.label : $t('instance.managedInstances') }}
              </h4>
              <span class="group-count">{{ group.items.length }}</span>
            </div>
            <div v-if="group.items.length" class="instance-grid">
              <InstanceCard
                v-for="inst in group.items"
                :key="inst.id"
                :instance="inst"
                :selected="selectedId === inst.id"
                :show-favorite="true"
                @select="selectInstance"
                @open="openInstance"
                @launch="launchInstance"
                @open-folder="openFolder"
                @edit="editInstance"
                @delete="confirmDeleteInstance"
                @toggle-favorite="toggleFavorite"
              />
            </div>
          </template>
        </template>

        <!-- 待导入（当前文件夹扫到的，但数据库里还没有） -->
        <template v-if="pendingImportList.length">
          <div class="group-header pending-group-header">
            <h4 class="group-title">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {{ $t('instance.pendingImport') }}
            </h4>
            <span class="group-count">{{ pendingImportList.length }}</span>
          </div>
          <div class="instance-grid detected-cards-grid">
            <div
              v-for="dv in pendingImportList"
              :key="dv.id"
              class="instance-card vox-card pending-card"
            >
              <div class="card-cover" :style="{ background: getCoverGradientForDetected(dv.id) }">
                <div class="cover-loader-tag" v-if="dv.loaderInfo">
                  {{ dv.loaderInfo }}
                </div>
                <div class="cover-version-tag">
                  {{ dv.baseVersion }}
                </div>
              </div>
              <div class="card-body">
                <h3 class="card-name">{{ dv.id }}</h3>
                <p class="card-meta">
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {{ dv.lastPlayed != null ? formatTime(String(dv.lastPlayed)) : $t('instance.neverPlayed') }}
                  </span>
                </p>
              </div>
              <div class="card-actions">
                <button class="action-btn launch" @click="launchDetectedVersion(dv)" :title="$t('instance.launch')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button class="action-btn" @click="openDetectedFolder(dv)" :title="$t('instance.openFolder')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </button>
                <button class="action-btn" @click="createInstanceFromDetected(dv)" :title="$t('instance.importAsManaged')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- 列表视图（支持分组） -->
      <template v-else-if="viewMode === 'list'">
        <!-- 已管理实例 -->
        <template v-if="sortedInstances.length">
          <template v-for="group in groupedInstances" :key="`l-${group.key}`">
            <div v-if="groupBy !== 'none' || group.key === '__managed__'" class="group-header managed-group-header">
              <h4 class="group-title">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {{ groupBy !== 'none' ? group.label : $t('instance.managedInstances') }}
              </h4>
              <span class="group-count">{{ group.items.length }}</span>
            </div>
            <div v-if="group.items.length" class="instance-list">
              <div
                v-for="inst in group.items"
                :key="inst.id"
                class="list-item vox-card"
                :class="{ selected: selectedId === inst.id }"
                @click="selectInstance(inst)"
                @dblclick="openInstance(inst)"
              >
                <div class="list-icon" :style="{ background: getCoverGradient(inst) }">
                  <span class="list-icon-ver">{{ inst.mc_version }}</span>
                </div>
                <div class="list-info">
                  <h4 class="list-name">{{ inst.name }}</h4>
                  <p class="list-meta">
                    {{ inst.mc_version }}
                    <span v-if="inst.loader_type && inst.loader_type !== 'vanilla'">
                      · {{ capitalizeFirst(inst.loader_type) }} {{ inst.loader_version }}
                    </span>
                    <span v-if="inst.is_favorited === 1"> · ★</span>
                  </p>
                </div>
                <div class="list-actions">
                  <button class="action-btn" @click.stop="launchInstance(inst)" :title="$t('instance.launch')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button class="action-btn" @click.stop="openFolder(inst)" :title="$t('instance.openFolder')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                  </button>
                  <button class="action-btn" @click.stop="toggleFavorite(inst)" :title="inst.is_favorited === 1 ? $t('instance.unfavorite') : $t('instance.favorite')">
                    <svg width="14" height="14" viewBox="0 0 24 24" :fill="inst.is_favorited === 1 ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                  <button class="action-btn" @click.stop="editInstance(inst)" :title="$t('instance.edit')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="action-btn danger" @click.stop="confirmDeleteInstance(inst)" :title="$t('instance.delete')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- 待导入列表视图 -->
        <template v-if="pendingImportList.length">
          <div class="group-header pending-group-header">
            <h4 class="group-title">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {{ $t('instance.pendingImport') }}
            </h4>
            <span class="group-count">{{ pendingImportList.length }}</span>
          </div>
          <div class="instance-list">
            <div
              v-for="dv in pendingImportList"
              :key="dv.id"
              class="list-item vox-card pending-list-item"
            >
              <div class="list-icon" :style="{ background: getCoverGradientForDetected(dv.id) }">
                <span class="list-icon-ver">{{ dv.baseVersion }}</span>
              </div>
              <div class="list-info">
                <h4 class="list-name">{{ dv.id }}</h4>
                <p class="list-meta">
                  {{ dv.baseVersion }}
                  <span v-if="dv.loaderInfo"> · {{ dv.loaderInfo }}</span>
                </p>
              </div>
              <div class="list-actions">
                <button class="action-btn launch" @click.stop="launchDetectedVersion(dv)" :title="$t('instance.launch')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button class="action-btn" @click.stop="openDetectedFolder(dv)" :title="$t('instance.openFolder')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </button>
                <button class="action-btn" @click.stop="createInstanceFromDetected(dv)" :title="$t('instance.importAsManaged')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- 空状态：没有已管理也没有待导入且没有搜索 -->
      <div v-if="!searchQuery && mergedTotalCount === 0" class="empty-state my-instances-empty">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          style="color: var(--voxver-text-muted); margin-bottom: 12px"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <p>{{ $t('instance.noInstancesHint') }}</p>
      </div>
    </div>

    <!-- ===== 外部启动器 ====== -->
    <div v-if="externalLaunchers.length || scanningExternalLaunchers" class="external-launchers-section">
      <div class="section-header">
        <h3 class="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          {{ $t('instance.externalLaunchers') }}
        </h3>
        <span v-if="scanningExternalLaunchers" class="spin-loader" />
      </div>

      <div v-for="launcher in externalLaunchers" :key="launcher.type" class="launcher-group">
        <div class="launcher-header">
          <span class="launcher-name">{{ launcher.name }}</span>
          <span class="launcher-count">{{ $t('instance.externalInstanceCount', { count: launcher.instances.length }) }}</span>
        </div>
        <div class="external-instance-list">
          <div
            v-for="extInst in launcher.instances"
            :key="extInst.gameDir"
            class="external-instance-item vox-card"
          >
            <div class="ext-info">
              <h4 class="ext-name">{{ extInst.name }}</h4>
              <p class="ext-meta">
                {{ extInst.version }}
                <span v-if="extInst.loaderType && extInst.loaderType !== 'vanilla'">
                  · {{ capitalizeFirst(extInst.loaderType) }} {{ extInst.loaderVersion }}
                </span>
              </p>
            </div>
            <button class="vox-btn vox-btn--primary ext-import-btn" @click="importExternalInstance(extInst)">
              {{ $t('instance.importExternalInstance') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入实例弹窗 -->
    <div class="modal-overlay" v-if="showImport" @click.self="closeImport">
      <div class="modal-content vox-card">
        <h3>{{ $t('instance.importExistingInstance') }}</h3>

        <!-- Tab 切换 -->
        <div class="import-tabs">
          <button
            class="import-tab"
            :class="{ active: importTab === 'dir' }"
            @click="importTab = 'dir'"
          >
            {{ $t('instance.importFromDir') }}
          </button>
          <button
            class="import-tab"
            :class="{ active: importTab === 'mcla' }"
            @click="importTab = 'mcla'"
          >
            {{ $t('instance.importFromMcla') }}
          </button>
        </div>

        <!-- Tab 1: 从目录导入 -->
        <div v-if="importTab === 'dir'">
          <!-- 步骤1: 选择目录 -->
          <div v-if="importStep === 'select'" class="import-step">
            <p class="import-hint">
              {{ $t('instance.selectDirectoryHint') }}
            </p>
            <div class="form-group">
              <label>{{ $t('instance.directoryPath') }}</label>
              <div class="dir-picker">
                <input class="vox-input" v-model="importDir" :placeholder="$t('instance.directoryPlaceholder')" readonly />
                <button class="vox-btn" @click="selectImportDir">{{ $t('common.pleaseSelect') }}</button>
              </div>
            </div>
          </div>

          <!-- 步骤2: 扫描中 -->
          <div v-else-if="importStep === 'scanning'" class="import-step">
            <div class="spinner-row">
              <div class="spinner"></div>
              <span>{{ $t('instance.scanningDirectory') }}</span>
            </div>
          </div>

          <!-- 步骤3: 预览 -->
          <div v-else-if="importStep === 'preview'" class="import-step">
            <div class="scan-result" v-if="importScanResult">
              <div class="result-item">
                <span class="result-label">{{ $t('instance.gameVersionResult') }}</span>
                <span class="result-value">{{ importScanResult.mcVersion || $t('common.noData') }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">{{ $t('instance.loaderResult') }}</span>
                <span class="result-value"
                  >{{ importScanResult.loaderType || $t('instance.vanillaOption') }}
                  {{ importScanResult.loaderVersion }}</span
                >
              </div>
              <div class="result-item">
                <span class="result-label">{{ $t('instance.modCount') }}</span>
                <span class="result-value">{{ importScanResult.modsCount || 0 }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">{{ $t('instance.configFileCount') }}</span>
                <span class="result-value">{{ importScanResult.configCount || 0 }}</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="vox-btn" @click="closeImport">{{ $t('common.cancel') }}</button>
              <button class="vox-btn vox-btn--primary" @click="doImportFromDir">{{ $t('common.confirm') }}{{ $t('instance.import') }}</button>
            </div>
          </div>

          <!-- 步骤4: 导入中 -->
          <div v-else-if="importStep === 'importing'" class="import-step">
            <div class="spinner-row">
              <div class="spinner"></div>
              <span>{{ $t('instance.importingInstance') }}</span>
            </div>
          </div>

          <!-- 步骤5: 完成 -->
          <div v-else-if="importStep === 'done'" class="import-step">
            <div class="result-success">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-success)"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p>{{ $t('instance.importSuccess') }}</p>
            </div>
            <div class="modal-actions">
              <button class="vox-btn vox-btn--primary" @click="closeImport">{{ $t('common.finish') }}</button>
            </div>
          </div>

          <!-- 步骤6: 错误 -->
          <div v-else-if="importStep === 'error'" class="import-step">
            <div class="result-error">
              <p>{{ importError }}</p>
            </div>
            <div class="modal-actions">
              <button class="vox-btn" @click="closeImport">{{ $t('common.close') }}</button>
              <button class="vox-btn" @click="importStep = 'select'">{{ $t('instance.reselectBtn') }}</button>
            </div>
          </div>
        </div>

        <!-- Tab 2: 从 .mcla 导入 -->
        <div v-else-if="importTab === 'mcla'">
          <!-- 步骤1: 选择文件 -->
          <div v-if="mclaImportStep === 'select'" class="import-step">
            <p class="import-hint">
              {{ $t('instance.importFromMcla') }}
            </p>
            <div class="form-group">
              <label>{{ $t('instance.mclaFilePath') }}</label>
              <div class="dir-picker">
                <input class="vox-input" v-model="mclaFilePath" :placeholder="$t('instance.mclaPlaceholder')" readonly />
                <button class="vox-btn" @click="selectMclaFile">{{ $t('instance.selectMclaFile') }}</button>
              </div>
            </div>
            <div class="modal-actions" v-if="mclaFilePath">
              <button class="vox-btn" @click="closeImport">{{ $t('common.cancel') }}</button>
              <button class="vox-btn vox-btn--primary" @click="doImportMcla">{{ $t('common.confirm') }}{{ $t('instance.import') }}</button>
            </div>
          </div>

          <!-- 步骤2: 导入中 -->
          <div v-else-if="mclaImportStep === 'importing'" class="import-step">
            <div class="spinner-row">
              <div class="spinner"></div>
              <span>{{ $t('instance.importingInstance') }}</span>
            </div>
          </div>

          <!-- 步骤3: 完成 -->
          <div v-else-if="mclaImportStep === 'done'" class="import-step">
            <div class="result-success">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--voxver-success)"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p>{{ $t('instance.importSuccess') }}</p>
            </div>
            <div class="modal-actions">
              <button class="vox-btn vox-btn--primary" @click="closeImport">{{ $t('common.finish') }}</button>
            </div>
          </div>

          <!-- 步骤4: 错误 -->
          <div v-else-if="mclaImportStep === 'error'" class="import-step">
            <div class="result-error">
              <p>{{ importError }}</p>
            </div>
            <div class="modal-actions">
              <button class="vox-btn" @click="closeImport">{{ $t('common.close') }}</button>
              <button class="vox-btn" @click="mclaImportStep = 'select'">{{ $t('instance.reselectBtn') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出实例弹窗 -->
    <div class="modal-overlay" v-if="showExport" @click.self="showExport = false">
      <div class="modal-content vox-card">
        <h3>{{ $t('instance.export') }}{{ $t('instance.instance') }}</h3>
        <p class="export-desc">{{ $t('instance.export') }}为 .mcla 可分享包</p>
        <div class="export-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="exportOptions.includeMods" />
            {{ $t('mod.includeMods') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="exportOptions.includeConfigs" />
            {{ $t('mod.includeConfigs') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="exportOptions.includeSaves" />
            {{ $t('instance.includeSavesHint') }}
          </label>
        </div>
        <div class="modal-actions">
          <button class="vox-btn" @click="showExport = false">{{ $t('common.cancel') }}</button>
          <button class="vox-btn vox-btn--primary" @click="doExport" :disabled="exportLoading">
            {{ exportLoading ? $t('instance.export') + '...' : $t('instance.export') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import InstanceCard from '../components/InstanceCard.vue'
import type { ScanMinecraftResult } from '../env'

const { t } = useI18n()

// 实例类型（统一使用 camelCase）
interface Instance {
  id: string
  name: string
  path: string
  mc_version: string
  loader_type: 'vanilla' | 'forge' | 'fabric' | 'neoforge' | 'quilt'
  loader_version: string
  icon: string
  java_path: string
  jvm_args: string
  min_memory: number
  max_memory: number
  width: number
  height: number
  fullscreen: number
  is_favorited: number
  last_played: string | null
  play_time: number
  created_at: string
  updated_at: string
}

// 外部启动器实例
interface ExternalInstance {
  name: string
  version: string
  loaderType: string
  loaderVersion: string
  gameDir: string
  modCount: number
  source: string
}

interface ExternalLauncher {
  type: string
  name: string
  path: string
  instances: ExternalInstance[]
  detected: boolean
}

const router = useRouter()
const searchQuery = ref('')
const selectedId = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const instances = ref<Instance[]>([])

// ======== 筛选/排序/分组 ========
const filterLoader = ref<'all' | string>('all')
const filterFavorite = ref(false)
const sortBy = ref<'lastPlayed' | 'createdAt' | 'name' | 'mcVersion'>('lastPlayed')
const groupBy = ref<'none' | 'favorite' | 'loader' | 'mcVersion'>('none')

const loaderFilterOptions = [
  { value: 'vanilla', label: 'Vanilla' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'forge', label: 'Forge' },
  { value: 'neoforge', label: 'NeoForge' },
  { value: 'quilt', label: 'Quilt' }
]

// 自动检测到的版本
interface DetectedVersion {
  id: string
  name: string
  type: string
  baseVersion: string
  loaderInfo: string
  jarPath: string
  jsonPath: string
  lastPlayed?: number
}
const detectedVersions = ref<DetectedVersion[]>([])
const scanning = ref(false)
const currentMcPath = ref('')
const launchHistory = ref<Record<string, number>>({})

// 外部启动器
const externalLaunchers = ref<ExternalLauncher[]>([])
const scanningExternalLaunchers = ref(false)

async function loadLaunchHistory() {
  try {
    const saved = await window.electronAPI?.config?.get?.('launch_history')
    if (saved) {
      launchHistory.value = (typeof saved === 'object' ? saved : {}) as Record<string, number>
    }
  } catch {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.loadHistoryFailed'), type: 'error' })
  }
}

async function saveLaunchHistory() {
  try {
    await window.electronAPI?.config?.set?.('launch_history', launchHistory.value)
  } catch {
    console.error('保存启动历史失败')
  }
}

// 合并：把已管理实例（数据库）和扫描版本（当前文件夹未入库）去重

// 生成「已管理实例」的匹配键 —— 和 detectedVersion.id 格式（${mc}-${Loader}_${loaderVer} 或纯 mc）对齐
function managedInstanceKey(i: Instance): string {
  if (i.loader_type && i.loader_type !== 'vanilla' && i.loader_version) {
    return `${i.mc_version}-${capitalizeFirst(i.loader_type)}_${i.loader_version}`
  }
  return i.mc_version
}

// 只保留「不在库中的」扫描版本
const pendingImportList = computed<DetectedVersion[]>(() => {
  const managedKeys = new Set(instances.value.map(managedInstanceKey))
  const q = searchQuery.value?.toLowerCase() || ''
  return detectedVersions.value.filter((dv) => {
    if (managedKeys.has(dv.id)) return false
    if (q && !dv.id.toLowerCase().includes(q) && !dv.baseVersion.includes(q)) return false
    return true
  })
})

// 合并总计数（用于空状态 & section count 显示）
const mergedTotalCount = computed(() => filteredInstances.value.length + pendingImportList.value.length)

// 导入/导出状态
const showImport = ref(false)
const showExport = ref(false)
const importTab = ref<'dir' | 'mcla'>('dir')
const importStep = ref<'select' | 'scanning' | 'preview' | 'importing' | 'done' | 'error'>('select')
const importDir = ref('')
const importScanResult = ref<ScanMinecraftResult | null>(null)
const importError = ref('')
const mclaImportStep = ref<'select' | 'importing' | 'done' | 'error'>('select')
const mclaFilePath = ref('')
const exportLoading = ref(false)
const exportOptions = ref({ includeMods: true, includeConfigs: true, includeSaves: false })

// 封面色池 — Apple 主色 + 状态色（基于 ID 哈希分配，保持稳定）
const gradients = [
  'var(--voxver-primary)',
  'var(--voxver-success)',
  'var(--voxver-warning)',
  'var(--voxver-error)',
  '#0071e3',
  '#30b350',
  '#e08600',
  '#e0352b'
]

function getCoverGradient(inst: Instance): string {
  let hash = 0
  for (let i = 0; i < inst.id.length; i++) {
    hash = (hash << 5) - hash + inst.id.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function getCoverGradientForDetected(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}
 

function getLoaderLabel(inst: Instance): string {
  if (!inst.loader_type || inst.loader_type === 'vanilla') return ''
  if (inst.loader_version) return `${capitalizeFirst(inst.loader_type)} ${inst.loader_version}`
  return capitalizeFirst(inst.loader_type)
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// 从数据库加载实例列表
async function loadInstances() {
  try {
    const result = await window.electronAPI?.instance?.list()
    instances.value = (result || []) as Instance[]
  } catch (e) {
    instances.value = []
  }
}

// 获取当前 .minecraft 路径（仅使用用户明确选择过的路径，默认**不**回落到 C 盘的系统默认 .minecraft）
// 额外校验：候选路径必须仍存在于 folders.list 且磁盘上真实存在，否则当作"未配置"
async function getCurrentMcPath(): Promise<string> {
  try {
    const api = window.electronAPI

    // 1) folders.list：用户所有已知选择
    const knownList: string[] = (api?.folders?.list ? await api.folders.list() : []) ?? []
    const existsOnDisk = async (p: string) => (api?.path?.exists ? await api.path.exists(p) : true)

    // 2) 上次选中的文件夹（需同时满足：仍在 list 中 + 磁盘存在）
    const last = api?.folders?.getLast ? await api.folders.getLast() : null
    if (last && knownList.includes(last) && (await existsOnDisk(last))) return last

    // 3) 设置中的自定义路径（作为第二选择，需磁盘存在）
    const custom = api?.path?.getCustom ? await api.path.getCustom() : null
    if (custom && (await existsOnDisk(custom))) return custom

    // 4) list 第一个有效路径（用户没显式指定，但添加过文件夹时兜底）
    for (const p of knownList) {
      if (await existsOnDisk(p)) return p
    }

    // 注意：此处不再调用 path.getMinecraft()，避免在用户未显式选择时读取 C 盘默认目录
    return ''
  } catch {
    return ''
  }
}

// 扫描当前 .minecraft 目录下的版本
async function rescanVersions() {
  scanning.value = true
  try {
    const mcPath = await getCurrentMcPath()
    currentMcPath.value = mcPath
    if (!mcPath) {
      detectedVersions.value = []
      // 不再弹系统通知：已改为在主内容区（my-instances-section 顶部）显示 warning banner
      return
    }
    const res = await window.electronAPI?.versions?.scanFolder(mcPath)
    if (res?.ok && res.data) {
      detectedVersions.value = (res.data as DetectedVersion[]).map((v) => ({
        ...v,
        lastPlayed: launchHistory.value[v.id]
      }))
    }
  } catch {
    // 保留旧数据，不清空
  } finally {
    scanning.value = false
  }
}

// 在"无路径提示 banner"里直接点选 .minecraft 文件夹，添加 + 设为 last + 立即重扫
async function pickMcFolder() {
  const api = window.electronAPI
  if (!api?.dialog?.selectFolder) return
  try {
    const selected = await api.dialog.selectFolder()
    if (!selected) return
    if (api?.folders?.add) await api.folders.add(selected)
    if (api?.folders?.setLast) await api.folders.setLast(selected)
    await rescanVersions()
  } catch (e) {
    console.error('选择 .minecraft 文件夹失败:', e)
  }
}

// 版本颜色（保留向后兼容，新代码统一使用 getCoverGradient / getCoverGradientForDetected）
function getVersionColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}
function launchDetectedVersion(dv: DetectedVersion) {
  launchHistory.value[dv.id] = Date.now()
  saveLaunchHistory()
  window.electronAPI?.game?.launch?.('', '', dv.id)
  window.electronAPI?.notification?.send({ title: t('instance.launch'), body: t('instance.launching', { name: dv.id }), type: 'info' })
}

async function openDetectedFolder(dv: DetectedVersion) {
  try {
    const mcPath = currentMcPath.value || (await getCurrentMcPath())
    if (!mcPath) {
      // 不再弹系统通知：页面主内容区已显示 banner 引导用户选路径
      return
    }
    const sep = mcPath.includes('/') ? '/' : '\\'
    const versionPath = `${mcPath.replace(/[\\/]+$/, '')}${sep}versions${sep}${dv.id}`
    window.electronAPI?.shell?.openPath?.(versionPath)
  } catch {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.openFolderFailed'), type: 'error' })
  }
}

async function createInstanceFromDetected(dv: DetectedVersion) {
  try {
    // 仅使用用户显式选择过的路径（folders.last / path.custom），不再回落到 C 盘系统默认
    let customPath = ''
    try {
      const api = window.electronAPI
      if (api?.folders?.getLast) {
        const last = await api.folders.getLast()
        if (last) customPath = last
      }
      if (!customPath && api?.path?.getCustom) {
        const c = await api.path.getCustom()
        if (c) customPath = c
      }
    } catch (e) {
      console.error('获取自定义路径失败:', e)
    }

    await window.electronAPI?.instance?.create({
      name: dv.id,
      mcVersion: dv.baseVersion,
      loaderType: dv.loaderInfo?.toLowerCase().includes('forge')
        ? 'forge'
        : dv.loaderInfo?.toLowerCase().includes('fabric')
          ? 'fabric'
          : 'vanilla',
      customPath: customPath || undefined,
      loaderVersion: '',
      javaPath: '',
      minMemory: 512,
      maxMemory: 2048
    })

    await loadInstances()
    window.electronAPI?.notification?.send({
      title: t('instance.importInstance') || '导入实例',
      body: (t('instance.importToManagedSuccess') as string).replace('{name}', dv.id),
      type: 'success'
    })
  } catch {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.createFailed'), type: 'error' })
  }
}

// 筛选：搜索 + 加载器 + 收藏
const filteredInstances = computed(() => {
  return instances.value.filter((i) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!i.name.toLowerCase().includes(q) && !i.mc_version.includes(q)) return false
    }
    if (filterLoader.value !== 'all' && i.loader_type !== filterLoader.value) return false
    if (filterFavorite.value && i.is_favorited !== 1) return false
    return true
  })
})

// 排序：按用户选择
const sortedInstances = computed(() => {
  return [...filteredInstances.value].sort((a, b) => {
    // 排序规则前始终：收藏置顶（除非分组=收藏或排序字段已冲突）
    if (groupBy.value !== 'favorite' && sortBy.value !== 'name') {
      if (a.is_favorited !== b.is_favorited) return b.is_favorited - a.is_favorited
    }
    switch (sortBy.value) {
      case 'createdAt': {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      }
      case 'name':
        return a.name.localeCompare(b.name, 'zh-CN')
      case 'mcVersion':
        return b.mc_version.localeCompare(a.mc_version)
      case 'lastPlayed':
      default: {
        const ta = a.last_played ? new Date(a.last_played).getTime() : 0
        const tb = b.last_played ? new Date(b.last_played).getTime() : 0
        return tb - ta
      }
    }
  })
})

// 分组：基于 sortedInstances 再拆分
interface Group { key: string; label: string; items: Instance[] }
const groupedInstances = computed<Group[]>(() => {
  if (groupBy.value === 'none') {
    return [{ key: '__managed__', label: t('instance.managedInstances'), items: sortedInstances.value }]
  }
  const map = new Map<string, Group>()
  const order: string[] = []
  for (const inst of sortedInstances.value) {
    let key: string
    let label: string
    if (groupBy.value === 'favorite') {
      key = inst.is_favorited === 1 ? 'fav' : 'normal'
      label = inst.is_favorited === 1 ? '★ ' + t('instance.favorites') : t('instance.all')
    } else if (groupBy.value === 'loader') {
      key = inst.loader_type || 'vanilla'
      label = key === 'vanilla' ? 'Vanilla' : capitalizeFirst(key) + (inst.loader_version ? ' ' + inst.loader_version : '')
    } else {
      key = inst.mc_version
      label = inst.mc_version
    }
    if (!map.has(key)) {
      map.set(key, { key, label, items: [] })
      order.push(key)
    }
    map.get(key)!.items.push(inst)
  }
  return order.map((k) => map.get(k)!)
})

function selectInstance(inst: Instance) {
  selectedId.value = inst.id
}

function openInstance(inst: Instance) {
  router.push(`/instance/${inst.id}`)
}

function launchInstance(inst: Instance) {
  window.electronAPI?.game?.launch?.(inst.id, '', inst.mc_version)
}

async function openFolder(inst: Instance) {
  if (inst.path) {
    window.electronAPI?.shell?.openPath?.(inst.path)
  }
}

// 收藏切换
async function toggleFavorite(inst: Instance) {
  try {
    await window.electronAPI?.instance?.toggleFavorite(inst.id)
    await loadInstances()
  } catch {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.favorite') + t('common.error'), type: 'error' })
  }
}

// ====== 导入/导出 ======
async function selectImportDir() {
  const dir = await window.electronAPI?.dialog?.selectFolder()
  if (!dir) return
  importDir.value = dir
  await scanImportDir()
}

async function scanImportDir() {
  if (!importDir.value) return
  importStep.value = 'scanning'
  importError.value = ''
  try {
    const res = await window.electronAPI?.instance?.scanMinecraft(importDir.value)
    if (res?.ok && res.data) {
      importScanResult.value = res.data
      importStep.value = res.data.valid ? 'preview' : 'error'
      if (!res.data.valid) importError.value = res.data.suggestions?.[0] || '目录无效'
    } else {
      importStep.value = 'error'
      importError.value = res?.error || t('instance.scanFailed')
    }
  } catch (e: unknown) {
    importStep.value = 'error'
    importError.value = (e as Error).message
  }
}

// 从目录导入
async function doImportFromDir() {
  if (!importDir.value) return
  importStep.value = 'importing'
  try {
    const api = window.electronAPI
    // 尝试调用 importFromDir，如果不存在则提示暂不支持
    const importFromDir = (api?.instance as unknown as { importFromDir?: (dir: string) => Promise<unknown> })?.importFromDir
    if (!importFromDir) {
      importStep.value = 'error'
      importError.value = t('instance.notSupportedYet')
      return
    }
    const res = await importFromDir(importDir.value)
    const result = res as { ok?: boolean; error?: string }
    if (result?.ok) {
      importStep.value = 'done'
      await loadInstances()
    } else {
      importStep.value = 'error'
      importError.value = result?.error || t('instance.importFailed')
    }
  } catch (e: unknown) {
    importStep.value = 'error'
    importError.value = (e as Error).message
  }
}

// 选择 .mcla 文件
async function selectMclaFile() {
  const file = await window.electronAPI?.dialog?.selectFile({
    title: t('instance.importFromMcla') as string,
    filters: [{ name: 'MCLA', extensions: ['mcla'] }]
  })
  if (!file) return
  mclaFilePath.value = file
}

// 从 .mcla 导入
async function doImportMcla() {
  if (!mclaFilePath.value) return
  mclaImportStep.value = 'importing'
  importError.value = ''
  try {
    const minecraftPath = await window.electronAPI?.path?.getMinecraft()
    if (!minecraftPath) {
      mclaImportStep.value = 'error'
      importError.value = t('instance.cannotGetMinecraftDir')
      return
    }
    const res = await window.electronAPI?.instance?.importInstance(mclaFilePath.value, minecraftPath)
    if (res?.ok) {
      mclaImportStep.value = 'done'
      await loadInstances()
    } else {
      mclaImportStep.value = 'error'
      importError.value = res?.error || t('instance.importFailed')
    }
  } catch (e: unknown) {
    mclaImportStep.value = 'error'
    importError.value = (e as Error).message
  }
}

function closeImport() {
  showImport.value = false
  importStep.value = 'select'
  importDir.value = ''
  importScanResult.value = null
  importError.value = ''
  mclaImportStep.value = 'select'
  mclaFilePath.value = ''
}

async function doExport() {
  if (!selectedId.value) return
  exportLoading.value = true
  try {
    const destPath = await window.electronAPI?.dialog?.selectFile({
      title: t('instance.exportInstanceTitle') as string,
      filters: [{ name: t('instance.voxVerExportPackage') as string, extensions: ['mcla'] }]
    })
    if (!destPath) return
    const fullPath = destPath.endsWith('.mcla') ? destPath : destPath + '.mcla'
    const res = await window.electronAPI?.instance?.exportInstance(
      selectedId.value,
      fullPath,
      exportOptions.value
    )
    if (res?.ok) {
      showExport.value = false
    } else {
      window.electronAPI?.notification?.send({
        title: t('common.error'),
        body: (t('instance.exportFailed') as string).replace('{error}', res?.error || (t('download.unknownError') as string)),
        type: 'error'
      })
    }
  } finally {
    exportLoading.value = false
  }
}

function editInstance(inst: Instance) {
  router.push(`/instance/${inst.id}`)
}

// 确认删除（写入数据库）
async function confirmDeleteInstance(inst: Instance) {
  const firstConfirm = confirm(t('instance.deleteConfirm') + `「${inst.name}」？`)
  if (!firstConfirm) return
  const deleteFiles = confirm(t('instance.deleteFilesHint') + '\n\n' + t('instance.deleteFilesAlso') + '？')
  try {
    await window.electronAPI?.instance?.delete(inst.id, deleteFiles)
    await loadInstances()
    if (selectedId.value === inst.id) selectedId.value = ''
  } catch (e) {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.deleteFailed'), type: 'error' })
  }
}

// 扫描外部启动器
async function scanExternalLaunchers() {
  scanningExternalLaunchers.value = true
  try {
    const res = await window.electronAPI?.externalLauncher?.detect()
    if (res?.success && res.data) {
      externalLaunchers.value = res.data.filter((l) => l.detected && l.instances.length > 0)
    }
  } catch {
    // 静默失败
  } finally {
    scanningExternalLaunchers.value = false
  }
}

// 导入外部实例
async function importExternalInstance(extInst: ExternalInstance) {
  try {
    await window.electronAPI?.instance?.create({
      name: extInst.name,
      mcVersion: extInst.version,
      loaderType: extInst.loaderType || 'vanilla',
      customPath: extInst.gameDir,
      loaderVersion: extInst.loaderVersion || '',
      javaPath: '',
      minMemory: 512,
      maxMemory: 2048
    })
    await loadInstances()
    window.electronAPI?.notification?.send({
      title: t('instance.import'),
      body: t('instance.importExternalSuccess'),
      type: 'success'
    })
  } catch {
    window.electronAPI?.notification?.send({ title: t('common.error'), body: t('instance.importFailed'), type: 'error' })
  }
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return t('instance.neverPlayed') as string
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return t('instance.unknown') as string
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return (t('instance.minutesAgo') as string).replace('{n}', String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 24) return (t('instance.hoursAgo') as string).replace('{n}', String(hours))
  const days = Math.floor(hours / 24)
  if (days < 30) return (t('instance.daysAgo') as string).replace('{n}', String(days))
  return (t('instance.monthsAgo') as string).replace('{n}', String(Math.floor(days / 30)))
}

onMounted(async () => {
  await loadLaunchHistory()
  loadInstances()
  rescanVersions()
  scanExternalLaunchers()
})
</script>

<style scoped lang="scss">
.instances-page {
  padding: 20px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ====== 工具栏 ====== */
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.page-title {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: var(--voxver-text-primary);
}

.instance-count {
  font-size: 12px;
  color: var(--voxver-text-muted);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-sm);
  border: none;

  .toggle-btn {
    width: 32px;
    height: 30px;
    border: none;
    background: transparent;
    color: var(--voxver-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    transition: all 0.12s;

    &:hover {
      color: var(--voxver-text-secondary);
    }
    &.active {
      background: color-mix(in oklab, var(--voxver-primary) 10%, transparent);
      color: var(--voxver-primary-600);
    }
  }
}

/* ====== 搜索 ====== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: color-mix(in oklab, var(--voxver-bg-elevated) 72%, transparent);
  border: 1px solid var(--voxver-border-color-light);
  border-radius: var(--voxver-radius-sm);
  margin-bottom: 16px;
  flex-shrink: 0;

  svg {
    color: var(--voxver-text-muted);
    flex-shrink: 0;
  }
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--voxver-text-primary);
    background: transparent;

    &::placeholder {
      color: var(--voxver-text-muted);
    }
  }
}

/* ====== 当前路径提示 ====== */
.current-mc-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--voxver-text-muted);
  margin-bottom: 12px;
  flex-shrink: 0;
  padding: 0 2px;

  svg {
    flex-shrink: 0;
    opacity: 0.7;
  }
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ====== 区块通用样式 ====== */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--voxver-border-color-light);
}

.section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--voxver-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    color: var(--voxver-primary);
    flex-shrink: 0;
  }
}

.section-count {
  font-size: 11px;
  color: var(--voxver-text-muted);
  background: color-mix(in oklab, var(--voxver-text) 8%, transparent);
  padding: 1px 8px;
  border-radius: 10px;
}

/* ====== 我的实例 ====== */
.my-instances-section {
  margin-bottom: 20px;
  flex-shrink: 0;
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  padding: 14px;
}

.my-instances-empty {
  flex: none;
  padding: 20px 0;
}

/* 主内容区警告 banner：无路径时显示，直接嵌在 my-instances-section 顶部 */
.mc-path-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border-radius: var(--voxver-radius-md);
  background: color-mix(in oklab, var(--voxver-warning) 12%, transparent);
  border: 1px solid color-mix(in oklab, var(--voxver-warning) 32%, var(--voxver-border-color-light));
  color: var(--voxver-text-primary);

  &__icon {
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--voxver-warning);
    background: color-mix(in oklab, var(--voxver-warning) 18%, transparent);
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 2px;
  }

  &__desc {
    font-size: 12px;
    color: var(--voxver-text-muted);
    line-height: 1.5;
  }

  &__actions {
    flex: none;
  }
}

/* 我的实例 section header：右侧放扫描 spinner + 计数（当有 scanning 时显示 spinner） */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.section-header-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 刷新按钮（在 filter-row 内） */
.refresh-btn {
  padding: 0 8px;
  min-width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 分组头：已管理（✓ 图标，中性色） vs 待导入（🔍 图标，主色调） */
.managed-group-header {
  color: var(--voxver-text-primary);

  svg {
    color: var(--voxver-success);
  }
}

.pending-group-header {
  margin-top: 12px;

  svg {
    color: var(--voxver-primary);
  }

  h4.group-title {
    color: color-mix(in oklab, var(--voxver-primary) 72%, var(--voxver-text-primary));
  }
}

/* 待导入卡片：视觉上轻一些，边框偏主色提示待认领 */
.pending-card {
  border: 1px dashed color-mix(in oklab, var(--voxver-primary) 32%, var(--voxver-border-color));
  background: color-mix(in oklab, var(--voxver-primary) 5%, var(--voxver-bg-card));
}

/* 待导入 list item：一样的虚线边框视觉区分 */
.pending-list-item {
  border: 1px dashed color-mix(in oklab, var(--voxver-primary) 32%, var(--voxver-border-color));
  background: color-mix(in oklab, var(--voxver-primary) 5%, var(--voxver-bg-card));
}

/* 刷新按钮旋转动画 */
.spinning {
  animation: spin 0.8s linear infinite;
}

/* ====== 网格视图 ====== */
.instance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.instance-card {
  overflow: hidden;
  cursor: pointer;
  transition: all var(--voxver-transition-normal);
  display: flex;
  flex-direction: column;
  min-height: 180px;
  height: auto;

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
  }

  &.selected {
    border: 1px solid var(--voxver-primary);
  }
}

/* 封面 */
.card-cover {
  height: 80px; /* 减小封面高度 */
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
  background: rgb(0 0 0 / 0.12);
  }
}

.cover-loader-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 600;
  color: var(--voxver-text-inverse);
  background: rgb(0 0 0 / 0.35);
  backdrop-filter: blur(4px);
  border-radius: var(--voxver-radius-xs);
  letter-spacing: 0.3px;
}

.cover-version-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  z-index: 1;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--voxver-text-inverse);
  background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(4px);
  border-radius: var(--voxver-radius-xs);
}

/* 信息区 */
.card-body {
  padding: 8px 12px 6px;
  flex: 1;

  .card-name {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--voxver-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-meta {
    margin: 3px 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    color: var(--voxver-text-muted);

    svg {
      flex-shrink: 0;
      opacity: 0.7;
    }
  }
}

/* 操作按钮 */
.card-actions {
  display: flex;
  border-top: 1.5px solid var(--voxver-border-color);
  padding: 2px;

  .action-btn {
    flex: 1;
    height: 34px;
    border: none;
    background: transparent;
    color: var(--voxver-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    transition: all 0.12s;

    &:hover {
      background: var(--voxver-bg-tertiary);
      color: var(--voxver-primary-600);
    }

    &.launch {
      &:hover {
        background: var(--voxver-primary);
        color: #fff;
      }
    }

    &.danger {
      &:hover {
        background: var(--voxver-error-bg);
        color: var(--voxver-error);
      }
    }
  }
}

/* ====== 列表视图 ====== */
.instance-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background var(--voxver-transition-fast);

  &:hover {
    background: color-mix(in oklab, var(--voxver-primary) 6%, transparent);
  }

  &.selected {
    outline: 2px solid var(--voxver-primary);
    outline-offset: -1px;
  }
}

.list-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--voxver-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .list-icon-ver {
    font-size: 10px;
    font-weight: 700;
    color: var(--voxver-text-inverse);
  }
}

.list-info {
  flex: 1;
  min-width: 0;

  .list-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--voxver-text-primary);
  }

  .list-meta {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

.list-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;

  .list-item:hover & {
    opacity: 1;
  }

  .action-btn {
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    color: var(--voxver-primary-500);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--voxver-radius-sm);
    transition: all 0.12s;

    &:hover {
      background: var(--voxver-primary);
      color: #fff;
    }
    &.danger {
      color: var(--voxver-error);
      &:hover {
        background: var(--voxver-error);
        color: #fff;
      }
    }
  }
}

/* ====== 空状态 ====== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--voxver-text-secondary);
  padding: 30px 0;

  p {
    margin: 0 0 6px;
    font-size: 14px;
  }
  .hint {
    font-size: 12px;
    color: var(--voxver-text-muted);
  }
}

/* ====== 外部启动器 ====== */
.external-launchers-section {
  margin-bottom: 20px;
  flex-shrink: 0;
  background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  border-radius: var(--voxver-radius-md);
  border: 1px solid var(--voxver-border-color-light);
  padding: 14px;
}

.launcher-group {
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.launcher-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.launcher-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
}

.launcher-count {
  font-size: 11px;
  color: var(--voxver-text-muted);
}

.external-instance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.external-instance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  gap: 12px;
}

.ext-info {
  flex: 1;
  min-width: 0;

  .ext-name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--voxver-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ext-meta {
    margin: 2px 0 0;
    font-size: 11px;
    color: var(--voxver-text-muted);
  }
}

.ext-import-btn {
  flex-shrink: 0;
  font-size: 12px;
  padding: 4px 12px;
}

/* ====== 弹窗 ====== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--voxver-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(4px);
}

.modal-content {
  padding: 28px 24px;
  width: 420px;
  max-width: 90vw;
  box-shadow: var(--voxver-shadow-xl);
  border-radius: var(--voxver-radius-xl);

  h3 {
    margin: 0 0 20px;
    font-size: 17px;
    font-weight: 700;
    color: var(--voxver-text-primary);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group {
  flex: 1;
  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--voxver-text-secondary);
    margin-bottom: 5px;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

/* ====== 导入/导出弹窗 ====== */
.import-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: color-mix(in oklab, var(--voxver-bg-primary) 60%, transparent);
  border-radius: var(--voxver-radius-sm);
  padding: 3px;
}

.import-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--voxver-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--voxver-radius-xs);
  transition: all 0.15s;

  &:hover {
    color: var(--voxver-text-secondary);
  }

  &.active {
    background: var(--voxver-primary);
    color: #fff;
    font-weight: 600;
  }
}

.import-hint {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

.dir-picker {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
  }
}

.import-step {
  min-height: 80px;
  display: flex;
  flex-direction: column;
}

.spinner-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--voxver-text-muted);
  font-size: 13px;
  padding: 20px 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ========== 筛选/排序/分组工具栏 ========== */
.toolbar-row {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.toolbar-row .search-bar {
  flex: 1 1 240px;
  margin-bottom: 0;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.filter-pills {
  display: flex;
  gap: 4px;
  background: var(--voxver-bg-tertiary);
  padding: 3px;
  border-radius: var(--voxver-radius-full);
  border: 1px solid var(--voxver-border-color-light);
}

.pill {
  border: none;
  background: transparent;
  padding: 5px 12px;
  border-radius: var(--voxver-radius-full);
  font-size: 12px;
  color: var(--voxver-text-secondary);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    color: var(--voxver-text-primary);
    background: color-mix(in oklab, var(--voxver-text) 4%, transparent);
  }

  &.active {
    background: var(--voxver-accent);
    color: #fff;
    font-weight: 500;
  }
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--voxver-border-color);
  background: var(--voxver-bg-tertiary);
  color: var(--voxver-text-muted);
  border-radius: var(--voxver-radius-md);
  cursor: pointer;
  transition: all var(--voxver-transition-fast);

  &:hover {
    color: var(--voxver-warning);
    border-color: color-mix(in oklab, var(--voxver-warning) 40%, var(--voxver-border-color));
  }

  &.active {
    color: var(--voxver-warning);
    background: color-mix(in oklab, var(--voxver-warning) 8%, transparent);
    border-color: color-mix(in oklab, var(--voxver-warning) 40%, var(--voxver-border-color));
  }
}

.sort-select {
  width: 150px;
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--voxver-radius-md);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 10px;
  padding: 0 2px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--voxver-text-secondary);
  margin: 0;
  letter-spacing: 0.2px;
}

.group-count {
  font-size: 11px;
  font-family: var(--voxver-font-mono);
  color: var(--voxver-text-muted);
  background: var(--voxver-bg-tertiary);
  border: 1px solid var(--voxver-border-color-light);
  padding: 1px 6px;
  border-radius: var(--voxver-radius-full);
}


.scan-result {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .result-label {
    font-size: 11px;
    color: var(--voxver-text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }

  .result-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--voxver-text-primary);
  }
}

.result-success,
.result-error {
  text-align: center;
  padding: 20px 0;

  p {
    margin: 12px 0 0;
    font-size: 14px;
    color: var(--voxver-text-primary);
  }
}

.result-error p {
  color: var(--voxver-error);
}

/* 导出选项 */
.export-desc {
  font-size: 13px;
  color: var(--voxver-text-secondary);
  margin: -12px 0 16px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--voxver-text-primary);
  cursor: pointer;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--voxver-primary);
  }
}

/* * ===== 动画 ===== */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--voxver-border-color);
  border-top-color: var(--voxver-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
</style>