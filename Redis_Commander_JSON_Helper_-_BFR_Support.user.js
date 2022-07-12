// ==UserScript==
// @name         Redis Commander JSON Helper - BFR Support
// @namespace    https://github.com/Satoshi-Engineering/userscripts
// @version      0.1
// @description  Help you doing support tasks for BFR in Redis Commander (https://joeferner.github.io/redis-commander/)
// @author       https://github.com/Satoshi-Engineering
// @icon         https://bfr.sate.tools/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    window.REDIS_COMMANDER_JSON_HELPER_EXTEND(({ addButton, getValueForPath, getJsonPathFromTextareaSelection }) => {
        const taskStatus = getValueForPath('taskStatus')
        if (taskStatus != null && taskStatus !== 'PAUSED') {
            addButton(`Set taskStatus from "${taskStatus}" to "PAUSED"`, 'Set taskStatus to "PAUSED".', ({ redisKey, commandInput }) => {
                const output = `json.set ${redisKey} $.taskStatus '"PAUSED"'`
                commandInput.value = output
                commandInput.focus()
            })
        }

        const errors = getValueForPath('errors')
        if (errors != null) {
            addButton(`Set errors to NULL`, 'Set errors to NULL.', ({ redisKey, commandInput }) => {
                const output = `json.set ${redisKey} $.errors 'null'`
                commandInput.value = output
                commandInput.focus()
            })
        }

        const swapServiceOrderId = getValueForPath('taskData.order.id')
        if (swapServiceOrderId != null) {
            const service = getValueForPath('taskData.order.service')
            let orderUrl
            if (service === 'FixedFloat') {
                orderUrl = `https://fixedfloat.com/order/${swapServiceOrderId}`
            }
            if (service === 'SimpleSwap') {
                orderUrl = `https://simpleswap.io/exchange?id=${swapServiceOrderId}`
            }
            if (orderUrl != null) {
                addButton(`Open Order at ${service}`, `Order ID: ${swapServiceOrderId}`, () => {
                    window.open(orderUrl)
                })
            }
        }
    })
})();
