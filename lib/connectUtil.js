const miio = require('miio');
const events = require('events');

class connectUtil {
    constructor(devices, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.configDevices = devices;

        this.retryCount = {};

        /* Start search */
        this.searchAsync();
    }
    searchAsync() {
        for (const element in this.configDevices) {
            var _addr = element;
            var _token = this.configDevices[element];
            /*this.platform.devices.push(miio.createDevice({
                address: _addr,
                token: _token
            }));*/
            this.retryCount[_addr] = 0;
            this._search(_addr, _token);
        }
    }
    _search(thisIp, thisToken) {
        if (!this.platform.syncLock._enterSyncState(() => {
            this._search(thisIp, thisToken);
        })) {
            return;
        }

        this.retryCount[thisIp]++;
        //Try to connect to miio device
        this.log.info("[INFO]Device %s -> Connecting", thisIp);
        miio.device({
            address: thisIp,
            token: thisToken
        }).then((retDevice) => {
            this.platform.devices[thisIp] = retDevice;
            this.log.info("[INFO]Device %s -> Connected", thisIp);
            this.platform.startEvent.emit(thisIp);
        }).catch((err) => {
            this.log.error("[ERROR]Device %s -> %s", thisIp, err);
            setTimeout((() => {
                if (this.retryCount[thisIp] <= 3) {
                    this._search(thisIp, thisToken);
                } else {
                    this.log.warn("[WARN]Cannot connect to device %s!", thisIp);
                    this.retryCount[thisIp] = 0;
                }
            }), 30 * 1000);
        }).then(() => {
            this.platform.syncLock._exitSyncState();
        })
    }
    refresh() {
        this.log.debug("[DEBUG]Start refresh devices");
        for (var element in this.configDevices) {
            this._search(element, this.configDevices[element]);
        }
    }
}

module.exports = connectUtil;