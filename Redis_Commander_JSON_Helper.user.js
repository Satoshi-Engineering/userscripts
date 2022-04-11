// ==UserScript==
// @name         Redis Commander JSON Helper
// @namespace    https://satoshiengineering.com/
// @version      0.1
// @description  Help you editing JSONs in Redis Commander
// @author       dave@satoshiengineering.com
// @match        http://localhost:6380/
// @match        https://rcmd.coinr.satoshiengineering.com/
// @icon         https://rcmd.coinr.satoshiengineering.com/favicon.png
// @grant        none
// ==/UserScript==

(function() {

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

    const deepValue = (o, p) => p.split('.').reduce((a, v) => a[v], o);

    let currentlyInitialized = undefined

    const init = () => {
        const itemDataEl = document.querySelector('#body #itemData')

        if (currentlyInitialized === itemDataEl) {
            return
        }
        currentlyInitialized = itemDataEl

        const textarea = itemDataEl?.querySelector('#stringValue')
        if (itemDataEl == null || itemDataEl.querySelector('#editStringForm') == null || textarea == null || itemDataEl.querySelector('#saveKeyButton') != null) {
            return
        }

        const redisKey = [...itemDataEl.querySelectorAll(':scope > label')].find(el => el.textContent.startsWith('Key: ')).querySelector('b').textContent.trim()

        const button = document.createElement('button')
        button.textContent = 'JSON.SET 👇'
        button.title = 'Select a key of the JSON in the textarea, then click this button'
        itemDataEl.appendChild(button)

        button.addEventListener('click', (event) => {
            event.preventDefault()
            button.style.borderColor = null
            let object
            try {
                object = JSON.parse(textarea.value)
            } catch (error) {
                button.style.borderColor = 'red'
                return
            }
            const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
            let jsonPath
            if (selectedText != null && selectedText.length > 0) {
                const occurrence = textarea.value.substring(0, textarea.selectionStart).match(new RegExp(`\"${selectedText}\"\\s*:`, 'g'))?.length || 0
                const pathsToKey = flattenKeys(object).filter(path => path.endsWith(selectedText))
                jsonPath = pathsToKey[occurrence]
            }
            const quotes = jsonPath == null || typeof deepValue(object, jsonPath) === 'string' ? '""' : ''
            const output = `json.set ${redisKey} $.${jsonPath || ''} '${quotes}'`
            document.querySelector('#commandLine #_readline_input').value = output
        })
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type !== 'childList') {
                return
            }
            init()
        })
    })
    observer.observe(document.querySelector('#body'), { childList: true })


})();
