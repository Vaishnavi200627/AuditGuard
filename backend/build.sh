#!/usr/bin/env bash
set -o errexit

apt-get update
apt-get install -y tesseract-ocr libzbar0
pip install -r requirements.txt
