import re

with open('e:/Creation/Project/TEST/mcl/src/pages/InstancesPage.vue', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('<h3>$t(\'instance.import\')已有实例</h3>', '<h3>{{ $t(\'instance.import\') }}已有实例</h3>'),
    ('<button class="btn-primary" @click="doImport">确认$t(\'instance.import\')</button>', '<button class="btn-primary" @click="doImport">确认{{ $t(\'instance.import\') }}</button>'),
    ('<span>正在$t(\'instance.import\')...</span>', '<span>正在{{ $t(\'instance.import\') }}...</span>'),
    ('<p>$t(\'instance.import\')成功！</p>', '<p>{{ $t(\'instance.import\') }}成功！</p>'),
    ('<h3>$t(\'instance.export\')实例</h3>', '<h3>{{ $t(\'instance.export\') }}实例</h3>'),
    ('<p class="export-desc">将选中实例$t(\'instance.export\')为 .mcla 可分享包</p>', '<p class="export-desc">将选中实例{{ $t(\'instance.export\') }}为 .mcla 可分享包</p>'),
    ("body: '$t('instance.export')失败: ' + (res?.error || '未知错误'),", "body: '导出失败: ' + (res?.error || '未知错误'),"),
    ('if (!dateStr) return $t(\'instance.neverPlayed\')', 'if (!dateStr) return \'从未启动\''),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('e:/Creation/Project/TEST/mcl/src/pages/InstancesPage.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
