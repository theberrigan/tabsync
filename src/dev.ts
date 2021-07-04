import { syncTabs, uuid4 } from './tabsync';

(<any>window).ts = {
     cloneTabs: (n : number = 5) => {
         if (n > 10) {
             console.warn('Too many tabs to create, reduced to 10');
             n = 10;
         }

         for (; n > 0; n--) {
             window.open(window.location.href, '_blank');
         }
    }
};

// TODO: is ready state unnecessary?
const init = () => {
    // const ts = syncTabs();
    for (let i = 0; i < 10; i++) {
        console.log(uuid4());
    }
};

/^(interactive|complete)$/.test(document.readyState) ? init() : window.addEventListener('load', init);
