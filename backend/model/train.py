"""
Waste Classification Model Training Script

This script provides functionality to train a CNN model
for waste classification using TensorFlow/Keras.
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import matplotlib.pyplot as plt
import os
import numpy as np
from pathlib import Path

class WasteClassifierTrainer:
    """Trainer class for waste classification model"""
    
    def __init__(self, img_size=224, num_classes=8):
        """
        Initialize trainer
        
        Args:
            img_size: Input image size
            num_classes: Number of waste categories
        """
        self.img_size = img_size
        self.num_classes = num_classes
        self.model = None
        self.history = None
    
    def build_model(self, model_type='cnn'):
        """
        Build classification model
        
        Args:
            model_type: 'cnn' or 'transfer' (using pre-trained model)
        """
        if model_type == 'cnn':
            self.model = self._build_cnn()
        elif model_type == 'transfer':
            self.model = self._build_transfer_learning_model()
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        return self.model
    
    def _build_cnn(self):
        """Build custom CNN model"""
        model = keras.Sequential([
            # First convolutional block
            layers.Conv2D(32, (3, 3), activation='relu', 
                         input_shape=(self.img_size, self.img_size, 3)),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Second convolutional block
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Third convolutional block
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Fourth convolutional block
            layers.Conv2D(256, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
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
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3)]
        )
        
        return model
    
    def _build_transfer_learning_model(self):
        """Build model using transfer learning (MobileNetV2)"""
        base_model = keras.applications.MobileNetV2(
            input_shape=(self.img_size, self.img_size, 3),
            include_top=False,
            weights='imagenet'
        )
        
        # Freeze base model
        base_model.trainable = False
        
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def create_data_generators(self, train_dir, validation_split=0.2, batch_size=32):
        """
        Create data generators for training
        
        Args:
            train_dir: Directory containing training data
            validation_split: Validation split ratio
            batch_size: Batch size for training
            
        Returns:
            train_generator, validation_generator
        """
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=30,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest',
            validation_split=validation_split
        )
        
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(self.img_size, self.img_size),
            batch_size=batch_size,
            class_mode='categorical',
            subset='training'
        )
        
        validation_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(self.img_size, self.img_size),
            batch_size=batch_size,
            class_mode='categorical',
            subset='validation'
        )
        
        return train_generator, validation_generator
    
    def train(self, train_generator, validation_generator, epochs=30, save_path='model.h5'):
        """
        Train the model
        
        Args:
            train_generator: Training data generator
            validation_generator: Validation data generator
            epochs: Number of training epochs
            save_path: Path to save best model
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first.")
        
        callbacks = [
            ModelCheckpoint(
                save_path,
                save_best_only=True,
                monitor='val_accuracy',
                mode='max',
                verbose=1
            ),
            EarlyStopping(
                patience=5,
                monitor='val_loss',
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                factor=0.5,
                patience=3,
                monitor='val_loss',
                verbose=1
            )
        ]
        
        self.history = self.model.fit(
            train_generator,
            epochs=epochs,
            validation_data=validation_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        return self.history
    
    def plot_history(self, save_path='training_history.png'):
        """Plot training history"""
        if self.history is None:
            print("No training history available")
            return
        
        fig, axes = plt.subplots(1, 2, figsize=(15, 5))
        
        # Accuracy plot
        axes[0].plot(self.history.history['accuracy'], label='Training Accuracy')
        axes[0].plot(self.history.history['val_accuracy'], label='Validation Accuracy')
        axes[0].set_title('Model Accuracy')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Accuracy')
        axes[0].legend()
        axes[0].grid(True)
        
        # Loss plot
        axes[1].plot(self.history.history['loss'], label='Training Loss')
        axes[1].plot(self.history.history['val_loss'], label='Validation Loss')
        axes[1].set_title('Model Loss')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Loss')
        axes[1].legend()
        axes[1].grid(True)
        
        plt.tight_layout()
        plt.savefig(save_path)
        print(f"Training history saved to {save_path}")
        plt.show()
    
    def evaluate(self, test_generator):
        """Evaluate model on test data"""
        if self.model is None:
            raise ValueError("Model not available")
        
        results = self.model.evaluate(test_generator)
        print(f"\nTest Loss: {results[0]:.4f}")
        print(f"Test Accuracy: {results[1]:.4f}")
        
        return results

# Example usage
if __name__ == "__main__":
    print("="*50)
    print("Waste Classification Model Trainer")
    print("="*50)
    
    # Initialize trainer
    trainer = WasteClassifierTrainer(img_size=224, num_classes=8)
    
    # Build model
    model = trainer.build_model(model_type='cnn')
    model.summary()
    
    print("\nModel built successfully!")
    print("\nTo train the model:")
    print("1. Prepare dataset with subdirectories for each class")
    print("2. Use create_data_generators() to load data")
    print("3. Call train() method to start training")