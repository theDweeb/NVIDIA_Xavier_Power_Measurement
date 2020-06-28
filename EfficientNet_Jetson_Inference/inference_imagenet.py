#!/usr/bin/env python
"""PyTorch Inference Script

An example inference script that outputs top-k class ids for images in a folder into a csv.

Hacked together by Ross Wightman (https://github.com/rwightman)
"""
import os
import time
import argparse
import logging
import numpy as np
import torch
import requests
import yaml
from os import path
from timm.models import create_model, apply_test_time_pool
from timm.data import Dataset, create_loader, resolve_data_config
from timm.utils import AverageMeter, setup_default_logging

torch.backends.cudnn.benchmark = True

parser = argparse.ArgumentParser(description='PyTorch ImageNet Inference')
parser.add_argument('data', metavar='DIR',
                    help='path to dataset')
parser.add_argument('--output_dir', metavar='DIR', default='./',
                    help='path to output files')
parser.add_argument('--model', '-m', metavar='MODEL', default='dpn92',
                    help='model architecture (default: dpn92)')
parser.add_argument('-j', '--workers', default=2, type=int, metavar='N',
                    help='number of data loading workers (default: 2)')
parser.add_argument('-b', '--batch-size', default=256, type=int,
                    metavar='N', help='mini-batch size (default: 256)')
parser.add_argument('--img-size', default=224, type=int,
                    metavar='N', help='Input image dimension')
parser.add_argument('--mean', type=float, nargs='+', default=None, metavar='MEAN',
                    help='Override mean pixel value of dataset')
parser.add_argument('--std', type=float, nargs='+', default=None, metavar='STD',
                    help='Override std deviation of of dataset')
parser.add_argument('--interpolation', default='', type=str, metavar='NAME',
                    help='Image resize interpolation type (overrides model)')
parser.add_argument('--num-classes', type=int, default=1000,
                    help='Number classes in dataset')
parser.add_argument('--log-freq', default=1, type=int,
                    metavar='N', help='batch logging frequency (default: 10)')
parser.add_argument('--checkpoint', default='', type=str, metavar='PATH',
                    help='path to latest checkpoint (default: none)')
parser.add_argument('--pretrained', dest='pretrained', action='store_true',
                    help='use pre-trained model')
parser.add_argument('--num-gpu', type=int, default=1,
                    help='Number of GPUS to use')
parser.add_argument('--no-test-pool', dest='no_test_pool', action='store_true',
                    help='disable test time pool')
parser.add_argument('--topk', default=5, type=int,
                    metavar='N', help='Top-k to output to CSV')


def main():
    setup_default_logging()
    args = parser.parse_args()

    start_endpoint = "http://localhost:3000/start"
    stop_endpoint = "http://localhost:3000/stop"
    # might as well try to do something useful...
    args.pretrained = args.pretrained or not args.checkpoint

    output_dir = args.checkpoint.split('/')
    output_dir.pop(-1)
    output_dir = ('/').join(output_dir)
    #model_path = output_dir + '/model_best.pth'

    # create model
    model = create_model(
        args.model,
        num_classes=args.num_classes,
        in_chans=3,
        pretrained=args.pretrained,
        checkpoint_path=args.checkpoint)

    logging.info('Model %s created, param count: %d' %
                 (args.model, sum([m.numel() for m in model.parameters()])))

    config = resolve_data_config(vars(args), model=model)
    model, test_time_pool = apply_test_time_pool(model, config, args)

    if args.num_gpu > 1:
        model = torch.nn.DataParallel(
            model, device_ids=list(range(args.num_gpu))).cuda()
    else:
        model = model.cuda()

    loader = create_loader(
        Dataset(args.data),
        input_size=config['input_size'],
        batch_size=args.batch_size,
        use_prefetcher=True,
        interpolation=config['interpolation'],
        mean=config['mean'],
        std=config['std'],
        num_workers=args.workers,
        crop_pct=1.0 if test_time_pool else config['crop_pct'])

    model.eval()

    batch_time = AverageMeter()
    with torch.no_grad():
        idle_power = requests.post(url=start_endpoint)
        idle_json = idle_power.json()
        for batch_idx, (input, _) in enumerate(loader):
            input = input.cuda()

            tstart = time.time()
            output = model(input)
            tend = time.time()

            if batch_idx != 0:
                batch_time.update(tend - tstart)

                if batch_idx % args.log_freq == 0:
                    print('Predict: [{0}/{1}] Time {batch_time.val:.6f} ({batch_time.avg:.6f})'.format(
                        batch_idx, len(loader), batch_time=batch_time), end='\r')

    load_power = requests.post(url=stop_endpoint)
    load_json = load_power.json()
    fps = 1 / batch_time.avg
    inference_power = float(load_json['load']) - float(idle_json['idle'])
    print('idle power = {}  |   load power = {}     |   Inference Power = {}'.format(idle_json['idle'], load_json['load'], inference_power))
    stats = [{'FPS': [float(fps)]},
                {'Total_Power': [float(inference_power)]}]
    with open(os.path.join(output_dir, '{}_fps_imagenet.yaml'.format(args.model)), 'w') as f:
        yaml.safe_dump(stats, f)


if __name__ == '__main__':
    main()

