class Base {
    constructor(config, platform) {
        this.platform = platform;
        this.log = platform.log;
        this.config = config;
        this.ip = this.config['deviceIp'] || Object.keys(platform.config.devices)[0];
        this.name = config['name'];

        //Device is not ready
        this.ReadyState = false;
        platform.startEvent.once(this.ip, () => {
            this.log.debug("[%s]Ready", this.name);
            this._startAcc();
        })
    }
    _startAcc() {
        this.ReadyState = true;
    }
    getServices() {
        return this.services;
    }
    identify(callback) {
        this.log("[INFO]%s indetify!!!", this.name);
        callback();
    }
}

module.exports = Base;