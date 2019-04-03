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
            const switchState = switchService.getCharacteristic(Characteristic.On)
                .on('set', this.setSwitchMultiState.bind(this, switchName))
                .updateValue(switchName === this.currentOn);
            this.services.push(switchService);
            this.switches[switchName] = switchState;
        }
    }

    setSwitchMultiState(switchName, value, callback, context) {
        const funcContext = 'fromSetSwitchMultiState';

        if (context === funcContext) {
            callback(null);
            return;
        }
        this.currentOn = value ? switchName : 'off';
        const code = this.codeMap[this.currentOn];
        if (!code) {
            callback(null);
            return;
        }
        this.log.debug("[DEBUG] %s %s %s send %s", switchName, value, this.currentOn, code);
        this._sendCode(code, (err) => {
            for (let name of Object.keys(this.switches)) {
                if (switchName !== name) {
                    this.switches[name].setValue(false, undefined, funcContext);
                }
            }
            callback(err);
        });
    }

    setSwitchState(value, callback) {
        callback(null);
    }
}

module.exports = SwitchMultiAccessory;
