"""
Main Training Script for Waste Classification Model

This script trains a CNN model on waste classification dataset
from Kaggle with data augmentation and callbacks.
"""

import os
import sys
import yaml
import argparse
from pathlib import Path
from datetime import datetime

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    ModelCheckpoint, 
    EarlyStopping, 
    ReduceLROnPlateau,
    TensorBoard,
    CSVLogger
)

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from utils.data_loader import create_data_generators
from utils.visualization import plot_training_history, plot_confusion_matrix

class WasteClassifier:
    """Waste Classification Model Trainer"""
    
    def __init__(self, config_path="configs/training_config.yaml"):
        """Initialize trainer with configuration"""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.img_size = self.config['dataset']['image_size']
        self.num_classes = self.config['dataset']['num_classes']
        self.model = None
        self.history = None
        
        # Setup GPU
        self._setup_gpu()
        
    def _setup_gpu(self):
        """Configure GPU settings"""
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                print(f"✅ {len(gpus)} GPU(s) available")
            except RuntimeError as e:
                print(f"⚠️ GPU setup error: {e}")
        else:
            print("⚠️ No GPU found, using CPU")
    
    def build_cnn_model(self):
        """Build custom CNN model"""
        cnn_config = self.config['model']['cnn']
        
        model = keras.Sequential([
            # Input layer
            layers.Input(shape=(self.img_size, self.img_size, 3)),
            
            # Convolutional blocks
            layers.Conv2D(32, 3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Dropout(0.25),
            
            layers.Conv2D(64, 3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Dropout(0.25),
            
            layers.Conv2D(128, 3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Dropout(0.25),
            
            layers.Conv2D(256, 3, activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Dropout(0.25),
            
            # Dense layers
            layers.Flatten(),
            layers.Dense(512, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.5),
            layers.Dense(256, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.5),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        return model
    
    def build_transfer_learning_model(self):
        """Build model using transfer learning"""
        tl_config = self.config['model']['transfer_learning']
        base_model_name = tl_config['base_model']
        
        # Load base model
        if base_model_name == "MobileNetV2":
            base_model = keras.applications.MobileNetV2(
                input_shape=(self.img_size, self.img_size, 3),
                include_top=False,
                weights=tl_config['weights']
            )
        elif base_model_name == "EfficientNetB0":
            base_model = keras.applications.EfficientNetB0(
                input_shape=(self.img_size, self.img_size, 3),
                include_top=False,
                weights=tl_config['weights']
            )
        elif base_model_name == "ResNet50":
            base_model = keras.applications.ResNet50(
                input_shape=(self.img_size, self.img_size, 3),
                include_top=False,
                weights=tl_config['weights']
            )
        else:
            raise ValueError(f"Unknown base model: {base_model_name}")
        
        # Freeze base model layers
        base_model.trainable = not tl_config['freeze_layers']
        
        # Build complete model
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        return model
    
    def build_model(self):
        """Build model based on configuration"""
        model_type = self.config['model']['type']
        
        if model_type == 'cnn':
            self.model = self.build_cnn_model()
        elif model_type in ['mobilenet', 'efficientnet', 'resnet']:
            self.model = self.build_transfer_learning_model()
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Compile model
        training_config = self.config['training']
        self.model.compile(
            optimizer=keras.optimizers.Adam(
                learning_rate=training_config['initial_learning_rate']
            ),
            loss=training_config['loss'],
            metrics=training_config['metrics']
        )
        
        return self.model
    
    def get_callbacks(self):
        """Setup training callbacks"""
        callbacks = []
        
        # Model checkpoint
        if self.config['training']['callbacks']['model_checkpoint']:
            checkpoint_dir = self.config['saving']['checkpoint_dir']
            os.makedirs(checkpoint_dir, exist_ok=True)
            
            checkpoint_path = os.path.join(
                checkpoint_dir,
                'model_epoch_{epoch:02d}_val_acc_{val_accuracy:.4f}.h5'
            )
            
            callbacks.append(ModelCheckpoint(
                checkpoint_path,
                save_best_only=self.config['saving']['save_best_only'],
                monitor=self.config['saving']['monitor'],
                mode=self.config['saving']['mode'],
                verbose=1
            ))
        
        # Early stopping
        if self.config['training']['early_stopping']['enabled']:
            es_config = self.config['training']['early_stopping']
            callbacks.append(EarlyStopping(
                patience=es_config['patience'],
                monitor=es_config['monitor'],
                restore_best_weights=es_config['restore_best_weights'],
                verbose=1
            ))
        
        # Learning rate reduction
        if self.config['training']['lr_schedule']['enabled']:
            lr_config = self.config['training']['lr_schedule']
            callbacks.append(ReduceLROnPlateau(
                factor=lr_config['factor'],
                patience=lr_config['patience'],
                min_lr=lr_config['min_lr'],
                verbose=1
            ))
        
        # TensorBoard
        if self.config['training']['callbacks']['tensorboard']:
            log_dir = f"logs/tensorboard/{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            os.makedirs(log_dir, exist_ok=True)
            callbacks.append(TensorBoard(log_dir=log_dir, histogram_freq=1))
        
        # CSV Logger
        if self.config['training']['callbacks']['csv_logger']:
            log_dir = "logs/training"
            os.makedirs(log_dir, exist_ok=True)
            csv_path = os.path.join(log_dir, f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
            callbacks.append(CSVLogger(csv_path))
        
        return callbacks
    
    def train(self, train_generator, val_generator):
        """Train the model"""
        if self.model is None:
            self.build_model()
        
        print("\n" + "="*50)
        print("Starting Training")
        print("="*50)
        self.model.summary()
        
        # Get callbacks
        callbacks = self.get_callbacks()
        
        # Train model
        self.history = self.model.fit(
            train_generator,
            epochs=self.config['training']['epochs'],
            validation_data=val_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        return self.history
    
    def save_model(self, save_path=None):
        """Save trained model"""
        if save_path is None:
            model_dir = self.config['saving']['model_dir']
            os.makedirs(model_dir, exist_ok=True)
            save_path = os.path.join(
                model_dir,
                f'waste_classifier_{datetime.now().strftime("%Y%m%d_%H%M%S")}.h5'
            )
        
        self.model.save(save_path)
        print(f"✅ Model saved to: {save_path}")
        
        return save_path
    
    def evaluate(self, test_generator):
        """Evaluate model on test data"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        print("\n" + "="*50)
        print("Evaluating Model")
        print("="*50)
        
        results = self.model.evaluate(test_generator, verbose=1)
        
        print(f"\nTest Loss: {results[0]:.4f}")
        print(f"Test Accuracy: {results[1]:.4f}")
        
        return results

def main():
    """Main training function"""
    parser = argparse.ArgumentParser(description='Train Waste Classification Model')
    parser.add_argument('--config', type=str, default='configs/training_config.yaml',
                       help='Path to configuration file')
    parser.add_argument('--data-dir', type=str, default='data/raw',
                       help='Path to dataset directory')
    args = parser.parse_args()
    
    print("="*60)
    print("🤖 Waste Classification Model Training")
    print("="*60)
    
    # Initialize trainer
    trainer = WasteClassifier(config_path=args.config)
    
    # Create data generators
    print("\n📊 Loading dataset...")
    train_gen, val_gen, test_gen = create_data_generators(
        data_dir=args.data_dir,
        config=trainer.config
    )
    
    print(f"Training samples: {train_gen.samples}")
    print(f"Validation samples: {val_gen.samples}")
    print(f"Test samples: {test_gen.samples}")
    print(f"Classes: {list(train_gen.class_indices.keys())}")
    
    # Build model
    print("\n🏗️ Building model...")
    trainer.build_model()
    
    # Train model
    print("\n🚀 Starting training...")
    history = trainer.train(train_gen, val_gen)
    
    # Evaluate model
    print("\n📈 Evaluating model...")
    trainer.evaluate(test_gen)
    
    # Save model
    print("\n💾 Saving model...")
    model_path = trainer.save_model()
    
    # Plot training history
    print("\n📊 Generating visualizations...")
    plot_training_history(history, save_path='models/training_history.png')
    
    print("\n" + "="*60)
    print("✅ Training completed successfully!")
    print(f"📁 Model saved to: {model_path}")
    print("="*60)

if __name__ == "__main__":
    main()