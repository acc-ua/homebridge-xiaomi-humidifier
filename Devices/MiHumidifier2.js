require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;

MiHumidifier2 = function(platform, config) {
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
        this.accessories['humidifierAccessory'] = new MiHumidifier2Accessory(this);
    }
    if(!this.config['temperatureDisable'] && this.config['temperatureName'] && this.config['temperatureName'] != "") {
        this.accessories['temperatureAccessory'] = new MiHumidifier2TemperatureAccessory(this);
    }
    if(!this.config['buzzerSwitchDisable'] && this.config['buzzerSwitchName'] && this.config['buzzerSwitchName'] != "") {
        this.accessories['buzzerSwitchAccessory'] = new MiHumidifier2BuzzerSwitchAccessory(this);
    }
    if(!this.config['ledBulbDisable'] && this.config['ledBulbName'] && this.config['ledBulbName'] != "") {
        this.accessories['ledBulbAccessory'] = new MiHumidifier2LEDBulbAccessory(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiHumidifier2Platform][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    return accessoriesArr;
}
inherits(MiHumidifier2, Base);

MiHumidifier2Accessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['deviceName'];
    this.platform = dThis.platform;
}

MiHumidifier2Accessory.prototype.getServices = function() {
    var that = this;
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiHumidifier2")
        .setCharacteristic(Characteristic.SerialNumber, "ZhiMi Fan 2");
    services.push(infoService);

    var humidifierService = new Service.HumidifierDehumidifier(this.name);
    var currentHumidityCharacteristic = humidifierService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
    var currentHumidifierDehumidifierStateCharacteristic = humidifierService.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState);
    var targetHumidifierDehumidifierStateCharacteristic = humidifierService.getCharacteristic(Characteristic.TargetHumidifierDehumidifierState);
    var activeCharacteristic = humidifierService.getCharacteristic(Characteristic.Active);
    var rotationSpeedCharacteristic = humidifierService.getCharacteristic(Characteristic.RotationSpeed);
    var targetHumidityCharacteristic = humidifierService.addCharacteristic(Characteristic.TargetRelativeHumidity);


    // power (Active) - required
    activeCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["power"]).then(result => {
                that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Active - getActive: " + result);
                callback(null, result[0] === "on" ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - Active - getActive Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Active - setActive: " + value);
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Active - setActive Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - Active - setActive Error: " + err);
                callback(err);
            });
        }.bind(this));

    // Current State - required
    currentHumidifierDehumidifierStateCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["power"]).then(result => {
                that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Active - getActive: " + result);
                callback(null, result[0] === "on" ? Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING : Characteristic.CurrentHumidifierDehumidifierState.INACTIVE);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - Active - getActive Error: " + err);
                callback(err);
            });
        }.bind(this));

    // Target State - required
    targetHumidifierDehumidifierStateCharacteristic.setValue(Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER);

// Current Humidity - required
currentHumidityCharacteristic.on('get', function (callback){
        that.device.call("get_prop", ["humidity"]).then(result => {
        that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - Humidity - getHumidity Error: " + err);
        callback(err);
    });
}.bind(this)); 

//Target Humidity - add.Characteristic
targetHumidityCharacteristic.on('get', function (callback){
        that.device.call("get_prop", ["target_humidity"]).then(result => {
        that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Target Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - Target Humidity - getHumidity Error: " + err);
        callback(err);
    });
}.bind(this)).on('set', function(value, callback) {
            that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Target Humidity - set: " + value);
            that.device.call("set_target_humidity", [value]).then(result => {
                that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Target Humidity - set Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - Target Humidity - set Error: " + err);
                callback(err);
            });
        }.bind(this)); 

//Rotation Speed - optional characteristic
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
		that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - getMode: " + result);
                callback(null, _val);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - getMode Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - setMode: " + value);
            var _val = _speedToMode[value];
            that.platform.log.debug("[MiHumidifier2Platform][INFO]MiHumidifier2Accessory - setMode2: " + _val); 
	    if(value > 0) {
                    that.device.call("set_mode", [_val]).then(result => {
                        that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - setMode Result: " + result);
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
                    }).catch(function(err) {
                        that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - setMode Error: " + err);
                        callback(err);
                    });
            }
	  else
	   {
		
		that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - setMOde=0  then turn OFF: " + value);
                that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2Accessory - Active - setActive Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
           	 }).catch(function(err) {
                	that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2Accessory - Active - setActive Error: " + err);
        	        callback(err);
	            });

		}


        }.bind(this));



    services.push(humidifierService);

  
    return services;
}

