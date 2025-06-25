import fse from 'fs-extra'

// If `filePath` exists, copy it to `filePath.bak`, overwriting any existing backup.
async function backupFile(filePath: string): Promise<void> {
	const exists = await fse.pathExists(filePath)
	if (!exists) return
	const backupPath = `${filePath}.bak`
	await fse.copy(filePath, backupPath, {overwrite: true})
}

// Write file contents to a file atomically by writing to a tmp file and then renaming it to the final path
async function atomicWriteFile(filePath: string, contents: string): Promise<void> {
	const timestamp = Date.now()
	// TODO: consider adding a counter to avoid collisions
	const tmpPath = `${filePath}.${timestamp}.tmp`
	await fse.writeFile(tmpPath, contents, 'utf8')
	await fse.rename(tmpPath, filePath)
}

export async function writeWithBackup(filePath: string, contents: string) {
	await backupFile(filePath)
	await atomicWriteFile(filePath, contents)
}
