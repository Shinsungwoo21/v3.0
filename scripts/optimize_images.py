from PIL import Image
import os

target_files = [
    "apps/web/public/posters/indie-band-3.png",
    "apps/web/public/posters/indie-band-4.png"
]

for file_path in target_files:
    if os.path.exists(file_path):
        print(f"Processing {file_path}...")
        original_size = os.path.getsize(file_path)
        
        try:
            with Image.open(file_path) as img:
                # Convert RGBA to RGB if necessary (though PNG supports RGBA)
                # Ensure it's not too huge. Resize if width > 1200
                if img.width > 1200:
                    ratio = 1200 / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((1200, new_height), Image.Resampling.LANCZOS)
                    print(f"  Resized to 1200x{new_height}")
                
                # Save with optimization
                img.save(file_path, optimize=True, quality=85)
                
            new_size = os.path.getsize(file_path)
            reduction = (original_size - new_size) / original_size * 100
            print(f"  Done. Size: {original_size/1024:.2f}KB -> {new_size/1024:.2f}KB ({reduction:.2f}% reduced)")
        except Exception as e:
            print(f"  Error processing {file_path}: {e}")
    else:
        print(f"File not found: {file_path}")
