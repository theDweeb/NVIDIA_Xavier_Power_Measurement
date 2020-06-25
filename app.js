const util = require('./util')
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const open = require('open');
const shell = require('shelljs')


let capture = false
let calib = 2

let BASELINE_GPU = 0
let POWER_GPU = 0
let COUNTER_BASELINE_GPU = 0
let COUNTER_POWER_GPU = 0

let BASELINE_CPU = 0
let POWER_CPU = 0
let COUNTER_BASELINE_CPU = 0
let COUNTER_POWER_CPU = 0

let BASELINE_SOC = 0
let POWER_SOC = 0
let COUNTER_BASELINE_SOC = 0
let COUNTER_POWER_SOC = 0

let BASELINE_DDR = 0
let POWER_DDR = 0
let COUNTER_BASELINE_DDR = 0
let COUNTER_POWER_DDR = 0

powerInfo = {
	AVG_BASELINE_GPU: 0,
	AVG_BASELINE_CPU: 0,
	AVG_BASELINE_SOC: 0,
	AVG_BASELINE_DDR: 0,
	GPU_BEFORE_START: 0,
	CPU_BEFORE_START: 0,
	SOC_BEFORE_START: 0,
	DDR_BEFORE_START: 0,
	TOTAL_BEFORE: 0,
	GPU_FINAL: 0,
	CPU_FINAL: 0,
	SOC_FINAL: 0,
	DDR_FINAL: 0,
	TOTAL: 0
}

/*
Jetpack 4.2 and below:
	Nano:
		GPU_POWER_FILE_NAME = "/sys/devices/3160000.i2c/i2c-0/0-0040/iio_device/in_power0_input"
		DDR_POWER_FILE_NAME = "/sys/devices/3160000.i2c/i2c-0/0-0041/iio_device/in_power2_input";

Jetpack 4.3:
	Nano:
		GPU_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/6-0040/iio_device/in_power0_input"
		DDR_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/6-0040/iio_device/in_power2_input";
*/

let board = util.getPlatform()
if(board == 'xavier_tx2') {
	GPU_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/1-0040/iio_device/in_power0_input";
	CPU_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/1-0040/iio_device/in_power1_input";
	SOC_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/1-0040/iio_device/in_power2_input";
	DDR_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/1-0041/iio_device/in_power1_input";

} else if(board == 'nano') {
	GPU_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/6-0040/iio_device/in_power1_input"
	CPU_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/6-0040/iio_device/in_power2_input";
} else {
	console.error('**** NO BOARD DETECTED ****')
	return -1
}
console.log(`-> ${board} detected!`)

// Home
app.get('/', (req, res) => {
	//res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/', (req,res) => {
	res.redirect('back')
	
});

app.set('port', 3000);

// Start
app.post('/start', (req, res) => {
	if(!capture) {
		console.log('\n-> Starting capture...\n')
		powerInfo.GPU_BEFORE_START = powerInfo.AVG_BASELINE_GPU
		powerInfo.CPU_BEFORE_START = powerInfo.AVG_BASELINE_CPU
		
		if(board == 'xavier_tx2') {
			powerInfo.SOC_BEFORE_START = powerInfo.AVG_BASELINE_SOC
			powerInfo.DDR_BEFORE_START = powerInfo.AVG_BASELINE_DDR
			powerInfo.TOTAL_BEFORE = powerInfo.CPU_BEFORE_START + powerInfo.GPU_BEFORE_START + powerInfo.SOC_BEFORE_START + powerInfo.DDR_BEFORE_START
			console.log(`\nGPU Before start: ${powerInfo.GPU_BEFORE_START} W\nCPU Before start: ${powerInfo.CPU_BEFORE_START} W\nSOC Before start: ${powerInfo.SOC_BEFORE_START}W\nDDR Before start: ${powerInfo.DDR_BEFORE_START}W\nTotal Power Before Start: ${powerInfo.TOTAL_BEFORE} W\n`)
		} else {
			powerInfo.TOTAL_BEFORE = parseFloat(powerInfo.CPU_BEFORE_START) + parseFloat(powerInfo.GPU_BEFORE_START)
			
			console.log(`\nGPU Before start: ${powerInfo.GPU_BEFORE_START} W\nCPU Before start: ${powerInfo.CPU_BEFORE_START} W\nTotal Power Before Start: ${powerInfo.TOTAL_BEFORE} W\n`)
		}

		capture = true
		calib = 10
	}

	BASELINE_GPU = 0
	COUNTER_BASELINE_GPU = 0
	
	BASELINE_CPU = 0
	COUNTER_BASELINE_CPU = 0
	
	BASELINE_DDR = 0
	COUNTER_BASELINE_DDR = 0

	BASELINE_SOC = 0
	COUNTER_BASELINE_SOC = 0
	
	res.end()
});

