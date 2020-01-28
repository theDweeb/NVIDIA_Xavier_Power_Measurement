#!/bin/bash

echo " "
echo "DDR"
cat /sys/bus/i2c/drivers/ina3221x/1-0041/iio_device/in_power1_input
echo "SoC"
cat /sys/bus/i2c/drivers/ina3221x/1-0040/iio_device/in_power2_input
echo "GPU"
cat /sys/bus/i2c/drivers/ina3221x/1-0040/iio_device/in_power0_input
