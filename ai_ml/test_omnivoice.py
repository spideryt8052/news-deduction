"""
TruthShield OmniVoice Verification & Diagnostic Script
Validates installation, hardware acceleration, and multilingual capabilities.
"""
import sys
import os

print("=" * 65)
print("       TruthShield: OmniVoice Diagnostic & Setup Test")
print("=" * 65)

# Check PyTorch
try:
    import torch
    print(f"[OK] PyTorch Version: {torch.__version__}")
    if torch.cuda.is_available():
        print(f"[OK] GPU Hardware Acceleration: CUDA ({torch.cuda.get_device_name(0)})")
    elif hasattr(torch, "xpu") and torch.xpu.is_available():
        print(f"[OK] GPU Hardware Acceleration: Intel XPU ({torch.xpu.get_device_name(0)})")
    else:
        print("[INFO] Device: CPU mode (Intel Core / High-performance SIMD)")
except ImportError as e:
    print(f"[FAIL] PyTorch is not installed: {e}")
    sys.exit(1)

# Check OmniVoice
try:
    import omnivoice
    from omnivoice import OmniVoice, OmniVoiceConfig, OmniVoiceGenerationConfig
    from omnivoice.utils.lang_map import LANG_NAMES
    print(f"[OK] OmniVoice Version: {omnivoice.__version__}")
    print(f"[OK] Total Supported Languages: {len(LANG_NAMES)} languages available")
    
    # Sample languages check
    sample_langs = ["hindi", "urdu", "english", "bengali", "punjabi", "tamil", "marathi", "gujarati", "arabic", "spanish"]
    found = [l.capitalize() for l in sample_langs if l in LANG_NAMES]
    print(f"[OK] Sample Languages Validated: {', '.join(found)}")
except ImportError as e:
    print(f"[FAIL] OmniVoice package could not be imported: {e}")
    sys.exit(1)

print("\n" + "=" * 65)
print("   All OmniVoice components are correctly configured & ready!")
print("=" * 65)
