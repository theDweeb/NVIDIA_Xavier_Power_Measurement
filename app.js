const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const open = require('open');

let capture = false
let board = ''

SOC_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/1-0040/iio_device/in_power2_input";
GPU_POWER_FILE_NAME = ''
DDR_POWER_FILE_NAME = ''


try {
	if(fs.existsSync(SOC_POWER_FILE_NAME)) {
		console.log('-> Board detected: Xavier')
		board = 'xavier'
		GPU_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/1-0040/iio_device/in_power0_input";
		DDR_POWER_FILE_NAME = "/sys/bus/i2c/drivers/ina3221x/1-0041/iio_device/in_power1_input";
	}
	else {
		console.log('-> Board detected: Nano')
		board = 'nano'
		GPU_POWER_FILE_NAME = "/sys/devices/3160000.i2c/i2c-0/0-0040/iio_device/in_power0_input";
		DDR_POWER_FILE_NAME = "/sys/devices/3160000.i2c/i2c-0/0-0041/iio_device/in_power2_input";
	}
} catch(err) {
	console.error(err)
}

let BASELINE_GPU = 0
let POWER_GPU = 0
let COUNTER_BASELINE_GPU = 0
let COUNTER_POWER_GPU = 0

let BASELINE_DDR = 0
let POWER_DDR = 0
let COUNTER_BASELINE_DDR = 0
let COUNTER_POWER_DDR = 0

let BASELINE_SOC = 0
let POWER_SOC = 0
let COUNTER_BASELINE_SOC = 0
let COUNTER_POWER_SOC = 0

powerInfo = {
	AVG_BASELINE_GPU: 0,
	AVG_BASELINE_DDR: 0,
	AVG_BASELINE_SOC: 0,
	GPU_BEFORE_START: 0,
	DDR_BEFORE_START: 0,
	SOC_BEFORE_START: 0,
	TOTAL_BEFORE: 0,
	GPU_FINAL: 0,
	DDR_FINAL: 0,
	SOC_FINAL: 0,
	TOTAL: 0
}

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/', (req,res) => {
	res.redirect('back')
	
});

app.post('/start', (req, res) => {
	if(!capture) {
		console.log('\n-> Starting capture...\n')
		powerInfo.GPU_BEFORE_START = powerInfo.AVG_BASELINE_GPU
		powerInfo.DDR_BEFORE_START = powerInfo.AVG_BASELINE_DDR
		
		if(board == 'xavier') {
			powerInfo.SOC_BEFORE_START = powerInfo.AVG_BASELINE_SOC
			powerInfo.TOTAL_BEFORE = powerInfo.SOC_BEFORE_START + powerInfo.DDR_BEFORE_START + powerInfo.GPU_BEFORE_START
			console.log(`\nGPU Before start: ${powerInfo.GPU_BEFORE_START} W\nCPU Before start: ${powerInfo.DDR_BEFORE_START} W\nSOC Before start: ${powerInfo.SOC_BEFORE_START}W\nTotal Power Before Start: ${powerInfo.TOTAL_BEFORE} W\n`)
		} else {
			powerInfo.TOTAL_BEFORE = powerInfo.DDR_BEFORE_START + powerInfo.GPU_BEFORE_START
			console.log(`\nGPU Before start: ${powerInfo.GPU_BEFORE_START} W\nCPU Before start: ${powerInfo.DDR_BEFORE_START} W\nTotal Power Before Start: ${powerInfo.TOTAL_BEFORE} W\n`)
		}

		capture = true		
	}

	BASELINE_GPU = 0
	COUNTER_BASELINE_GPU = 0

	BASELINE_DDR = 0
	COUNTER_BASELINE_DDR = 0

	BASELINE_SOC = 0
	COUNTER_BASELINE_SOC = 0

	res.redirect('back')
});

