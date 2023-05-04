// ==UserScript==
// @name         Gitlab projects helper
// @namespace    https://github.com/Satoshi-Engineering/userscripts
// @version      0.4
// @description  Add links to directly filter for our project labels
// @author       https://github.com/dr-erych
// @match        https://gitlab.satoshiengineering.com/satoshiengineering/projects/-/boards/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=satoshiengineering.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict'

    const LABEL_COLOR = '#808080'

    const csrfToken = document.querySelector('meta[name=csrf-token]').content

    const res = await fetch('/api/graphql', {
        headers: {
            'content-type': 'application/json',
            'x-csrf-token': csrfToken,
        },
        body: "[{\"operationName\":\"projectLabels\",\"variables\":{\"fullPath\":\"satoshiengineering/projects\",\"searchTerm\":\"\"},\"query\":\"query projectLabels($fullPath: ID!, $searchTerm: String) {\\n  workspace: project(fullPath: $fullPath) {\\n    id\\n    labels(searchTerm: $searchTerm, includeAncestorGroups: true) {\\n      nodes {\\n        ...Label\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment Label on Label {\\n  id\\n  title\\n  description\\n  color\\n  textColor\\n  __typename\\n}\\n\"}]",
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
    })

    const json = await res.json()

    let labels = json[0].data.workspace.labels.nodes
        .filter(({ color }) => color === LABEL_COLOR)
        .map(({ title }) => title)

    labels = [null, ...labels]

    const containerEl = document.createElement('div')
    containerEl.style = 'display: flex; flex-wrap: wrap; flex: 2; min-width: 0; margin-left: 10px; justify-content: flex-end;'

    labels.forEach(label => {
        const labelTitle = label != null ? label : 'All'
        const labelHtml = `
          <span
            class="gl-label js-no-trigger gl-label-sm ${label != null ? 'gl-label-text-light' : ''}"
            style="--label-background-color:${label != null ? LABEL_COLOR : '#fff'}; --label-inset-border:inset 0 0 0 1px ${LABEL_COLOR}; margin-right: 4px; margin-bottom: 4px; ${label == null ? `color: ${LABEL_COLOR};` : ''}"
          >
            <a href="#" class="gl-link gl-label-link">
              <span class="gl-label-text">${labelTitle}</span>
            </a>
          </span>
        `
        const labelEl = new DOMParser().parseFromString(labelHtml, 'text/html').body.childNodes[0]
        const labelLink = labelEl.querySelector('a')

        labelLink.addEventListener('click', (event) => {
            event.preventDefault()
            const oldParams = (new URL(document.location)).searchParams
            const newParams = new URLSearchParams([...oldParams.entries()].filter(([key, value]) => !(key === 'label_name[]' && labels.includes(value))))
            if (label != null) {
                newParams.append('label_name[]', label)
            }

            location.href = `${location.origin}${location.pathname}?${newParams.toString()}`
        })

        containerEl.appendChild(labelEl)
    })

    const parentEl = document.querySelector('.top-bar-container')
    parentEl.appendChild(containerEl)
})()
