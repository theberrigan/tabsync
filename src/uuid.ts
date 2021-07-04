export const uuid4 = (() : (() => string) => {
    const bytes = new Uint8Array(16);

    const randomizeBytes = (() : (() => Uint8Array) =>  {
        const crypto = window.crypto || (<any>window).msCrypto || null;
        const getRandomValues = (
            crypto && typeof crypto.getRandomValues === 'function' && crypto.getRandomValues.bind(crypto) ||
            ((arr : Uint8Array) : Uint8Array => {
                for (let i = 0; i < 256; ++i) {
                    arr[i] = Math.round(255 * Math.random());
                }
                return arr;
            })
        );

        return () => getRandomValues(bytes);
    })();

    // + 0x100 and .substr(1) instead of .padStart(2, '0')
    const byteToHex = (byte : number) : string => (byte + 0x100).toString(16).substr(1);

    return () : string => {
        randomizeBytes();

        return (
            byteToHex(bytes[0]) +
            byteToHex(bytes[1]) +
            byteToHex(bytes[2]) +
            byteToHex(bytes[3]) +
            '-' +
            byteToHex(bytes[4]) +
            byteToHex(bytes[5]) +
            '-' +
            byteToHex(bytes[6]) +
            byteToHex(bytes[7]) +
            '-' +
            byteToHex(bytes[8]) +
            byteToHex(bytes[9]) +
            '-' +
            byteToHex(bytes[10]) +
            byteToHex(bytes[11]) +
            byteToHex(bytes[12]) +
            byteToHex(bytes[13]) +
            byteToHex(bytes[14]) +
            byteToHex(bytes[15])
        ).toLowerCase();
    };
})();
