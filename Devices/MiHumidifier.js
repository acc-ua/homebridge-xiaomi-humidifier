require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

MiHumidifier = function(platform, config) {
    this.init(platform, config);
    
    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    
    this.device = new miio.Device({
        address: this.config['ip'],
        token: this.config['token']
    });
    
    this.accessories = {};
    if(!this.config['deviceDisable'] && this.config['deviceName'] && this.config['deviceName'] != "") {
        this.accessories['humidifierAccessory'] = new MiHumidifierAccessory(this);
    }
    if(!this.config['temperatureDisable'] && this.config['temperatureName'] && this.config['temperatureName'] != "") {
        this.accessories['temperatureAccessory'] = new MiHumidifierTemperatureAccessory(this);
    }
    if(!this.config['humidityDisable'] && this.config['humidityName'] && this.config['humidityName'] != "") {
        this.accessories['humidityAccessory'] = new MiHumidifierHumidityAccessory(this);
    }
    if(!this.config['buzzerSwitchDisable'] && this.config['buzzerSwitchName'] && this.config['buzzerSwitchName'] != "") {
        this.accessories['buzzerSwitchAccessory'] = new MiHumidifierBuzzerSwitchAccessory(this);
    }
    if(!this.config['ledBulbDisable'] && this.config['ledBulbName'] && this.config['ledBulbName'] != "") {
        this.accessories['ledBulbAccessory'] = new MiHumidifierLEDBulbAccessory(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiHumidifierPlatform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(MiHumidifier, Base);

MiHumidifierAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['deviceName'];
    this.platform = dThis.platform;
}

MiHumidifierAccessory.prototype.getServices = function() {
    var that = this;
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiHumidifier")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);

    //var humidifierService = new Service.Fanv2(this.name);
    var humidifierService = new Service.Fan(this.name);    
    var activeCharacteristic = humidifierService.getCharacteristic(Characteristic.On);//Characteristic.Active);
   // var lockPhysicalControlsCharacteristic = humidifierService.addCharacteristic(Characteristic.LockPhysicalControls);
  //  var swingModeControlsCharacteristic = humidifierService.addCharacteristic(Characteristic.SwingMode);
    var rotationSpeedCharacteristic = humidifierService.addCharacteristic(Characteristic.RotationSpeed);
//    var rotationDirectionCharacteristic = humidifierService.addCharacteristic(Characteristic.RotationDirection);


    // power
    activeCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["power"]).then(result => {
                that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - Active - getActive: " + result);
                callback(null, result[0] === "on" ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierAccessory - Active - getActive Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - Active - setActive: " + value);
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - Active - setActive Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierAccessory - Active - setActive Error: " + err);
                callback(err);
            });
        }.bind(this));



var _speedToMode  = {0:'off',1:'silent', 2:'medium', 3:'high'}; 
var _modeToSpeed = {'off':0,'silent':1, 'medium':2, 'high':3};
    
  rotationSpeedCharacteristic.setProps({
      minValue: 0,
      maxValue: 3,
      minStep: 1,
    })
   .on('get', function(callback) {
            that.device.call("get_prop",["mode"]).then(result => {
                var _val = _modeToSpeed[result[0]];
		that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - getMode: " + result);
                callback(null, _val);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierAccessory - getMode Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - setMode: " + value);
            var _val = _speedToMode[value];
            that.platform.log.debug("[MiHumidifierPlatform][INFO]MiHumidifierAccessory - setMode2: " + _val); 
	    if(value > 0) {
                    that.device.call("set_mode", [_val]).then(result => {
                        that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - setMode Result: " + result);
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
                    }).catch(function(err) {
                        that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierAccessory - setMode Error: " + err);
                        callback(err);
                    });
            }
	  else
	   {
		
		that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - setMOde=0  then turn OFF: " + value);
                that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - Active - setActive Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
           	 }).catch(function(err) {
                	that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierAccessory - Active - setActive Error: " + err);
        	        callback(err);
	            });

		}


        }.bind(this));



    services.push(humidifierService);

  /*  var batteryService = new Service.BatteryService();
    var batLowCharacteristic = batteryService.getCharacteristic(Characteristic.StatusLowBattery);
    var batLevelCharacteristic = batteryService.getCharacteristic(Characteristic.BatteryLevel);
    batLevelCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["battery"]).then(result => {
                that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - Battery - getLevel: " + result);
                batLowCharacteristic.updateValue(result[0] < 20 ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
                callback(null, result[0]);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierAccessory - Battery - getLevel Error: " + err);
                callback(err);
            });
        }.bind(this));
    var batChargingStateCharacteristic = batteryService.getCharacteristic(Characteristic.ChargingState);
    batChargingStateCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["ac_power"]).then(result => {
                that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierAccessory - Battery - getChargingState: " + result);
                callback(null, result[0] === "on" ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierAccessory - Battery - getChargingState Error: " + err);
                callback(err);
            });
        }.bind(this));
    services.push(batteryService);
*/
    return services;
}

MiHumidifierTemperatureAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['temperatureName'];
    this.platform = dThis.platform;
}

MiHumidifierTemperatureAccessory.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "ZhiMi Fan")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var temperatureService = new Service.TemperatureSensor(this.name);
    temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this))
    services.push(temperatureService);
    
    return services;
}

