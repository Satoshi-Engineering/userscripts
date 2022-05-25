// ==UserScript==
// @name         Redis Commander JSON Helper
// @namespace    https://github.com/Satoshi-Engineering/userscripts
// @version      0.3
// @description  Help you editing JSONs in Redis Commander (https://joeferner.github.io/redis-commander/)
// @author       https://github.com/dr-erych
// @icon         https://joeferner.github.io/redis-commander/favicon.png
// @require      https://cdnjs.cloudflare.com/ajax/libs/date-fns/1.30.1/date_fns.min.js#sha512=F+u8eWHrfY8Xw9BLzZ8rG/0wIvs0y+JyRJrXjp3VjtFPylAEEGwKbua5Ip/oiVhaTDaDs4eU2Xtsxjs/9ag2bQ
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

    const deepValue = (o, p) => p.split('.').reduce((a, v) => a[v], o)

    const getJsonPathFromTextareaSelection = (textarea) => {
        let object
        try {
            object = JSON.parse(textarea.value)
        } catch (error) {
            throw new Error(error)
            return
        }
        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
        let jsonPath
        if (selectedText != null && selectedText.length > 0) {
            const occurrence = textarea.value.substring(0, textarea.selectionStart).match(new RegExp(`\"${selectedText}\"\\s*:`, 'g'))?.length || 0
            const pathsToKey = flattenKeys(object).filter(path => path.endsWith(selectedText))
            jsonPath = pathsToKey[occurrence]
        }
        return { object, jsonPath }
    }

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

        const commandInput = document.querySelector('#commandLine #_readline_input')

        const button = document.createElement('button')
        button.textContent = 'JSON.SET 👇'
        button.title = 'Select a key of the JSON in the textarea, then click this button'
        itemDataEl.appendChild(button)
        itemDataEl.appendChild(document.createTextNode(' '))

        button.addEventListener('click', (event) => {
            event.preventDefault()
            button.style.borderColor = null
            let jsonPath, object
            try {
                ({ jsonPath, object } = getJsonPathFromTextareaSelection(textarea))
            } catch (error) {
                button.style.borderColor = 'red'
            }
            let quotes = ''
            if (jsonPath == null || typeof deepValue(object, jsonPath) === 'string') {
                quotes = '""'
            }
            const output = `json.set ${redisKey} $.${jsonPath || ''} '${quotes}'`
            commandInput.value = output
            commandInput.focus()
            commandInput.setSelectionRange(output.length - quotes.length / 2 - 1, output.length - quotes.length / 2 - 1)
        })

        const buttonSetNull = document.createElement('button')
        buttonSetNull.textContent = 'JSON.SET null 👇'
        buttonSetNull.title = 'Select a key of the JSON in the textarea, then click this button'
        itemDataEl.appendChild(buttonSetNull)
        itemDataEl.appendChild(document.createTextNode(' '))

        buttonSetNull.addEventListener('click', (event) => {
            event.preventDefault()
            button.style.borderColor = null
            let jsonPath, object
            try {
                ({ jsonPath, object } = getJsonPathFromTextareaSelection(textarea))
            } catch (error) {
                button.style.borderColor = 'red'
            }
            commandInput.value = `json.set ${redisKey} $.${jsonPath || ''} 'null'`
            commandInput.focus()
        })

        itemDataEl.appendChild(document.createElement('br'))
        itemDataEl.appendChild(document.createElement('br'))
        const buttonConvertTimestamp = document.createElement('button')
        buttonConvertTimestamp.textContent = 'Milliseconds to Date ⏰'
        buttonConvertTimestamp.title = 'Select a timestamp value in the textarea, then click this button'
        itemDataEl.appendChild(buttonConvertTimestamp)
        itemDataEl.appendChild(document.createTextNode(' '))
        const dateContainer = document.createElement('span')
        const inputTimestamp = document.createElement('input')
        const inputDate = document.createElement('input')
        dateContainer.appendChild(inputTimestamp)
        dateContainer.appendChild(document.createTextNode(' <-> '))
        dateContainer.appendChild(inputDate)
        itemDataEl.appendChild(dateContainer)
        itemDataEl.appendChild(document.createElement('br'))
        dateContainer.style.display = 'none'
        buttonConvertTimestamp.addEventListener('click', (event) => {
            event.preventDefault()
            dateContainer.style.display = 'inline'
            const tsString = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim()
            if (tsString.length < 1) {
                inputTimestamp.value = 'Nothing selected?'
                return
            }
            inputTimestamp.value = Number(tsString)
            inputDate.value = new Date(Number(inputTimestamp.value)).toISOString()
        })
        inputDate.addEventListener('input', ({ currentTarget }) => { inputTimestamp.value = new Date(currentTarget.value).getTime() })
        inputTimestamp.addEventListener('input', ({ currentTarget }) => { inputDate.value = new Date(Number(currentTarget.value)).toISOString() })
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

})()
