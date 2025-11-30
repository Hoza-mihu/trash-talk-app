"""
Data Preprocessing Script

Clean, validate, and preprocess images before training
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from PIL import Image
from tqdm import tqdm
import numpy as np

def validate_image(image_path):
    """
    Validate if image can be opened and is not corrupted
    
    Args:
        image_path: Path to image file
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        img = Image.open(image_path)
        img.verify()
        img = Image.open(image_path)  # Re-open after verify
        img.load()
        return True
    except Exception as e:
        return False

def clean_dataset(data_dir, output_dir, min_size=32, max_size=4096):
    """
    Clean dataset by removing corrupted/invalid images
    
    Args:
        data_dir: Source directory
        output_dir: Output directory
        min_size: Minimum image dimension
        max_size: Maximum image dimension
    """
    print(f"🧹 Cleaning dataset from {data_dir}")
    
    os.makedirs(output_dir, exist_ok=True)
    
    stats = {
        'total': 0,
        'valid': 0,
        'corrupted': 0,
        'too_small': 0,
        'too_large': 0,
        'wrong_format': 0
    }
    
    # Process each class
    for class_name in os.listdir(data_dir):
        class_path = os.path.join(data_dir, class_name)
        
        if not os.path.isdir(class_path):
            continue
        
        print(f"\n📂 Processing class: {class_name}")
        
        output_class_path = os.path.join(output_dir, class_name)
        os.makedirs(output_class_path, exist_ok=True)
        
        images = [f for f in os.listdir(class_path) 
                 if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        
        for img_name in tqdm(images, desc=f"  {class_name}"):
            stats['total'] += 1
            img_path = os.path.join(class_path, img_name)
            
            # Validate image
            if not validate_image(img_path):
                stats['corrupted'] += 1
                continue
            
            try:
                img = Image.open(img_path)
                
                # Check dimensions
                if min(img.size) < min_size:
                    stats['too_small'] += 1
                    continue
                
                if max(img.size) > max_size:
                    stats['too_large'] += 1
                    continue
                
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Save to output directory
                output_path = os.path.join(output_class_path, img_name)
                img.save(output_path, 'JPEG', quality=95)
                
                stats['valid'] += 1
                
            except Exception as e:
                stats['wrong_format'] += 1
                continue
    
    # Print statistics
    print("\n" + "="*50)
    print("📊 Cleaning Results")
    print("="*50)
    print(f"Total images processed: {stats['total']}")
    print(f"✅ Valid images: {stats['valid']}")
    print(f"❌ Corrupted: {stats['corrupted']}")
    print(f"❌ Too small: {stats['too_small']}")
    print(f"❌ Too large: {stats['too_large']}")
    print(f"❌ Wrong format: {stats['wrong_format']}")
    print(f"\n📈 Success rate: {(stats['valid']/stats['total']*100):.2f}%")

def split_dataset(data_dir, output_dir, train_ratio=0.7, val_ratio=0.2, test_ratio=0.1, seed=42):
    """
    Split dataset into train/val/test sets
    
    Args:
        data_dir: Source directory
        output_dir: Output directory
        train_ratio: Training set ratio
        val_ratio: Validation set ratio
        test_ratio: Test set ratio
        seed: Random seed
    """
    print(f"\n✂️ Splitting dataset into train/val/test")
    
    np.random.seed(seed)
    
    # Create output directories
    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(output_dir, split), exist_ok=True)
    
    # Process each class
    for class_name in os.listdir(data_dir):
        class_path = os.path.join(data_dir, class_name)
        
        if not os.path.isdir(class_path):
            continue
        
        print(f"📂 Splitting class: {class_name}")
        
        # Get all images
        images = [f for f in os.listdir(class_path) 
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        # Shuffle
        np.random.shuffle(images)
        
        # Calculate splits
        n_train = int(len(images) * train_ratio)
        n_val = int(len(images) * val_ratio)
        
        train_images = images[:n_train]
        val_images = images[n_train:n_train + n_val]
        test_images = images[n_train + n_val:]
        
        # Copy images to respective directories
        for split, split_images in [('train', train_images), 
                                    ('val', val_images), 
                                    ('test', test_images)]:
            split_class_dir = os.path.join(output_dir, split, class_name)
            os.makedirs(split_class_dir, exist_ok=True)
            
            for img in split_images:
                src = os.path.join(class_path, img)
                dst = os.path.join(split_class_dir, img)
                shutil.copy2(src, dst)
        
        print(f"  Train: {len(train_images)}, Val: {len(val_images)}, Test: {len(test_images)}")
    
    print("\n✅ Dataset split complete!")

def resize_images(data_dir, output_dir, size=224):
    """
    Resize all images to target size
    
    Args:
        data_dir: Source directory
        output_dir: Output directory
        size: Target size (square)
    """
    print(f"\n🔄 Resizing images to {size}x{size}")
    
    os.makedirs(output_dir, exist_ok=True)
    
    for class_name in os.listdir(data_dir):
        class_path = os.path.join(data_dir, class_name)
        
        if not os.path.isdir(class_path):
            continue
        
        output_class_path = os.path.join(output_dir, class_name)
        os.makedirs(output_class_path, exist_ok=True)
        
        images = [f for f in os.listdir(class_path) 
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        for img_name in tqdm(images, desc=f"  {class_name}"):
            try:
                img = Image.open(os.path.join(class_path, img_name))
                img = img.convert('RGB')
                img = img.resize((size, size), Image.LANCZOS)
                
                output_path = os.path.join(output_class_path, img_name)
                img.save(output_path, 'JPEG', quality=95)
                
            except Exception as e:
                print(f"Error processing {img_name}: {e}")
    
    print("\n✅ Resizing complete!")

def main():
    """Main preprocessing function"""
    parser = argparse.ArgumentParser(description='Preprocess Dataset')
    parser.add_argument('--input', type=str, required=True, help='Input directory')
    parser.add_argument('--output', type=str, required=True, help='Output directory')
    parser.add_argument('--clean', action='store_true', help='Clean corrupted images')
    parser.add_argument('--split', action='store_true', help='Split into train/val/test')
    parser.add_argument('--resize', type=int, help='Resize images to specified size')
    parser.add_argument('--train-ratio', type=float, default=0.7, help='Train ratio')
    parser.add_argument('--val-ratio', type=float, default=0.2, help='Validation ratio')
    parser.add_argument('--test-ratio', type=float, default=0.1, help='Test ratio')
    args = parser.parse_args()
    
    print("="*60)
    print("🔧 Dataset Preprocessing")
    print("="*60)
    
    if args.clean:
        clean_dataset(args.input, args.output)
    
    if args.split:
        split_dataset(args.input, args.output, 
                     args.train_ratio, args.val_ratio, args.test_ratio)
    
    if args.resize:
        resize_images(args.input, args.output, args.resize)
    
    print("\n✅ Preprocessing complete!")

if __name__ == "__main__":
    main()