# homebridge-mi-humidifier
 

Xiaomi Humidifier plugin for HomeBridge. Plugin is based on On HomeKit Fan service currently.   
   
Thanks for [Mr.Yin](https://github.com/YinHangCode/homebridge-mi-fan/) , [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol), [aholstenson](https://github.com/aholstenson)(the author of [miio](https://github.com/aholstenson/miio)), all other developer and testers.   
   
![](https://xiaomi-mi.com/uploads/CatalogueImage/pv_xiaomi-zhimi-uvgi-air-humidifier-white-01_14627_1481298607.jpg)

## Pre-Requirements
1.Make sure your IOS version is ios11 or later.   
## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
npm install -g miio homebridge-xiaomi-humidifier
```
## Configuration
```
"platforms": [{
    "platform": "MiHumidiferPlatform",
    "deviceCfgs": [{
        "ip": "192.168.1.xxx",
        "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "deviceName": "room Humidifer",
        "deviceDisable": false,
        "temperatureName": "room temperature",
        "temperatureDisable": false,
        "humidityName": "room humidity",
        "humidityDisable": false,
        "buzzerSwitchName": "Humidifer buzzer switch",
        "buzzerSwitchDisable": true,
        "ledBulbName": "Humidifer led switch",
        "ledBulbDisable": true
    }]
}]
```
## Get token
Open command prompt or terminal. Run following command:   
```
miio --discover
```
Wait until you get output similar to this:   
```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```
"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" is token.   
If token is "???", then reset device and connect device created Wi-Fi hotspot.   
Run following command:   
```
miio --discover --sync
```
Wait until you get output.   
For more information about token, please refer to [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol) and [miio](https://github.com/aholstenson/miio).   
## Version Logs
  
### 0.0.1
1.support for XiaoMi Humidifier as Fan Service (HomeKit Humidifier type is not available yet).   
