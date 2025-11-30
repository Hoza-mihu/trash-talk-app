"""
Utility package for the waste classification training pipeline.

This makes `utils` a proper Python package so scripts like
`scripts/train_model.py` can import helper functions such as
`create_data_generators` and visualization utilities.
"""

from .data_loader import create_data_generators
from .augumentation import get_augmentation_pipeline  # note: file name is augumentation.py
from .visualization import (
    plot_training_history,
    plot_confusion_matrix,
    plot_sample_predictions,
    plot_class_distribution,
)

__all__ = [
    "create_data_generators",
    "get_augmentation_pipeline",
    "plot_training_history",
    "plot_confusion_matrix",
    "plot_sample_predictions",
    "plot_class_distribution",
]