// Stop
app.post('/stop', (req, res) => {
	if(capture) {
		powerInfo.GPU_FINAL = powerInfo.GPU_FINAL
		powerInfo.CPU_FINAL = powerInfo.CPU_FINAL
		console.log('\n-> Stopping capture...\n')
		if(board == 'xavier_tx2') {
			powerInfo.SOC_FINAL = powerInfo.SOC_FINAL
			powerInfo.DDR_FINAL = powerInfo.DDR_FINAL
			powerInfo.TOTAL = powerInfo.GPU_FINAL + powerInfo.DDR_FINAL + powerInfo.SOC_FINAL + powerInfo.CPU_FINAL
			console.log(`\nGPU under load: ${powerInfo.GPU_FINAL} W\nCPU under load: ${powerInfo.DDR_FINAL} W\nSoC under load: ${powerInfo.SOC_FINAL} W\nTotal Board Power: ${powerInfo.TOTAL} W\nTotal Inference Power: ${powerInfo.TOTAL - powerInfo.TOTAL_BEFORE} W\n`)
		} else {
			powerInfo.TOTAL = parseFloat(powerInfo.GPU_FINAL) + parseFloat(powerInfo.CPU_FINAL)
			console.log(`\nGPU under load: ${powerInfo.GPU_FINAL} W\nCPU under load: ${powerInfo.CPU_FINAL} W\nTotal Board Power: ${powerInfo.TOTAL} W\n-->Total Inference Power: ${powerInfo.TOTAL - powerInfo.TOTAL_BEFORE} W<--\n`)
		}
		capture = false
		calib = 10
	}

	POWER_GPU = 0
	COUNTER_POWER_GPU = 0

	POWER_CPU = 0
	COUNTER_BASELINE_CPU = 0

	POWER_DDR = 0
	COUNTER_POWER_DDR = 0

	POWER_SOC = 0
	COUNTER_POWER_SOC = 0
	
	res.end()
})

app.listen(3000, () => {
	console.log('-> Listening on port 3000...')
})