app.post('/stop', (req, res) => {
	if(capture) {
		powerInfo.GPU_FINAL = powerInfo.GPU_FINAL
		powerInfo.DDR_FINAL = powerInfo.DDR_FINAL
		console.log('\n-> Stopping capture...\n')
		if(board = 'xavier') {
			powerInfo.SOC_FINAL = powerInfo.SOC_FINAL
			powerInfo.TOTAL = powerInfo.GPU_FINAL + powerInfo.DDR_FINAL + powerInfo.SOC_FINAL
			console.log(`\nGPU under load: ${powerInfo.GPU_FINAL} W\nCPU under load: ${powerInfo.DDR_FINAL} W\nSoC under load: ${powerInfo.SOC_FINAL} W\nTotal power under load: ${powerInfo.TOTAL} W\nTotal Load Power: ${powerInfo.TOTAL - powerInfo.TOTAL_BEFORE} W\n`)
		} else {
			powerInfo.TOTAL = powerInfo.GPU_FINAL + powerInfo.DDR_FINAL
			console.log(`\nGPU under load: ${powerInfo.GPU_FINAL} W\nCPU under load: ${powerInfo.DDR_FINAL} W\nTotal power under load: ${powerInfo.TOTAL} W\nTotal Load Power: ${powerInfo.TOTAL - powerInfo.TOTAL_BEFORE} W\n`)
		}
		capture = false
	}

	POWER_GPU = 0
	COUNTER_POWER_GPU = 0

	POWER_DDR = 0
	COUNTER_POWER_DDR = 0

	POWER_SOC = 0
	COUNTER_POWER_SOC = 0
	
	res.redirect('back')
})

app.listen(3000, () => {
    	console.log('-> Listening on port 3000...')
	open('http://localhost:3000')
})

let startAndCalibrate = () => {
	
	if(capture) {	
		fs.readFile(GPU_POWER_FILE_NAME, 'utf-8', (err, data) => {
			if(err) throw err;
			currentPower = parseInt(data)
			POWER_GPU += currentPower
			COUNTER_POWER_GPU++
		})
		fs.readFile(DDR_POWER_FILE_NAME, 'utf-8', (err, data) => {
			if(err) throw err;
			currentPower = parseInt(data)
			POWER_DDR += currentPower
			COUNTER_POWER_DDR++
		})

		if(board = 'xavier') {
			fs.readFile(SOC_POWER_FILE_NAME, 'utf-8', (err, data) => {
				if(err) throw err;
				currentPower = parseInt(data)
				POWER_SOC += currentPower
				COUNTER_POWER_SOC++
			})
			powerInfo.SOC_FINAL = POWER_SOC / (COUNTER_POWER_SOC * 1000)		
		}
			powerInfo.GPU_FINAL = POWER_GPU / (COUNTER_POWER_GPU * 1000)
			powerInfo.DDR_FINAL = POWER_DDR / (COUNTER_POWER_DDR * 1000)

			if(COUNTER_POWER_DDR % 10 == 0) {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`Avg SoC(LOAD): ${powerInfo.SOC_FINAL} W | Avg GPU(LOAD): ${powerInfo.GPU_FINAL} W | Avg DDR(LOAD): ${powerInfo.DDR_FINAL} W`)
		}	
			
	} else {
		fs.readFile(GPU_POWER_FILE_NAME, 'utf-8', (err, data) => {
			if(err) throw err;
			currentPower = parseInt(data)
			BASELINE_GPU += currentPower
			COUNTER_BASELINE_GPU++
		})
		fs.readFile(DDR_POWER_FILE_NAME, 'utf-8', (err, data) => {
			if(err) throw err;
			currentPower = parseInt(data)
			BASELINE_DDR += currentPower
			COUNTER_BASELINE_DDR++
		})

		if(board = 'xavier') {

			fs.readFile(SOC_POWER_FILE_NAME, 'utf-8', (err, data) => {
				if(err) throw err;
				currentPower = parseInt(data)
				BASELINE_SOC += currentPower
				COUNTER_BASELINE_SOC++
			})
			powerInfo.AVG_BASELINE_SOC = BASELINE_SOC / (COUNTER_BASELINE_SOC * 1000)
		}
			powerInfo.AVG_BASELINE_GPU = BASELINE_GPU / (COUNTER_BASELINE_GPU * 1000)
			powerInfo.AVG_BASELINE_DDR = BASELINE_DDR / (COUNTER_BASELINE_DDR * 1000)

		if(COUNTER_BASELINE_DDR % 10 == 0) {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`Avg SoC: ${powerInfo.AVG_BASELINE_SOC} W | Avg GPU: ${powerInfo.AVG_BASELINE_GPU} W | Avg DDR: ${powerInfo.AVG_BASELINE_DDR} W`)
		}	
	}
}
timer = setInterval(startAndCalibrate, 100)

