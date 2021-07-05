import {uuid4} from './uuid';

const VALUE_PLACEHOLDER = '-';
const PREFIX_COMMON = '~tabsync:';
const PREFIX_COMMAND = PREFIX_COMMON + 'c:';
const PREFIX_DATA = PREFIX_COMMON + 'd:';
const PREFIX_MASTER = PREFIX_DATA + 'master';

enum Command {
    Register = '1',
    RegisterResponse = '2',
    Unregister = '3',
    AssignMaster = '4',
    Custom = 'C',
}

interface TabSyncStorage {
    getItem (key : string) : string | null;
    setItem (key : string, value : string) : void;
    removeItem (key : string) : void;
}

interface TabSyncOptions {
    storage? : TabSyncStorage;
    tabId? : string;
}

type TabSyncTab = string;

class TabSync {
    tabs : TabSyncTab[] = [];

    isMaster : boolean = false;

    tabId : string;

    storage : TabSyncStorage;

    constructor (options? : TabSyncOptions) {
        const defaultOptions : TabSyncOptions = {
            storage: window.localStorage,
            tabId: uuid4()
        };

        options = Object.assign({}, defaultOptions, options || {});

        this.tabId = options.tabId;
        this.storage = options.storage;

        console.log(this.tabId);

        if (this.storage.getItem(PREFIX_MASTER) === null) {
            this.storage.setItem(PREFIX_MASTER, this.tabId);
            this.isMaster = true;
        }

        window.addEventListener('storage', this.onStorageEvent);
        window.addEventListener('unload', this.onPageUnload);

        this.sendMessage(Command.Register, this.tabId);
    }

    sendMessage (key, value = VALUE_PLACEHOLDER, callback = null) {
        key = PREFIX_COMMAND + key;

        this.storage.setItem(key, value);
        this.storage.removeItem(key);

        if (callback) {
            setTimeout(() => callback(), 0);
        }
    }

    onStorageEvent = (event : StorageEvent) => {
        const isCommand = event.key.startsWith(PREFIX_COMMAND);
        const isRemoveEvent = event.newValue === null;

        if (!isCommand || isRemoveEvent) {
            return;
        }

        const command = event.key.slice(PREFIX_COMMAND.length);

        switch (command) {
            case Command.Register: {
                console.log('Add tab', event);
                const newTabId = event.newValue;

                if (this.tabs.includes(newTabId)) {
                    throw new Error(`${ command }: Tab with id '${ newTabId }' already exists in tabs list`);
                }

                this.tabs.push(newTabId);
                this.sendMessage(Command.RegisterResponse, newTabId + ':' + this.tabId);

                break;
            }
            case Command.RegisterResponse: {
                const [ reqTabId, resTabId ] = event.newValue.split(':');

                if (reqTabId === this.tabId && this.tabs.includes(resTabId) === false) {
                    console.log('Add tab response', event);
                    this.tabs.push(resTabId);
                }

                break;
            }
            case Command.Unregister: {
                console.log('Unload tab', event);
                const unloadTabId = event.newValue;
                const tabIndex = this.tabs.indexOf(unloadTabId);

                if (tabIndex === -1) {
                    throw new Error(`${ command }: Unloaded tab with id '${ unloadTabId }' is not found`);
                }

                this.tabs.splice(tabIndex, 1);

                break;
            }
            case Command.AssignMaster: {
                console.log('Set as master', event);
                const newMasterTabId = event.newValue;

                if (newMasterTabId === this.tabId) {
                    this.storage.setItem(PREFIX_MASTER, this.tabId);
                    this.isMaster = true;
                }

                break;
            }
            default: {
                throw new Error(`Unknown command '${ command }' with value '${ event.newValue }'`);
            }
        }
    }

    onPageUnload = () => {
        this.sendMessage(Command.Unregister, this.tabId);

        if (this.isMaster) {
            this.storage.removeItem(PREFIX_MASTER);

            if (this.tabs.length > 0) {
                this.sendMessage(Command.AssignMaster, this.tabs[0]);
            }
        }
    }
}

export { TabSync };

/*
const init = () => {
    (<any>window).tabSync = new TabSync();
};

/^(interactive|complete)$/.test(document.readyState) ? init() : window.addEventListener('load', init);
 */




// --------------------


/*
Гарантировано:
- Вкладка, которая пишет в localStorage, не получает соответствующего события 'storage'.
- При последовательном вызове методов localStorage.setItem/removeItem сработают оба события, тоже последовательно.
- ! проверить, все ли ответили, можно по колву известных вкладок
- Если при загрузке данная вкладка видит, что в LS записан какой-то мастер, но в течение N секунд от него не было ответа на ACQ_REQ, значит, что-то багануло и можно мастер перезаписать.
- !!! Учесть, что скрипт может работать не только в табах, но и в

- При одновременной перезагрузке вкладок, данная вкладка принимает Register раньше, чем RegisterResponse
- RegisterResponse возвращается гораздо позже Register, между ними успевает пройти setTimeout

becomeMaster()
becomeSlave()
broadcast()
poll()
bounce()
*/
