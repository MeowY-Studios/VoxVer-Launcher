import os

components_dir = 'e:/Creation/Project/TEST/mcl/src/components'

replacements = {
    'InstanceCard.vue': [
        ('title="启动"', ':title="$t(\'instance.launch\')"'),
        ('title="详情"', ':title="$t(\'instance.detail\')"'),
        ('title="删除"', ':title="$t(\'instance.delete\')"'),
    ],
    'ModCard.vue': [
        ('title="下载"', ':title="$t(\'download.download\')"'),
        ('title="详情"', ':title="$t(\'mod.detail\')"'),
    ],
    'VersionSelect.vue': [
        ('title="刷新"', ':title="$t(\'version.refresh\')"'),
        ('placeholder="搜索版本..."', 'placeholder="$t(\'version.searchPlaceholder\')"'),
    ],
    'PxModal.vue': [
        ('确定', '$t(\'common.ok\')'),
        ('取消', '$t(\'common.cancel\')'),
    ],
}

for filename, changes in replacements.items():
    filepath = os.path.join(components_dir, filename)
    if not os.path.exists(filepath):
        subdirs = ['account', 'common', 'download', 'instance', 'launch', 'share']
        found = False
        for subdir in subdirs:
            filepath = os.path.join(components_dir, subdir, filename)
            if os.path.exists(filepath):
                found = True
                break
        if not found:
            filepath = os.path.join(components_dir, filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in changes:
            content = content.replace(old, new)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'Updated {filepath}')
    except FileNotFoundError:
        print(f'File not found: {filepath}')

print('Done')
