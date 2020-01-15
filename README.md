# NVIDIA Xavier Power Measurement
Node + Express application derrived from [mbaharan](https://github.com/mbaharan/Tegra_Xavier_TX2_INA_Power_Monitors) who retains all rights.

## Prerequisites:
* [Nodejs](https://nodejs.org/en/download/) Download the armV8 binaries and extract to /usr/local/

### To start the server:

```bash
npm install # One time install
node app.js
```

The power calibration will begin immediately and update every 100ms.

### Endpoints:

Send POST requests to the following endpoints to start/stop the "under load" power monitoring.

```
 http://localhost:3000/start
 ```
 
 ```
 http://localhost:3000/stop
 ```
 
 This can be used externally or sent from within the inference Python or CPP code (TODO: Add examples)
