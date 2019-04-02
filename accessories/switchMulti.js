const baseSwitch = require('./baseSwitch');

let Service, Characteristic;

class SwitchMultiAccessory extends baseSwitch {
    constructor(config, platform) {
        super(config, platform);
        Characteristic = platform.Characteristic;
        Service = platform.Service;

        if (!config.data) {
            this.log.error("[%s]'data' not defined! Please check your 'config.json' file", this.name);
        } else {
            this.codeMap = config.data;
            this.currentOn = 'off';
        }

        this._setCharacteristic();
    }

    _setCharacteristic() {
        this.services = [];
        this.switches = {};

        this.infoService = new Service.AccessoryInformation();
        this.infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "AC Partner IR Switch")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        this.services.push(this.infoService);

        for (let switchName of Object.keys(this.codeMap)) {
            if (switchName === 'off') {
                continue;
            }
            const switchService = new Service.Switch(switchName, switchName);
            switchService.getCharacteristic(Characteristic.On)
                .on('set', (value, callback) => this.setSwitchState(switchName, value, callback))
                .updateValue(switchName === this.currentOn ? Characteristic.On.YES : Characteristic.On.NO);
            this.services.push(switchService);
            this.switches[switchName] = switchService;
        }
    }

    setSwitchState(switchName, value, callback) {
        if (this.currentOn !== switchName && value === Characteristic.On.NO) {
            callback(null);
            return;
        }
        this.currentOn = value === Characteristic.On.YES ? switchName : 'off';
        const code = this.codeMap[this.currentOn];
        if (!code) {
            callback(null);
            return;
        }
        this._sendCode(code, (err) => {
            for (let name of Object.keys(this.switches)) {
                if (switchName !== name) {
                    this.switches[name].setValue(Characteristic.On.NO);
                }
            }
            callback(err);
        });
    }
}

module.exports = SwitchMultiAccessory;