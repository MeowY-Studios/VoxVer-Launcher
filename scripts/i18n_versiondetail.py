import re

with open('e:/Creation/Project/TEST/mcl/src/pages/VersionDetail.vue', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('<h1 class="vd-title">版本详情</h1>', '<h1 class="vd-title">$t(\'version.detail\')</h1>'),
    ('<span>加载中...</span>', '<span>$t(\'download.loading\')</span>'),
    ('<h3 class="section-title">附加内容</h3>', '<h3 class="section-title">$t(\'version.addons\')</h3>'),
    ('<p class="section-hint">选择一个 ModLoader 类型，为版本添加对应的加载器 支持</p>', '<p class="section-hint">$t(\'version.selectLoaderHint\')</p>'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('e:/Creation/Project/TEST/mcl/src/pages/VersionDetail.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
