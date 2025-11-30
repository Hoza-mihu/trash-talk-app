"""
Model Comparison Script

Compare performance of different model architectures
"""

import os
import sys
import yaml
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from scripts.train_model import WasteClassifier
from utils.data_loader import create_data_generators

def compare_architectures(data_dir, config_path, architectures=['cnn', 'mobilenet', 'efficientnet']):
    """
    Compare different model architectures
    
    Args:
        data_dir: Path to dataset
        config_path: Path to configuration file
        architectures: List of architectures to compare
    """
    results = []
    
    # Load data once
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    train_gen, val_gen, test_gen = create_data_generators(data_dir, config)
    
    # Train each architecture
    for arch in architectures:
        print(f"\n{'='*60}")
        print(f"Training {arch.upper()} Architecture")
        print(f"{'='*60}")
        
        # Update config
        config['model']['type'] = arch
        config['training']['epochs'] = 10  # Shorter training for comparison
        
        # Train model
        trainer = WasteClassifier(config_path=config_path)
        trainer.config = config
        trainer.build_model()
        
        history = trainer.train(train_gen, val_gen)
        test_results = trainer.evaluate(test_gen)
        
        # Store results
        results.append({
            'Architecture': arch,
            'Train Accuracy': history.history['accuracy'][-1],
            'Val Accuracy': history.history['val_accuracy'][-1],
            'Test Accuracy': test_results[1],
            'Train Loss': history.history['loss'][-1],
            'Val Loss': history.history['val_loss'][-1],
            'Test Loss': test_results[0]
        })
        
        # Save model
        model_path = f'models/final/{arch}_model.h5'
        trainer.save_model(model_path)
    
    # Create comparison DataFrame
    df_results = pd.DataFrame(results)
    
    # Save results
    df_results.to_csv('models/architecture_comparison.csv', index=False)
    
    # Plot comparison
    plot_architecture_comparison(df_results)
    
    return df_results

def plot_architecture_comparison(df):
    """Plot architecture comparison results"""
    fig, axes = plt.subplots(1, 2, figsize=(15, 5))
    
    # Accuracy comparison
    df[['Architecture', 'Train Accuracy', 'Val Accuracy', 'Test Accuracy']].plot(
        x='Architecture',
        kind='bar',
        ax=axes[0],
        color=['#3b82f6', '#10b981', '#f59e0b']
    )
    axes[0].set_title('Accuracy Comparison', fontsize=14, fontweight='bold')
    axes[0].set_ylabel('Accuracy')
    axes[0].set_ylim([0, 1])
    axes[0].legend(['Train', 'Validation', 'Test'])
    axes[0].grid(axis='y', alpha=0.3)
    
    # Loss comparison
    df[['Architecture', 'Train Loss', 'Val Loss', 'Test Loss']].plot(
        x='Architecture',
        kind='bar',
        ax=axes[1],
        color=['#ef4444', '#8b5cf6', '#ec4899']
    )
    axes[1].set_title('Loss Comparison', fontsize=14, fontweight='bold')
    axes[1].set_ylabel('Loss')
    axes[1].legend(['Train', 'Validation', 'Test'])
    axes[1].grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('models/architecture_comparison.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("\n📊 Comparison plot saved to: models/architecture_comparison.png")

if __name__ == "__main__":
    compare_architectures(
        data_dir='../data/raw',
        config_path='../configs/training_config.yaml',
        architectures=['cnn', 'mobilenet']
    )