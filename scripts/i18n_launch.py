import re

with open('e:/Creation/Project/TEST/mcl/src/pages/LaunchPage.vue', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('title="恢复默认路径"', ':title="$t(\'launch.restoreDefaultPath\')"'),
    ('title="修改路径"', ':title="$t(\'launch.changePath\')"'),
    ('title="打开目录"', ':title="$t(\'launch.openFolder\')"'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('e:/Creation/Project/TEST/mcl/src/pages/LaunchPage.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
