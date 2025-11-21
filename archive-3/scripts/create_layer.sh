#!/bin/bash
set -e

# Create directory
mkdir -p src/layers/sklearn/python
mkdir -p artifacts

# Clean old files
rm -rf src/layers/sklearn/python/*
rm -f artifacts/sklearn_layer.zip

# Install packages
echo "Downloading packages..."
pip install \
    --platform manylinux2014_x86_64 \
    --target src/layers/sklearn/python \
    --implementation cp \
    --python-version 3.11 \
    --only-binary=:all: \
    --upgrade \
    scikit-learn==1.3.2 \
    joblib==1.3.2 \
    threadpoolctl==3.2.0 \
    scipy==1.11.4 \
    numpy==1.26.2

# Cleanup to reduce size
echo "Cleaning up..."
cd src/layers/sklearn/python
find . -type d -name "tests" -exec rm -rf {} +
find . -type d -name "__pycache__" -exec rm -rf {} +
rm -rf sklearn/datasets
rm -rf scipy/stats/tests
rm -rf numpy/f2py/tests
rm -rf numpy/core/tests
cd ../../../..

# Check size
echo "Checking size..."
SIZE_MB=$(du -sk src/layers/sklearn/python | cut -f1)
SIZE_MB=$((SIZE_MB / 1024))
echo "Unzipped size: ${SIZE_MB}MB"

# Zip it
cd src/layers/sklearn
zip -r -q ../../../artifacts/sklearn_layer.zip python
cd ../../..

echo "Layer created: artifacts/sklearn_layer.zip"
ls -lh artifacts/sklearn_layer.zip
