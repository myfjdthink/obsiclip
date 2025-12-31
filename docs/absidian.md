插件调用 Obsidian 新增文章的关键指令是通过 Obsidian URL 方案实现的，核心是 `obsidian://new?` URL 的构造和发送。 [1](#0-0) 

## 关键指令流程

### 1. URL 构造
`saveToObsidian()` 函数根据模板行为构造不同的 Obsidian URL： [2](#0-1) 

- **新建笔记**：`obsidian://new?file={path+filename}`
- **日记**：`obsidian://daily?`
- **附加参数**：`&append=true`, `&prepend=true`, `&overwrite=true`

### 2. 集成方式
插件提供两种集成方式： [3](#0-2) 

- **剪贴板模式**（默认）：复制内容到剪贴板，URL 添加 `&clipboard` 参数
- **传统模式**：直接在 URL 中编码内容，添加 `&content={encodedContent}`

### 3. URL 发送
通过 `openObsidianUrl()` 函数发送 URL： [4](#0-3) 

```typescript
browser.runtime.sendMessage({
    action: "openObsidianUrl", 
    url: obsidianUrl
})
```

### 4. UI 触发
用户界面中的主要触发点是 `handleClipObsidian()` 函数： [5](#0-4) 

## 完整示例

创建新笔记的完整 URL 示例：
```
obsidian://new?file=Clippings/My%20Article&vault=MyVault&silent=true&clipboard
```

这个 URL 告诉 Obsidian：
- 在 `MyVault` 仓库中
- 创建路径为 `Clippings/My Article` 的新笔记
- 静默打开（不切换到前台）
- 从剪贴板读取内容

## Notes

- 插件支持多种行为模式：新建、追加、前置、覆盖等 [6](#0-5) 
- 文件名会通过 `sanitizeFileName()` 进行清理 [7](#0-6) 
- 需要 Obsidian 1.7.2 或更高版本支持完整功能 [8](#0-7) 

Wiki pages you might want to explore:
- [Popup Interface (obsidianmd/obsidian-clipper)](/wiki/obsidianmd/obsidian-clipper#3.1)
- [Filter System and Variables (obsidianmd/obsidian-clipper)](/wiki/obsidianmd/obsidian-clipper#5.2)
- [Obsidian Integration (obsidianmd/obsidian-clipper)](/wiki/obsidianmd/obsidian-clipper#7)

### Citations

**File:** src/utils/obsidian-note-creator.ts (L71-79)
```typescript
function openObsidianUrl(url: string): void {
	browser.runtime.sendMessage({
		action: "openObsidianUrl",
		url: url
	}).catch((error) => {
		console.error('Error opening Obsidian URL via background script:', error);
		window.open(url, '_blank');
	});
}
```

**File:** src/utils/obsidian-note-creator.ts (L98-146)
```typescript
export async function saveToObsidian(
	fileContent: string,
	noteName: string,
	path: string,
	vault: string,
	behavior: Template['behavior'],
): Promise<void> {
	let obsidianUrl: string;

	const isDailyNote = behavior === 'append-daily' || behavior === 'prepend-daily';

	if (isDailyNote) {
		obsidianUrl = `obsidian://daily?`;
	} else {
		// Ensure path ends with a slash
		if (path && !path.endsWith('/')) {
			path += '/';
		}

		const formattedNoteName = sanitizeFileName(noteName);
		obsidianUrl = `obsidian://new?file=${encodeURIComponent(path + formattedNoteName)}`;
	}

	if (behavior.startsWith('append')) {
		obsidianUrl += '&append=true';
	} else if (behavior.startsWith('prepend')) {
		obsidianUrl += '&prepend=true';
	} else if (behavior === 'overwrite') {
		obsidianUrl += '&overwrite=true';
	}

	const vaultParam = vault ? `&vault=${encodeURIComponent(vault)}` : '';
	obsidianUrl += vaultParam;

	// Add silent parameter if silentOpen is enabled
	if (generalSettings.silentOpen) {
		obsidianUrl += '&silent=true';
	}

	if (generalSettings.legacyMode) {
		// Use the URI method
		obsidianUrl += `&content=${encodeURIComponent(fileContent)}`;
		console.log('Obsidian URL:', obsidianUrl);
		openObsidianUrl(obsidianUrl);
	} else {
		// Try to copy to clipboard with fallback mechanisms
		await tryClipboardWrite(fileContent, obsidianUrl);
	}
}
```

**File:** src/core/popup.ts (L1214-1275)
```typescript
async function handleClipObsidian(): Promise<void> {
    if (!currentTemplate) return;

    const vaultDropdown = document.getElementById('vault-select') as HTMLSelectElement;
    const noteContentField = document.getElementById('note-content-field') as HTMLTextAreaElement;
    const noteNameField = document.getElementById('note-name-field') as HTMLInputElement;
    const pathField = document.getElementById('path-name-field') as HTMLInputElement;
    const interpretBtn = document.getElementById('interpret-btn') as HTMLButtonElement;

    if (!vaultDropdown || !noteContentField) {
        showError('Some required fields are missing. Please try reloading the extension.');
        return;
    }

    try {
        // Handle interpreter if needed
        if (generalSettings.interpreterEnabled && interpretBtn && collectPromptVariables(currentTemplate).length > 0) {
            if (interpretBtn.classList.contains('processing')) {
                await waitForInterpreter(interpretBtn);
            } else if (!interpretBtn.classList.contains('done')) {
                interpretBtn.click();
                await waitForInterpreter(interpretBtn);
            }
        }

        // Gather content
        const properties = Array.from(document.querySelectorAll('.metadata-property input')).map(input => {
            const inputElement = input as HTMLInputElement;
            return {
                id: inputElement.dataset.id || Date.now().toString() + Math.random().toString(36).slice(2, 11),
                name: inputElement.id,
                value: inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value
            };
        }) as Property[];

        const frontmatter = await generateFrontmatter(properties);
        const fileContent = frontmatter + noteContentField.value;

        // Save to Obsidian
        const selectedVault = currentTemplate.vault || vaultDropdown.value;
        const isDailyNote = currentTemplate.behavior === 'append-daily' || currentTemplate.behavior === 'prepend-daily';
        const noteName = isDailyNote ? '' : noteNameField?.value || '';
        const path = isDailyNote ? '' : pathField?.value || '';

        await saveToObsidian(fileContent, noteName, path, selectedVault, currentTemplate.behavior);
        const tabInfo = await getCurrentTabInfo();
        await incrementStat('addToObsidian', selectedVault, path, tabInfo.url, tabInfo.title);

        if (!currentTemplate.vault) {
            lastSelectedVault = selectedVault;
            await setLocalStorage('lastSelectedVault', lastSelectedVault);
        }

        if (!isSidePanel) {
            setTimeout(() => window.close(), 500);
        }
    } catch (error) {
        console.error('Error in handleClipObsidian:', error);
        showError('failedToSaveFile');
        throw error;
    }
}
```

**File:** src/settings.html (L490-497)
```html
									<select id="template-behavior">
										<option value="create" data-i18n="createNewNote">Create new note</option>
										<option value="append-specific" data-i18n="appendToExisting">Add to an existing note, at the bottom</option>
										<option value="prepend-specific" data-i18n="prependToExisting">Add to an existing note, at the top</option>
										<option value="append-daily" data-i18n="appendToDaily">Add to daily note, at the bottom</option>
										<option value="prepend-daily" data-i18n="prependToDaily">Add to daily note, at the top</option>
										<option value="overwrite" data-i18n="overwriteNote">Overwrite note</option>
									</select>
```

**File:** docs/Introduction to Obsidian Web Clipper.md (L12-12)
```markdown
> [!warning]- Requires Obsidian 1.7.2 or above
```
