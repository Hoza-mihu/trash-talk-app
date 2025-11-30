"""
Data loading utilities for training.

This module creates Keras `ImageDataGenerator` objects for train/val/test
splits assuming the following directory structure:

    data_root/
        train/
            class_1/
            class_2/
            ...
        val/
            class_1/
            class_2/
            ...
        test/
            class_1/
            class_2/
            ...

`data_root` is whatever you pass as `--data-dir` to `train_model.py`.
"""

import os
from typing import Tuple

from tensorflow.keras.preprocessing.image import ImageDataGenerator


def _build_train_datagen(config) -> ImageDataGenerator:
    """Create an ImageDataGenerator for training with optional augmentation."""
    aug_cfg = config.get("augmentation", {}) or {}

    if not aug_cfg.get("enabled", False):
        return ImageDataGenerator(rescale=1.0 / 255.0)

    return ImageDataGenerator(
        rescale=1.0 / 255.0,
        rotation_range=aug_cfg.get("rotation_range", 0),
        width_shift_range=aug_cfg.get("width_shift_range", 0.0),
        height_shift_range=aug_cfg.get("height_shift_range", 0.0),
        shear_range=aug_cfg.get("shear_range", 0.0),
        zoom_range=aug_cfg.get("zoom_range", 0.0),
        horizontal_flip=aug_cfg.get("horizontal_flip", False),
        vertical_flip=aug_cfg.get("vertical_flip", False),
        brightness_range=aug_cfg.get("brightness_range"),
        fill_mode=aug_cfg.get("fill_mode", "nearest"),
    )


def _build_eval_datagen() -> ImageDataGenerator:
    """ImageDataGenerator for validation / test (no augmentation)."""
    return ImageDataGenerator(rescale=1.0 / 255.0)


def create_data_generators(
    data_dir: str, config
) -> Tuple[object, object, object]:
    """
    Create train/val/test generators from directory.

    Args:
        data_dir: Root directory containing `train`, `val`, `test` folders.
        config: Parsed YAML config dictionary.

    Returns:
        (train_generator, val_generator, test_generator)
    """
    dataset_cfg = config["dataset"]

    img_size = dataset_cfg.get("image_size", 224)
    batch_size = dataset_cfg.get("batch_size", 32)
    shuffle = dataset_cfg.get("shuffle", True)
    seed = dataset_cfg.get("seed", 42)

    train_dir = os.path.join(data_dir, "train")
    val_dir = os.path.join(data_dir, "val")
    test_dir = os.path.join(data_dir, "test")

    if not os.path.isdir(train_dir):
        raise FileNotFoundError(
            f"Train directory not found at '{train_dir}'. "
            "Expected structure: <data_dir>/train/<class_name>/image.jpg"
        )
    if not os.path.isdir(val_dir):
        raise FileNotFoundError(
            f"Validation directory not found at '{val_dir}'. "
            "Expected structure: <data_dir>/val/<class_name>/image.jpg"
        )
    if not os.path.isdir(test_dir):
        raise FileNotFoundError(
            f"Test directory not found at '{test_dir}'. "
            "Expected structure: <data_dir>/test/<class_name>/image.jpg"
        )

    train_datagen = _build_train_datagen(config)
    eval_datagen = _build_eval_datagen()

    target_size = (img_size, img_size)

    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=shuffle,
        seed=seed,
    )

    val_gen = eval_datagen.flow_from_directory(
        val_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
    )

    test_gen = eval_datagen.flow_from_directory(
        test_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
    )

    return train_gen, val_gen, test_gen


