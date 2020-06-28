# NVIDIA Xavier Power Measurement
Node + Express application derrived from [mbaharan](https://github.com/mbaharan/Tegra_Xavier_TX2_INA_Power_Monitors) who retains all rights.

## Prerequisites:
* [Nodejs](https://nodejs.org/en/download/) Download the armV8 binaries and extract to /usr/local/

## To begin, open two terminals

### To start the server and monitor power:

```bash
npm install # One time install
node app.js
```

### To run inference tests:
```bash
cd EfficientNet_Jetson_Inference
./inference.sh
```
**This repo only comes with 50 imagenet images, just copy the directory within /image/val/ several times until 1000+ images**

The power calibration will begin immediately and update every 100ms.

The FPS will be recorded in the models/<DATASET>/ directory
 