MiHumidifierTemperatureAccessory.prototype.getTemperature = function(callback) {
    var that = this;
    this.device.call("get_prop", ["temp_dec"]).then(result => {
        that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierTemperatureAccessory - Temperature - getTemperature: " + result);
        callback(null, result[0] / 10);
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierTemperatureAccessory - Temperature - getTemperature Error: " + err);
        callback(err);
    });
}

MiHumidifierHumidityAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['humidityName'];
    this.platform = dThis.platform;
}

MiHumidifierHumidityAccessory.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Mi Humidifier")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var humidityService = new Service.HumiditySensor(this.name);
    humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getHumidity.bind(this))
    services.push(humidityService);

    return services;
}

MiHumidifierHumidityAccessory.prototype.getHumidity = function(callback) {
    var that = this;
    this.device.call("get_prop", ["humidity"]).then(result => {
        that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierHumidityAccessory - Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierHumidityAccessory - Humidity - getHumidity Error: " + err);
        callback(err);
    });
}

MiHumidifierBuzzerSwitchAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['buzzerSwitchName'];
    this.platform = dThis.platform;
}

MiHumidifierBuzzerSwitchAccessory.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Mi Humidifier")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);
    
    var switchService = new Service.Switch(this.name);
    switchService
        .getCharacteristic(Characteristic.On)
        .on('get', this.getBuzzerState.bind(this))
        .on('set', this.setBuzzerState.bind(this));
    services.push(switchService);

    return services;
}

MiHumidifierBuzzerSwitchAccessory.prototype.getBuzzerState = function(callback) {
    var that = this;
    this.device.call("get_prop", ["buzzer"]).then(result => {
        that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierBuzzerSwitchAccessory - BuzzerSwitch - getBuzzerState: " + result);
        callback(null, result[0] === "on" ? 1 : 0);
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierBuzzerSwitchAccessory - BuzzerSwitch - getBuzzerState Error: " + err);
        callback(err);
    });
}

MiHumidifierBuzzerSwitchAccessory.prototype.setBuzzerState = function(value, callback) {
    var that = this;
    that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierLEDBulbAccessory - BuzzerSwitch - setBuzzerState: " + value);
    that.device.call("set_buzzer", [value ? "on" : "off"]).then(result => {
        that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierBuzzerSwitchAccessory - BuzzerSwitch - setBuzzerState Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }            
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierBuzzerSwitchAccessory - BuzzerSwitch - setBuzzerState Error: " + err);
        callback(err);
    });
}

MiHumidifierLEDBulbAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['ledBulbName'];
    this.platform = dThis.platform;
}

MiHumidifierLEDBulbAccessory.prototype.getServices = function() {
    var that = this;
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "Mi Humidifier")
        .setCharacteristic(Characteristic.SerialNumber, "Undefined");
    services.push(infoService);

    var switchLEDService = new Service.Lightbulb(this.name);
    var onCharacteristic = switchLEDService.getCharacteristic(Characteristic.On);
    var brightnessCharacteristic = switchLEDService.addCharacteristic(Characteristic.Brightness);
    
    onCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["led_b"]).then(result => {
                that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierLEDBulbAccessory - switchLED - getLEDPower: " + result);
                callback(null, result[0] === 2 ? false : true);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierLEDBulbAccessory - switchLED - getLEDPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierLEDBulbAccessory - switchLED - setLEDPower: " + value + ", nowValue: " + onCharacteristic.value);
            that.setLedB(value ? that.getLevelByBrightness(brightnessCharacteristic.value) : 2, callback);
        }.bind(this));
    brightnessCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["led_b"]).then(result => {
                that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierLEDBulbAccessory - switchLED - getLEDPower: " + result);
                if(result[0] == 0) {
                    if(brightnessCharacteristic.value > 50 && brightnessCharacteristic.value <= 100) {
                        callback(null, brightnessCharacteristic.value);
                    } else {
                        callback(null, 100);
                    }
                } else if(result[0] == 1) {
                    if(brightnessCharacteristic.value > 0 && brightnessCharacteristic.value <= 50) {
                        callback(null, brightnessCharacteristic.value);
                    } else {
                        callback(null, 50);
                    }
                } else if(result[0] == 2) {
                    callback(null, 0);
                }
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierLEDBulbAccessory - switchLED - getLEDPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    services.push(switchLEDService);

    return services;
}

MiHumidifierLEDBulbAccessory.prototype.setLedB = function(led_b, callback) {
    var that = this;
    that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierLEDBulbAccessory - switchLED - setLedB: " + led_b);
    this.device.call("set_led_b", [led_b]).then(result => {
        that.platform.log.debug("[MiHumidifierPlatform][DEBUG]MiHumidifierLEDBulbAccessory - switchLED - setLEDBrightness Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifierPlatform][ERROR]MiHumidifierLEDBulbAccessory - switchLED - setLEDBrightness Error: " + err);
        callback(err);
    });
}

MiHumidifierLEDBulbAccessory.prototype.getLevelByBrightness = function(brightness) {
    if(brightness == 0) {
        return 2;
    } else if(brightness > 0 && brightness <= 50) {
        return 1;
    } else if (brightness > 50 && brightness <= 100) {
        return 0;
    }
}
