import re

with open('e:/Creation/Project/TEST/mcl/src/pages/InstancesPage.vue', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('<h2 class="page-title">实例管理</h2>', '<h2 class="page-title">$t(\'instance.manager\')</h2>'),
    ('<span class="instance-count">{{ instances.length }} 个实例</span>', '<span class="instance-count">{{ instances.length }} $t(\'instance.count\')</span>'),
    ('title="网格视图"', ':title="$t(\'instance.gridView\')"'),
    ('title="列表视图"', ':title="$t(\'instance.listView\')"'),
    ('新建实例', '$t(\'instance.newInstance\')'),
    ('title="导入实例"', ':title="$t(\'instance.import\')"'),
    ('导入', '$t(\'instance.import\')'),
    ('title="导出选中实例"', ':title="$t(\'instance.exportSelected\')"'),
    ('导出', '$t(\'instance.export\')'),
    ('placeholder="搜索实例名称或版本..."', 'placeholder="$t(\'instance.searchInstance\')"'),
    ("'从未启动'", "$t('instance.neverPlayed')"),
    ('title="启动"', ':title="$t(\'instance.launch\')"'),
    ('title="打开 文件夹"', ':title="$t(\'instance.openFolder\')"'),
    ('title="设 置"', ':title="$t(\'instance.settings\')"'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('e:/Creation/Project/TEST/mcl/src/pages/InstancesPage.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
