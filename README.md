# NVIDIA Xavier Power Measurement
Node + Express application derrived from [mbaharan](https://github.com/mbaharan/Tegra_Xavier_TX2_INA_Power_Monitors) who retains all rights.

### To start the server:
```bash
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
