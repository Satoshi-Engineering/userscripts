// ==UserScript==
// @name         Redis Commander JSON Helper
// @namespace    https://github.com/Satoshi-Engineering/userscripts
// @version      0.5
// @description  Help you editing JSONs in Redis Commander (https://joeferner.github.io/redis-commander/)
// @author       https://github.com/dr-erych
// @icon         https://joeferner.github.io/redis-commander/favicon.png
// @grant        none
// ==/UserScript==

;(function() {

    const flattenKeys = (obj, currentRoot = undefined) => {
        return Object.keys(obj).map(key => {
            const path = currentRoot != null ? `${currentRoot}.${key}` : `${key}`
            const objectType = Object.prototype.toString.call(obj[key])
            if (objectType === '[object Object]' || objectType === '[object Array]') {
                return [path, flattenKeys(obj[key], path)]
            }
            return path
        }).flat(10)
    }

    const deepValue = (o, p) => p.split('.').reduce((a, v) => a[v], o)

    const getValueForPath = (jsonPath) => {
        let object
        try {
            object = JSON.parse(textarea.value)
        } catch (error) {
            throw new Error(error)
            return
        }
        try {
            return deepValue(object, jsonPath)
        } catch (error) {
            return undefined
        }
    }

    const getJsonPathFromTextareaSelection = (textareaInternal) => {
        if (textareaInternal == null && textarea != null) {
            textareaInternal = textarea
        }
        let object
        try {
            object = JSON.parse(textareaInternal.value)
        } catch (error) {
            throw new Error(error)
            return
        }
        const selectedText = textareaInternal.value.substring(textareaInternal.selectionStart, textareaInternal.selectionEnd)
        let jsonPath
        if (selectedText != null && selectedText.length > 0) {
            const occurrence = textareaInternal.value.substring(0, textareaInternal.selectionStart).match(new RegExp(`\"${selectedText}\"\\s*:`, 'g'))?.length || 0
            const pathsToKey = flattenKeys(object).filter(path => path === selectedText || path.endsWith(`.${selectedText}`))
            jsonPath = pathsToKey[occurrence]
        }
        return { object, jsonPath, value: deepValue(object, jsonPath) }
    }

    let currentlyInitialized
    let itemDataEl
    let textarea
    let redisKey
    let commandInput

    let editorReadyListeners = []

    const addButton = (label, title, onClick) => {
        const button = document.createElement('button')
        button.textContent = label
        button.title = title
        itemDataEl.appendChild(button)
        itemDataEl.appendChild(document.createTextNode(' '))

        button.addEventListener('click', (event) => {
            event.preventDefault()
            button.style.borderColor = null
            try {
                onClick.call(undefined, { redisKey, textarea, commandInput })
            } catch (error) {
                console.error(error)
                button.style.borderColor = 'red'
            }
        })
    }

    const init = () => {
        itemDataEl = document.querySelector('#body #itemData')

        if (currentlyInitialized === itemDataEl) {
            return
        }
        currentlyInitialized = itemDataEl

        textarea = itemDataEl?.querySelector('#stringValue')
        if (itemDataEl == null || itemDataEl.querySelector('#editStringForm') == null || textarea == null || itemDataEl.querySelector('#saveKeyButton') != null) {
            return
        }

        redisKey = [...itemDataEl.querySelectorAll(':scope > label')].find(el => el.textContent.startsWith('Key: ')).querySelector('b').textContent.trim()

        commandInput = document.querySelector('#commandLine #_readline_input')

        addButton('JSON.SET 👇', 'Select a key of the JSON in the textarea, then click this button', ({ redisKey, textarea, commandInput }) => {
            let { jsonPath, object, value } = getJsonPathFromTextareaSelection(textarea)
            let quotes = ''
            if (jsonPath == null || typeof value === 'string') {
                quotes = '""'
            }
            const output = `json.set ${redisKey} $.${jsonPath || ''} '${quotes}'`
            commandInput.value = output
            commandInput.focus()
            commandInput.setSelectionRange(output.length - quotes.length / 2 - 1, output.length - quotes.length / 2 - 1)
        })

        addButton('JSON.SET null 👇', 'Select a key of the JSON in the textarea, then click this button', ({ redisKey, textarea, commandInput }) => {
            let { jsonPath, object } = getJsonPathFromTextareaSelection(textarea)
            let quotes = ''
            if (jsonPath == null || typeof deepValue(object, jsonPath) === 'string') {
                quotes = '""'
            }
            commandInput.value = `json.set ${redisKey} $.${jsonPath || ''} 'null'`
            commandInput.focus()
        })

        itemDataEl.appendChild(document.createElement('br'))
        itemDataEl.appendChild(document.createElement('br'))
        addButton('Milliseconds to Date ⏰', 'Select a timestamp value in the textarea, then click this button', ({ redisKey, textarea, commandInput }) => {
            dateContainer.style.display = 'inline'
            const tsString = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim()
            if (tsString.length < 1) {
                inputTimestamp.value = 'Nothing selected?'
                return
            }
            inputTimestamp.value = Number(tsString)
            inputDate.value = new Date(Number(inputTimestamp.value)).toISOString()
        })
        const dateContainer = document.createElement('span')
        const inputTimestamp = document.createElement('input')
        const inputDate = document.createElement('input')
        dateContainer.appendChild(inputTimestamp)
        dateContainer.appendChild(document.createTextNode(' <-> '))
        dateContainer.appendChild(inputDate)
        itemDataEl.appendChild(dateContainer)
        itemDataEl.appendChild(document.createElement('br'))
        dateContainer.style.display = 'none'
        inputDate.addEventListener('input', ({ currentTarget }) => { inputTimestamp.value = new Date(currentTarget.value).getTime() })
        inputTimestamp.addEventListener('input', ({ currentTarget }) => { inputDate.value = new Date(Number(currentTarget.value)).toISOString() })

        itemDataEl.appendChild(document.createElement('br'))
        itemDataEl.appendChild(document.createElement('br'))

        editorReadyListeners.forEach(listener => listener.call(undefined, { addButton, getValueForPath, getJsonPathFromTextareaSelection }))

    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type !== 'childList') {
                return
            }
            init()
        })
    })

    if (document.querySelector('#body') == null) {
        return
    }

    observer.observe(document.querySelector('#body'), { childList: true })

    window.REDIS_COMMANDER_JSON_HELPER_EXTEND = (onEditorReady) => { editorReadyListeners = [...editorReadyListeners, onEditorReady] }

})()