MiHumidifier2TemperatureAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['temperatureName'];
    this.platform = dThis.platform;
}

MiHumidifier2TemperatureAccessory.prototype.getServices = function() {
    var services = [];

    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "ZhiMi Fan")
        .setCharacteristic(Characteristic.SerialNumber, "ZhiMi Fan 2");
    services.push(infoService);
    
    var temperatureService = new Service.TemperatureSensor(this.name);
    temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this))
    services.push(temperatureService);
    
    return services;
}

MiHumidifier2TemperatureAccessory.prototype.getTemperature = function(callback) {
    var that = this;
    this.device.call("get_prop", ["temp_dec"]).then(result => {
        that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2TemperatureAccessory - Temperature - getTemperature: " + result);
        callback(null, result[0] / 10);
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2TemperatureAccessory - Temperature - getTemperature Error: " + err);
        callback(err);
    });
}


MiHumidifier2BuzzerSwitchAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['buzzerSwitchName'];
    this.platform = dThis.platform;
}

MiHumidifier2BuzzerSwitchAccessory.prototype.getServices = function() {
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

MiHumidifier2BuzzerSwitchAccessory.prototype.getBuzzerState = function(callback) {
    var that = this;
    this.device.call("get_prop", ["buzzer"]).then(result => {
        that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2BuzzerSwitchAccessory - BuzzerSwitch - getBuzzerState: " + result);
        callback(null, result[0] === "on" ? 1 : 0);
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2BuzzerSwitchAccessory - BuzzerSwitch - getBuzzerState Error: " + err);
        callback(err);
    });
}

MiHumidifier2BuzzerSwitchAccessory.prototype.setBuzzerState = function(value, callback) {
    var that = this;
    that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2LEDBulbAccessory - BuzzerSwitch - setBuzzerState: " + value);
    that.device.call("set_buzzer", [value ? "on" : "off"]).then(result => {
        that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2BuzzerSwitchAccessory - BuzzerSwitch - setBuzzerState Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }            
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2BuzzerSwitchAccessory - BuzzerSwitch - setBuzzerState Error: " + err);
        callback(err);
    });
}

MiHumidifier2LEDBulbAccessory = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['ledBulbName'];
    this.platform = dThis.platform;
}

MiHumidifier2LEDBulbAccessory.prototype.getServices = function() {
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
                that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2LEDBulbAccessory - switchLED - getLEDPower: " + result);
                callback(null, result[0] === 2 ? false : true);
            }).catch(function(err) {
                that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2LEDBulbAccessory - switchLED - getLEDPower Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
            that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2LEDBulbAccessory - switchLED - setLEDPower: " + value + ", nowValue: " + onCharacteristic.value);
            that.setLedB(value ? that.getLevelByBrightness(brightnessCharacteristic.value) : 2, callback);
        }.bind(this));
    brightnessCharacteristic
        .on('get', function(callback) {
            this.device.call("get_prop", ["led_b"]).then(result => {
                that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2LEDBulbAccessory - switchLED - getLEDPower: " + result);
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
                that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2LEDBulbAccessory - switchLED - getLEDPower Error: " + err);
                callback(err);
            });
        }.bind(this));
    services.push(switchLEDService);

    return services;
}

MiHumidifier2LEDBulbAccessory.prototype.setLedB = function(led_b, callback) {
    var that = this;
    that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2LEDBulbAccessory - switchLED - setLedB: " + led_b);
    this.device.call("set_led_b", [led_b]).then(result => {
        that.platform.log.debug("[MiHumidifier2Platform][DEBUG]MiHumidifier2LEDBulbAccessory - switchLED - setLEDBrightness Result: " + result);
        if(result[0] === "ok") {
            callback(null);
        } else {
            callback(new Error(result[0]));
        }
    }).catch(function(err) {
        that.platform.log.error("[MiHumidifier2Platform][ERROR]MiHumidifier2LEDBulbAccessory - switchLED - setLEDBrightness Error: " + err);
        callback(err);
    });
}

MiHumidifier2LEDBulbAccessory.prototype.getLevelByBrightness = function(brightness) {
    if(brightness == 0) {
        return 2;
    } else if(brightness > 0 && brightness <= 50) {
        return 1;
    } else if (brightness > 50 && brightness <= 100) {
        return 0;
    }
}
