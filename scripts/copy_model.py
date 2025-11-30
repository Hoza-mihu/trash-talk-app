#!/usr/bin/env python3
"""
Script to copy trained model from model-training to backend
"""
import os
import shutil
from pathlib import Path

def copy_model():
    """Copy the latest trained model to backend"""
    project_root = Path(__file__).parent.parent
    
    # Source: model-training/models/final
    source_dir = project_root / "model-training" / "models" / "final"
    
    # Destination: backend/model/model.h5
    dest_dir = project_root / "backend" / "model"
    dest_file = dest_dir / "model.h5"
    
    # Find the latest model file
    if not source_dir.exists():
        print(f"❌ Source directory not found: {source_dir}")
        print("   Please train a model first in model-training/")
        return False
    
    # Find all .h5 files
    model_files = list(source_dir.glob("*.h5"))
    
    if not model_files:
        print(f"❌ No model files found in {source_dir}")
        print("   Please train a model first")
        return False
    
    # Get the latest model file (by modification time)
    latest_model = max(model_files, key=lambda p: p.stat().st_mtime)
    
    print(f"📦 Found model: {latest_model.name}")
    print(f"   Size: {latest_model.stat().st_size / (1024*1024):.2f} MB")
    
    # Ensure destination directory exists
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy the model
    try:
        shutil.copy2(latest_model, dest_file)
        print(f"✅ Model copied successfully!")
        print(f"   From: {latest_model}")
        print(f"   To:   {dest_file}")
        return True
    except Exception as e:
        print(f"❌ Error copying model: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Copying Model from model-training to backend")
    print("=" * 60)
    print()
    
    success = copy_model()
    
    print()
    if success:
        print("=" * 60)
        print("✅ Model copy completed!")
        print("   You can now start the backend server")
        print("=" * 60)
    else:
        print("=" * 60)
        print("❌ Model copy failed")
        print("=" * 60)
        exit(1)

