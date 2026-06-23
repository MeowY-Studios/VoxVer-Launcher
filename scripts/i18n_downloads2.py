import re

with open('e:/Creation/Project/TEST/mcl/src/pages/DownloadsPage.vue', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('<h3 class="dl-title">原版游戏</h3>', '<h3 class="dl-title">$t(\'download.vanilla\')</h3>'),
    ('<p class="dl-subtitle">选择 Minecraft 版本下载</p>', '<p class="dl-subtitle">$t(\'download.vanillaSubtitle\')</p>'),
    ('placeholder="搜索版本号..."', 'placeholder="$t(\'download.searchVersion\')"'),
    ('title="刷新"', ':title="$t(\'download.refresh\')"'),
    ('{{ allVersions.filter((v) => v.type === \'release\').length }} 个版本', '{{ allVersions.filter((v) => v.type === \'release\').length }} $t(\'download.versions\')'),
    ('{{ allVersions.filter((v) => v.type === \'snapshot\').length }} 个版本', '{{ allVersions.filter((v) => v.type === \'snapshot\').length }} $t(\'download.versions\')'),
    ('{{ allVersions.filter((v) => v.type === \'old_alpha\' || v.type === \'old_beta\').length }} 个版本', '{{ allVersions.filter((v) => v.type === \'old_alpha\' || v.type === \'old_beta\').length }} $t(\'download.versions\')'),
    ('{{ allVersions.filter((v) => v.type === \'april_fools\').length }} 个版本', '{{ allVersions.filter((v) => v.type === \'april_fools\').length }} $t(\'download.versions\')'),
    ('正在获取 {{ categoryLabel }} 列表', '$t(\'download.loading\') {{ categoryLabel }} $t(\'download.list\')'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('e:/Creation/Project/TEST/mcl/src/pages/DownloadsPage.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
