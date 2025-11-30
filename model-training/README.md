# 🤖 Waste Classification Model Training

Train deep learning models for waste classification using Kaggle datasets.

## Features

- 📊 Data exploration and visualization
- 🏗️ Multiple model architectures (CNN, MobileNet, ResNet)
- 🔄 Data augmentation pipeline
- 📈 Training with callbacks and monitoring
- 📉 Comprehensive evaluation metrics
- 📓 Jupyter notebooks for interactive training

## Quick Start

### 1. Setup Environment
```bash
chmod +x setup.sh
./setup.sh
source venv/bin/activate
```

### 2. Setup Kaggle API
```bash
# Create Kaggle directory
mkdir -p ~/.kaggle

# Add your credentials to ~/.kaggle/kaggle.json
{
  "username": "your_username",
  "key": "your_api_key"
}

# Set permissions
chmod 600 ~/.kaggle/kaggle.json
```

### 3. Download Dataset
```bash
# Option 1: Using script
python scripts/download_dataset.py --dataset techsash/waste-classification-data

# Option 2: Alternative dataset
python scripts/download_dataset.py --dataset mostafaabla/garbage-classification
```

### 4. Train Model
```bash
# Using default configuration
python scripts/train_model.py

# With custom config
python scripts/train_model.py --config configs/training_config.yaml
```

### 5. Evaluate Model
```bash
python scripts/evaluate_model.py --model models/final/waste_classifier.h5
```

## Project Structure
```
model-training/
├── notebooks/              # Jupyter notebooks
├── scripts/               # Training scripts
├── data/                  # Dataset directory
├── models/                # Saved models
├── configs/               # Configuration files
└── utils/                 # Utility modules
```

## Datasets

Recommended Kaggle datasets:

1. **Waste Classification Data**
   - Dataset: `techsash/waste-classification-data`
   - Classes: 6 categories
   - Images: ~15,000

2. **Garbage Classification**
   - Dataset: `mostafaabla/garbage-classification`
   - Classes: 12 categories
   - Images: ~15,000

3. **TrashNet**
   - Dataset: `asdasdasasdas/garbage-classification`
   - Classes: 6 categories
   - Images: ~2,500

## Training Configuration

Edit `configs/training_config.yaml` to customize:

- Model architecture
- Training hyperparameters
- Data augmentation
- Callbacks and monitoring

## Using Jupyter Notebooks
```bash
jupyter notebook
```

Open notebooks:
1. `01_data_exploration.ipynb` - Explore dataset
2. `02_model_training.ipynb` - Train model interactively
3. `03_model_evaluation.ipynb` - Evaluate performance

## Model Architectures

### CNN (Custom)
- 4 convolutional blocks
- Batch normalization
- Dropout regularization
- Dense layers with 512/256 neurons

### Transfer Learning
- **MobileNetV2**: Lightweight, fast
- **EfficientNetB0**: Balanced accuracy/speed
- **ResNet50**: High accuracy

## Results

After training, you'll find:

- `models/final/` - Trained models
- `models/checkpoints/` - Training checkpoints
- `logs/training/` - Training logs
- `models/training_history.png` - Training curves
- `models/confusion_matrix.png` - Confusion matrix

## Tips for Better Performance

1. **Data Quality**
   - Remove corrupted images
   - Balance class distribution
   - Increase dataset size

2. **Training**
   - Use data augmentation
   - Train for more epochs
   - Use learning rate scheduling
   - Try transfer learning

3. **Hyperparameters**
   - Adjust learning rate
   - Tune batch size
   - Modify dropout rates
   - Experiment with optimizers

## Troubleshooting

### CUDA/GPU Issues
```bash
# Check GPU
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"

# Install CUDA-specific TensorFlow
pip install tensorflow[and-cuda]
```

### Memory Issues
```bash
# Reduce batch size in config
batch_size: 16  # Instead of 32

# Enable memory growth
hardware:
  memory_growth: true
```

### Dataset Not Found
```bash
# Verify Kaggle credentials
cat ~/.kaggle/kaggle.json

# Re-download dataset
python scripts/download_dataset.py --dataset YOUR_DATASET
```

## License

MIT License

## Support

For issues, open a GitHub issue or check documentation.