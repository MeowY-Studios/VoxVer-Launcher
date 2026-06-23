import os

src_dir = 'e:/Creation/Project/TEST/mcl/src'

files_to_fix = [
    'pages/DownloadsPage.vue',
    'pages/InstancesPage.vue',
]

for filepath in files_to_fix:
    full_path = os.path.join(src_dir, filepath)
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('<h3 class="dl-title">$t(\'download.vanilla\')</h3>', '<h3 class="dl-title">{{ $t(\'download.vanilla\') }}</h3>')
    content = content.replace('<p class="dl-subtitle">$t(\'download.vanillaSubtitle\')</p>', '<p class="dl-subtitle">{{ $t(\'download.vanillaSubtitle\') }}</p>')
    content = content.replace('placeholder="$t(\'download.searchVersion\')"', ':placeholder="$t(\'download.searchVersion\')"')
    content = content.replace('<span class="acc-title">$t(\'download.release\')</span>', '<span class="acc-title">{{ $t(\'download.release\') }}</span>')
    content = content.replace('<span class="ver-type-tag release">$t(\'download.release\')</span>', '<span class="ver-type-tag release">{{ $t(\'download.release\') }}</span>')
    content = content.replace('<span class="acc-title">$t(\'download.snapshotVersion\')</span>', '<span class="acc-title">{{ $t(\'download.snapshotVersion\') }}</span>')
    content = content.replace('<span class="ver-type-tag snapshot">$t(\'download.snapshot\')</span>', '<span class="ver-type-tag snapshot">{{ $t(\'download.snapshot\') }}</span>')
    content = content.replace('<span class="acc-title">$t(\'download.oldVersion\')</span>', '<span class="acc-title">{{ $t(\'download.oldVersion\') }}</span>')
    content = content.replace('<span class="ver-type-tag old">$t(\'download.oldAlpha\')</span>', '<span class="ver-type-tag old">{{ $t(\'download.oldAlpha\') }}</span>')
    content = content.replace('<span class="acc-title">$t(\'download.aprilVersion\')</span>', '<span class="acc-title">{{ $t(\'download.aprilVersion\') }}</span>')
    content = content.replace('<span class="ver-type-tag april">$t(\'download.aprilVersion\')</span>', '<span class="ver-type-tag april">{{ $t(\'download.aprilVersion\') }}</span>')
    content = content.replace('<label>$t(\'download.name\')</label>', '<label>{{ $t(\'download.name\') }}</label>')
    content = content.replace('placeholder="$t(\'download.enterKeyword\')"', ':placeholder="$t(\'download.enterKeyword\')"')
    content = content.replace('<label>$t(\'download.source\')</label>', '<label>{{ $t(\'download.source\') }}</label>')
    content = content.replace('<option value="all">$t(\'download.all\')</option>', '<option value="all">{{ $t(\'download.all\') }}</option>')
    content = content.replace('<label>$t(\'download.version\')</label>', '<label>{{ $t(\'download.version\') }}</label>')
    content = content.replace('<label>$t(\'download.loader\')</label>', '<label>{{ $t(\'download.loader\') }}</label>')
    content = content.replace('<option value="">$t(\'download.anyLoader\')</option>', '<option value="">{{ $t(\'download.anyLoader\') }}</option>')
    content = content.replace('<label>$t(\'download.type\')</label>', '<label>{{ $t(\'download.type\') }}</label>')
    content = content.replace('<button class="btn-search" @click="doSearch">$t(\'download.search\')</button>', '<button class="btn-search" @click="doSearch">{{ $t(\'download.search\') }}</button>')
    content = content.replace('<button class="btn-reset" @click="resetSearch">$t(\'download.resetFilters\')</button>', '<button class="btn-reset" @click="resetSearch">{{ $t(\'download.resetFilters\') }}</button>')
    content = content.replace("<button v-if=\"activeCategory === 'modpack'\" class=\"btn-secondary\">$t('download.installExistingModpack')</button>", "<button v-if=\"activeCategory === 'modpack'\" class=\"btn-secondary\">{{ $t('download.installExistingModpack') }}</button>")
    content = content.replace('<p class="load-text">$t(\'download.loading\') {{ categoryLabel }} $t(\'download.list\')', '<p class="load-text">{{ $t(\'download.loading\') }} {{ categoryLabel }} {{ $t(\'download.list\') }}')

    content = content.replace('<h2 class="page-title">$t(\'instance.manager\')</h2>', '<h2 class="page-title">{{ $t(\'instance.manager\') }}</h2>')
    content = content.replace('          $t(\'instance.newInstance\')', '          {{ $t(\'instance.newInstance\') }}')
    content = content.replace('          $t(\'instance.import\')', '          {{ $t(\'instance.import\') }}')
    content = content.replace('          $t(\'instance.export\')', '          {{ $t(\'instance.export\') }}')
    content = content.replace('placeholder="$t(\'instance.searchInstance\')"', ':placeholder="$t(\'instance.searchInstance\')"')

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Fixed {filepath}')

print('Done')