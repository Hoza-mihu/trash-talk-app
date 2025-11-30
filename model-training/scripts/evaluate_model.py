"""
Model Evaluation Script

Evaluate trained model performance with detailed metrics
"""

import os
import sys
import argparse
import numpy as np
from pathlib import Path
import yaml

from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from utils.data_loader import create_data_generators
from utils.visualization import plot_confusion_matrix

def evaluate_model(model_path, test_generator):
    """
    Evaluate model and generate metrics
    
    Args:
        model_path: Path to saved model
        test_generator: Test data generator
    """
    print("\n🔍 Loading model...")
    model = keras.models.load_model(model_path)
    
    print("\n📊 Evaluating model...")
    
    # Get predictions
    y_pred_probs = model.predict(test_generator, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_generator.classes
    
    # Get class names
    class_names = list(test_generator.class_indices.keys())
    
    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    plot_confusion_matrix(cm, class_names, save_path='models/confusion_matrix.png')
    
    # Classification Report
    report = classification_report(y_true, y_pred, target_names=class_names)
    print("\n📈 Classification Report:")
    print(report)
    
    # Save report
    with open('models/classification_report.txt', 'w') as f:
        f.write(report)
    
    # Calculate accuracy
    accuracy = np.mean(y_pred == y_true)
    print(f"\n🎯 Overall Accuracy: {accuracy:.4f}")
    
    # Per-class accuracy
    print("\n📊 Per-Class Accuracy:")
    for i, class_name in enumerate(class_names):
        class_mask = y_true == i
        class_acc = np.mean(y_pred[class_mask] == y_true[class_mask])
        print(f"  {class_name}: {class_acc:.4f}")
    
    return {
        'accuracy': accuracy,
        'confusion_matrix': cm,
        'predictions': y_pred,
        'true_labels': y_true,
        'class_names': class_names
    }

def main():
    """Main evaluation function"""
    parser = argparse.ArgumentParser(description='Evaluate Waste Classification Model')
    parser.add_argument('--model', type=str, required=True,
                       help='Path to trained model')
    parser.add_argument('--data-dir', type=str, default='data/raw',
                       help='Path to dataset directory')
    parser.add_argument('--config', type=str, default='configs/training_config.yaml',
                       help='Path to configuration file')
    args = parser.parse_args()
    
    print("="*60)
    print("📊 Model Evaluation")
    print("="*60)
    
    # Load configuration
    with open(args.config, 'r') as f:
        config = yaml.safe_load(f)
    
    # Create test generator
    _, _, test_gen = create_data_generators(
        data_dir=args.data_dir,
        config=config
    )
    
    # Evaluate
    results = evaluate_model(args.model, test_gen)
    
    print("\n✅ Evaluation complete!")
    print(f"📁 Results saved to models/")

if __name__ == "__main__":
    main()