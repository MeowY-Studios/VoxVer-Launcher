import re

with open('e:/Creation/Project/TEST/mcl/src/pages/InstanceDetail.vue', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('返回实例列表', '$t(\'instance.backToList\')'),
    ('<span v-else class="loading-placeholder">加载中...</span>', '<span v-else class="loading-placeholder">$t(\'download.loading\')</span>'),
    ('title="分享实例"', ':title="$t(\'instance.share\')"'),
    ('title="收藏"', ':title="$t(\'instance.favorite\')"'),
    ('title="打开游戏目录"', ':title="$t(\'instance.openFolder\')"'),
    ('<p>正在加载实例信息...</p>', '<p>$t(\'instance.loadingInfo\')</p>'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('e:/Creation/Project/TEST/mcl/src/pages/InstanceDetail.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
