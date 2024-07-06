const chokidar = require('chokidar')
const EventEmitter = require('events').EventEmitter

/**
 * An Observer class for watching folder changes and emmiting events for them
 * @extends EventEmitter
 */
class FolderObserver extends EventEmitter {
    constructor() {
        super()
    }

    /**
     * Watches a folder for changes
     * @param {string} folder - the path of the folder to watch
     */
    watchFolder(folder) {
        try {
            if(folder == undefined) {
                throw new Error('must select folder')
            }
            console.log(
                `[${new Date().toLocaleString()}] Watching for folder changes on: ${folder}`
            )

            /**
             * The watcher event emmiter
             */
            const watcher = chokidar.watch(folder, { persistent: true })

            // Add event
            watcher.on('add', async filePath => {
                if (filePath.includes('WoWCombatLog.txt')) {
                    // emit an event when new file has been added
                    const message = `[${new Date().toLocaleString()}] ${filePath} has been added.`
                    this.emit('file-added', { message })
                }
            })

            // Change event 
            watcher.on('change', async filePath => {
                if (filePath.includes('WoWCombatLog.txt')) {
                    // emit an event when new file has been changed
                    const message = `[${new Date().toLocaleString()}] ${filePath} has been changed.`
                    this.emit('file-changed', { message })
                }
            })

            // Unlink event
            watcher.on('unlink', async filePath => {
                if (filePath.includes('WoWCombatLog.txt')) {
                    // emit an event when new file has been deleted
                    const message = `[${new Date().toLocaleString()}] ${filePath} has been deleted.`
                    this.emit('file-deleted', { message })
                }
            })
            // error event
            watcher.on('error', error => log(`Watcher error: ${error}`))

            // return the watcher
            return watcher
        } catch (error) {
            console.log(error)
        }
    }

    stopWatching(watcher) {
        try {
            watcher.close()
            console.log('stopped watching')
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = FolderObserver