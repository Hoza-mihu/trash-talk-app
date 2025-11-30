"""
Download Dataset from Kaggle

This script downloads waste classification dataset from Kaggle
"""

import os
import sys
import argparse
from pathlib import Path
import zipfile
import shutil

def download_from_kaggle(dataset_name, download_path):
    """
    Download dataset from Kaggle
    
    Args:
        dataset_name: Kaggle dataset identifier (e.g., 'username/dataset-name')
        download_path: Path to download dataset
    """
    try:
        import kaggle
        
        print(f"📥 Downloading dataset: {dataset_name}")
        print(f"📁 Download path: {download_path}")
        
        # Create download directory
        os.makedirs(download_path, exist_ok=True)
        
        # Download dataset
        kaggle.api.dataset_download_files(
            dataset_name,
            path=download_path,
            unzip=True
        )
        
        print("✅ Dataset downloaded successfully!")
        
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        print("\n💡 Make sure you have:")
        print("1. Kaggle API installed: pip install kaggle")
        print("2. Kaggle API token in ~/.kaggle/kaggle.json")
        print("3. Accepted dataset terms on Kaggle website")
        sys.exit(1)

def setup_kaggle_credentials():
    """Setup Kaggle API credentials"""
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_json = kaggle_dir / 'kaggle.json'
    
    if not kaggle_json.exists():
        print("⚠️ Kaggle credentials not found!")
        print("\n📝 To setup Kaggle API:")
        print("1. Go to https://www.kaggle.com/account")
        print("2. Scroll to 'API' section")
        print("3. Click 'Create New API Token'")
        print("4. Save kaggle.json to ~/.kaggle/")
        print(f"   Path: {kaggle_json}")
        
        # Create directory
        kaggle_dir.mkdir(parents=True, exist_ok=True)
        
        return False
    
    # Set proper permissions (Unix-like systems)
    if os.name != 'nt':  # Not Windows
        os.chmod(kaggle_json, 0o600)
    
    print("✅ Kaggle credentials found")
    return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Download Kaggle Dataset')
    parser.add_argument('--dataset', type=str, 
                       default='techsash/waste-classification-data',
                       help='Kaggle dataset name (username/dataset-name)')
    parser.add_argument('--output', type=str, default='data/raw',
                       help='Output directory')
    args = parser.parse_args()
    
    print("="*60)
    print("📦 Kaggle Dataset Downloader")
    print("="*60)
    
    # Check Kaggle credentials
    if not setup_kaggle_credentials():
        sys.exit(1)
    
    # Download dataset
    download_from_kaggle(args.dataset, args.output)
    
    # Display directory structure
    print("\n📁 Downloaded files:")
    for root, dirs, files in os.walk(args.output):
        level = root.replace(args.output, '').count(os.sep)
        indent = ' ' * 2 * level
        print(f'{indent}{os.path.basename(root)}/')
        sub_indent = ' ' * 2 * (level + 1)
        for file in files[:5]:  # Show first 5 files
            print(f'{sub_indent}{file}')
        if len(files) > 5:
            print(f'{sub_indent}... and {len(files) - 5} more files')

if __name__ == "__main__":
    main()