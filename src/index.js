
const VALUE_PLACEHOLDER = '-';
const PREFIX_COMMAND = '__TSC:';
const PREFIX_DATA = '__TSD:';
const PREFIX_COMMAND_LENGTH = PREFIX_COMMAND.length; 

const sendMessage = (key, value = VALUE_PLACEHOLDER, cb = null) => {
    key = PREFIX_COMMAND + key;

    window.localStorage.setItem(key, value);
    window.localStorage.removeItem(key);

    if (cb) {
        setTimeout(() => cb(), 50);
    }
};


/*
Гарантировано:
- Вкладка, которая пишет в localStorage, не получает соответствующего события 'storage'.
- При последовательном вызове методов localStorage.setItem/removeItem сработают оба события, тоже последовательно.
- ! проверить, все ли ответили, можно по колву известных вкладок
- Если при загрузке данная вкладка видит, что в LS записан какой-то мастер, но в течение N секунд от него не было ответа на ACQ_REQ, значит, что-то багануло и можно мастер перезаписать.
- !!! Учесть, что скрипт может работать не только в табах, но и в айфреймах


becomeMaster()
becomeSlave()
broadcast()
poll()
bounce()


*/
window.isMasterTab = false;

const init = () => {
    // let isMasterTab = false;
    const currentTabId = Math.random().toString(36);
    const tabs = [];

    window.tabs = tabs;
    window.currentTabId = currentTabId;

    if (window.localStorage.getItem(PREFIX_DATA + 'master') === null) {
        window.localStorage.setItem(PREFIX_DATA + 'master', currentTabId);
        isMasterTab = true;
    }

    window.addEventListener('storage', (event) => {
        if (!event.key.startsWith(PREFIX_COMMAND) || event.newValue === null) {
            return;
        }

        const command = event.key.slice(PREFIX_COMMAND_LENGTH);

        switch (command) {
            case 'ACQ_REQ': {
                const reqTabId = event.newValue;

                if (tabs.includes(reqTabId)) {
                    throw new Error(`${ command }: Tab with id '${ reqTabId }' already exists in tabs list`);
                }

                tabs.push(reqTabId);
                sendMessage('ACQ_RES', reqTabId + ':' + currentTabId); 

                break;
            }
            case 'ACQ_RES': {
                const [ reqTabId, resTabId ] = event.newValue.split(':');

                if (reqTabId === currentTabId && tabs.includes(resTabId) === false) {
                    tabs.push(resTabId);
                }

                break;
            }
            case 'UNL_REQ': {
                const tabIndex = tabs.indexOf(event.newValue);

                if (tabIndex === -1) {
                    throw new Error(`${ command }: Unloaded tab with id '${ event.newValue }' is not found`);
                }

                tabs.splice(tabIndex, 1);

                break;
            }
            case 'CH_MSTR_REQ': {
                if (event.newValue === currentTabId) {
                    window.localStorage.setItem(PREFIX_DATA + 'master', currentTabId);
                    isMasterTab = true;
                }

                break;
            }
            default: {
                throw new Error(`Unknown command '${ command }' with value '${ value }'`);
            }
        }
    });

    window.addEventListener('unload', () => {
        sendMessage('UNL_REQ', currentTabId);

        if (isMasterTab) {
            window.localStorage.removeItem(PREFIX_DATA + 'master');

            if (tabs.length > 0) {
                sendMessage('CH_MSTR_REQ', tabs[0]);
            }
        }

    });

    sendMessage('ACQ_REQ', currentTabId);
};

window.cnt = () => {
    window.open(window.location.href, '_blank');
    window.open(window.location.href, '_blank');
    window.open(window.location.href, '_blank');
    window.open(window.location.href, '_blank');
};


/^(interactive|complete)$/.test(document.readyState) ? init() : window.addEventListener('load', init);
