"""
Waste Classification Model Package

This package contains the machine learning model
for classifying waste items into categories.
"""

__version__ = '1.0.0'
__author__ = 'Eco-Eco Team'

from .predict import WastePredictor

__all__ = ['WastePredictor']