#!/bin/bash

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_imagenet.py image/ --model efficientnet_b0 --checkpoint models/ImageNet/B0.pth --img-size 224 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_imagenet.py image/ --model efficientnet_bc1 --checkpoint models/ImageNet/BC1.pth --img-size 195 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_imagenet.py image/ --model efficientnet_bc2 --checkpoint models/ImageNet/BC2.pth --img-size 170 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_imagenet.py image/ --model efficientnet_bc3 --checkpoint models/ImageNet/BC3.pth --img-size 145 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_imagenet.py image/ --model efficientnet_bc4 --checkpoint models/ImageNet/BC4.pth --img-size 128 --batch-size 1


echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_cifar.py --model efficientnet_b0 --checkpoint models/CIFAR100/B0.pth --img-size 224 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_cifar.py --model efficientnet_bc1 --checkpoint models/CIFAR100/BC1.pth --img-size 195 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_cifar.py --model efficientnet_bc2 --checkpoint models/CIFAR100/BC2.pth --img-size 170 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_cifar.py --model efficientnet_bc3 --checkpoint models/CIFAR100/BC3.pth --img-size 145 --batch-size 1

echo "sleeping for 70s to let the power stabalize"
sleep 70s
python3 inference_cifar.py --model efficientnet_bc4 --checkpoint models/CIFAR100/BC4.pth --img-size 128 --batch-size 1