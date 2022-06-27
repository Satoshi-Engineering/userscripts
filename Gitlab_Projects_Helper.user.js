// ==UserScript==
// @name         Gitlab projects helper
// @namespace    https://github.com/Satoshi-Engineering/userscripts
// @version      0.2
// @description  Add links to directly filter for our project labels
// @author       https://github.com/dr-erych
// @match        https://gitlab.satoshiengineering.com/satoshiengineering/projects/-/boards/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=satoshiengineering.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict'

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

    const labels = json[0].data.workspace.labels.nodes
        .filter(({ color }) => color === '#808080')
        .map(({ title }) => title)

    console.log(labels, json[0].data.workspace.labels.nodes)

    const parentEl = document.querySelector('.breadcrumbs-container')
    const containerEl = document.createElement('div')
    containerEl.style = 'display: flex; flex-wrap: wrap; flex: 2; min-width: 0; margin-left: 10px; justify-content: flex-end;'

    labels.forEach(label => {
        const html = `<span class="gl-label js-no-trigger gl-label-sm gl-label-text-light" style="--label-background-color:#808080; --label-inset-border:inset 0 0 0 1px #808080; margin-right: 4px; margin-bottom: 4px;">
         <a href="#" class="gl-link gl-label-link"><span class="gl-label-text">
             ${label}
         </span></a></span>`
        const labelEl = new DOMParser().parseFromString(html, 'text/html').body.childNodes[0]
        containerEl.appendChild(labelEl)
        const labelLink = labelEl.querySelector('a')
        labelLink.href = `${location.origin}${location.pathname}?label_name[]=${label}`
    })

    parentEl.appendChild(containerEl)
})()
