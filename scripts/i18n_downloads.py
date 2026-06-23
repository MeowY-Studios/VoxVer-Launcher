import re

with open('e:/Creation/Project/TEST/mcl/src/pages/DownloadsPage.vue', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('title="另存为"', ':title="$t(\'download.saveAs\')"'),
    ('title=" 更新日志"', ':title="$t(\'download.changelog\')"'),
    ('title="下载服务端"', ':title="$t(\'download.downloadServer\')"'),
    ("'加载中...'", "$t('download.loading')"),
    ("'无匹配结果'", "$t('download.noResults')"),
    ("'加载更多版本'", "$t('download.loadMoreVersions')"),
    ("'加载更多'", "$t('download.loadMore')"),
    ('title="回到顶部"', ':title="$t(\'download.backToTop\')"'),
    ('<span class="acc-title">正式版</span>', '<span class="acc-title">$t(\'download.release\')</span>'),
    ('<span class="acc-count">{{ releaseVersions.length }} 个版本</span>', '<span class="acc-count">{{ releaseVersions.length }} $t(\'download.versions\')</span>'),
    ('<span class="ver-type-tag release">正式版</span>', '<span class="ver-type-tag release">$t(\'download.release\')</span>'),
    ('<span class="acc-title">预览版</span>', '<span class="acc-title">$t(\'download.snapshotVersion\')</span>'),
    ('<span class="acc-count">{{ snapshotVersions.length }} 个版本</span>', '<span class="acc-count">{{ snapshotVersions.length }} $t(\'download.versions\')</span>'),
    ('<span class="ver-type-tag snapshot">快照</span>', '<span class="ver-type-tag snapshot">$t(\'download.snapshot\')</span>'),
    ('<span class="acc-title">远古版</span>', '<span class="acc-title">$t(\'download.oldVersion\')</span>'),
    ('<span class="acc-count">{{ oldVersions.length }} 个版本</span>', '<span class="acc-count">{{ oldVersions.length }} $t(\'download.versions\')</span>'),
    ('<span class="ver-type-tag old">旧版</span>', '<span class="ver-type-tag old">$t(\'download.oldAlpha\')</span>'),
    ('<span class="acc-title">愚人节版</span>', '<span class="acc-title">$t(\'download.aprilVersion\')</span>'),
    ('<span class="acc-count">{{ aprilVersions.length }} 个版本</span>', '<span class="acc-count">{{ aprilVersions.length }} $t(\'download.versions\')</span>'),
    ('<span class="ver-type-tag april">愚人节</span>', '<span class="ver-type-tag april">$t(\'download.aprilVersion\')</span>'),
    ('<label>名称</label>', '<label>$t(\'download.name\')</label>'),
    ('placeholder="输入关键词搜索..."', 'placeholder="$t(\'download.enterKeyword\')"'),
    ('<label>来源</label>', '<label>$t(\'download.source\')</label>'),
    ('<option value="all">全部</option>', '<option value="all">$t(\'download.all\')</option>'),
    ('<label>版本</label>', '<label>$t(\'download.version\')</label>'),
    ('<label>加载器</label>', '<label>$t(\'download.loader\')</label>'),
    ('<option value="">任意 Mod 加载器</option>', '<option value="">$t(\'download.anyLoader\')</option>'),
    ('<label>类型</label>', '<label>$t(\'download.type\')</label>'),
    ('<button class="btn-search" @click="doSearch">搜索</button>', '<button class="btn-search" @click="doSearch">$t(\'download.search\')</button>'),
    ('<button class="btn-reset" @click="resetSearch">重置条件</button>', '<button class="btn-reset" @click="resetSearch">$t(\'download.resetFilters\')</button>'),
    ("<button v-if=\"activeCategory === 'modpack'\" class=\"btn-secondary\">安装已有整合包</button>", "<button v-if=\"activeCategory === 'modpack'\" class=\"btn-secondary\">$t('download.installExistingModpack')</button>"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('e:/Creation/Project/TEST/mcl/src/pages/DownloadsPage.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