let startAndCalibrate = () => {
	if(calib > 0) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`-> Calibrating (${calib})`)
		calib -= 1
	} else {
		if(capture) {	
			fs.readFile(GPU_POWER_FILE_NAME, 'utf-8', (err, data) => {
				if(err) throw err;
				currentPower = parseInt(data)
				POWER_GPU += currentPower
				COUNTER_POWER_GPU++
			})
			fs.readFile(CPU_POWER_FILE_NAME, 'utf-8', (err, data) => {
				if(err) throw err;
				currentPower = parseInt(data)
				POWER_CPU += currentPower
				COUNTER_POWER_CPU++
			})
	
			if(board == 'xavier_tx2') {
				fs.readFile(SOC_POWER_FILE_NAME, 'utf-8', (err, data) => {
					if(err) throw err;
					currentPower = parseInt(data)
					POWER_SOC += currentPower
					COUNTER_POWER_SOC++
				})
				fs.readFile(DDR_POWER_FILE_NAME, 'utf-8', (err, data) => {
					if(err) throw err;
					currentPower = parseInt(data)
					POWER_DDR += currentPower
					COUNTER_POWER_DDR++
				})
				powerInfo.SOC_FINAL = POWER_SOC / (COUNTER_POWER_SOC * 1000)
				powerInfo.SOC_FINAL = powerInfo.SOC_FINAL.toFixed(6)

				powerInfo.DDR_FINAL = POWER_DDR / (COUNTER_POWER_DDR * 1000)	
				powerInfo.DDR_FINAL = powerInfo.DDR_FINAL.toFixed(6)
			}
				powerInfo.GPU_FINAL = POWER_GPU / (COUNTER_POWER_GPU * 1000)
				powerInfo.GPU_FINAL = powerInfo.GPU_FINAL.toFixed(6)

				powerInfo.CPU_FINAL = POWER_CPU / (COUNTER_POWER_CPU * 1000)
				powerInfo.CPU_FINAL = powerInfo.CPU_FINAL.toFixed(6)
	

				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write(`(LOAD) Avg CPU: ${powerInfo.CPU_FINAL} W | Avg GPU: ${powerInfo.GPU_FINAL} W | Avg SoC: ${powerInfo.SOC_FINAL} W | Avg DDR: ${powerInfo.DDR_FINAL} W`)
				
		} else {
			fs.readFile(GPU_POWER_FILE_NAME, 'utf-8', (err, data) => {
				if(err) throw err;
				currentPower = parseInt(data)
				BASELINE_GPU += currentPower
				COUNTER_BASELINE_GPU++
			})
			
			fs.readFile(CPU_POWER_FILE_NAME, 'utf-8', (err, data) => {
				if(err) throw err;
				currentPower = parseInt(data)
				BASELINE_CPU += currentPower
				COUNTER_BASELINE_CPU++
			})
	
			if(board == 'xavier_tx2') {
				fs.readFile(SOC_POWER_FILE_NAME, 'utf-8', (err, data) => {
					if(err) throw err;
					currentPower = parseInt(data)
					BASELINE_SOC += currentPower
					COUNTER_BASELINE_SOC++
				})
				fs.readFile(DDR_POWER_FILE_NAME, 'utf-8', (err, data) => {
					if(err) throw err;
					currentPower = parseInt(data)
					BASELINE_DDR += currentPower
					COUNTER_BASELINE_DDR++
				})
				powerInfo.AVG_BASELINE_SOC = BASELINE_SOC / (COUNTER_BASELINE_SOC * 1000)
				powerInfo.AVG_BASELINE_SOC = powerInfo.AVG_BASELINE_SOC.toFixed(6)

				powerInfo.AVG_BASELINE_DDR = BASELINE_DDR / (COUNTER_BASELINE_DDR * 1000)
				powerInfo.AVG_BASELINE_DDR = powerInfo.AVG_BASELINE_DDR.toFixed(6)
			}
				powerInfo.AVG_BASELINE_GPU = BASELINE_GPU / (COUNTER_BASELINE_GPU * 1000)
				powerInfo.AVG_BASELINE_GPU = powerInfo.AVG_BASELINE_GPU.toFixed(6)

				powerInfo.AVG_BASELINE_CPU = BASELINE_CPU / (COUNTER_BASELINE_CPU * 1000)
				powerInfo.AVG_BASELINE_CPU = powerInfo.AVG_BASELINE_CPU.toFixed(6)
	
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write(`(IDLE) Avg CPU: ${powerInfo.AVG_BASELINE_CPU} W | Avg GPU: ${powerInfo.AVG_BASELINE_GPU} W | Avg SoC: ${powerInfo.AVG_BASELINE_SOC} W | Avg DDR: ${powerInfo.AVG_BASELINE_DDR} W`)
			}
	}
	
}

timer = setInterval(startAndCalibrate, 1000)

