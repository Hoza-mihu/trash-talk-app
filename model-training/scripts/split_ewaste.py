"""
Script to split e-waste images into train/val/test directories
"""
import os
import shutil
import numpy as np
from pathlib import Path

def split_ewaste_images(source_dir, output_dir, train_ratio=0.7, val_ratio=0.2, test_ratio=0.1, seed=42):
    """
    Split e-waste images into train/val/test sets
    
    Args:
        source_dir: Directory containing e-waste images
        output_dir: Root directory where train/val/test folders exist
        train_ratio: Ratio for training set
        val_ratio: Ratio for validation set
        test_ratio: Ratio for test set
        seed: Random seed
    """
    np.random.seed(seed)
    
    # Get all image files
    images = [f for f in os.listdir(source_dir) 
             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    print(f"📂 Found {len(images)} e-waste images")
    
    if len(images) == 0:
        print("❌ No images found in e-waste directory!")
        return
    
    # Shuffle images
    np.random.shuffle(images)
    
    # Calculate splits
    n_train = int(len(images) * train_ratio)
    n_val = int(len(images) * val_ratio)
    
    train_images = images[:n_train]
    val_images = images[n_train:n_train + n_val]
    test_images = images[n_train + n_val:]
    
    # Create class directories and copy images
    for split, split_images in [('train', train_images), 
                                ('val', val_images), 
                                ('test', test_images)]:
        split_class_dir = os.path.join(output_dir, split, 'e-waste')
        os.makedirs(split_class_dir, exist_ok=True)
        
        for img in split_images:
            src = os.path.join(source_dir, img)
            dst = os.path.join(split_class_dir, img)
            shutil.copy2(src, dst)
        
        print(f"  {split.capitalize()}: {len(split_images)} images")
    
    print("✅ E-waste images split complete!")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Split e-waste images into train/val/test')
    parser.add_argument('--source', type=str, default='data/raw/e-waste',
                       help='Source directory with e-waste images')
    parser.add_argument('--output', type=str, default='data/raw',
                       help='Output root directory')
    parser.add_argument('--train-ratio', type=float, default=0.7,
                       help='Training set ratio')
    parser.add_argument('--val-ratio', type=float, default=0.2,
                       help='Validation set ratio')
    parser.add_argument('--test-ratio', type=float, default=0.1,
                       help='Test set ratio')
    args = parser.parse_args()
    
    print("="*60)
    print("📦 Splitting E-waste Images")
    print("="*60)
    
    split_ewaste_images(
        args.source,
        args.output,
        args.train_ratio,
        args.val_ratio,
        args.test_ratio
    )
