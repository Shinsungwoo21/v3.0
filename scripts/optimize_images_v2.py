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
                # Resize if > 1000px width (aggressive resizing)
                if img.width > 1000:
                    ratio = 1000 / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((1000, new_height), Image.Resampling.LANCZOS)
                    print(f"  Resized to 1000x{new_height}")
                
                # Convert to RGB (remove alpha) to save as JPEG
                rgb_img = img.convert('RGB')
                
                # Save as same filename (overwrite png with jpeg content? No, strictly keep extension or just overwrite bytes)
                # Note: Next.js Image component might rely on extension, but browsers handle content-type. 
                # However, to avoid confusion, let's keep it simple: 
                # Just overwrite it as optimized PNG with reduced colors if needed, OR save as JPG and update code.
                # Updating code is risky. Let's try aggressive PNG optimization first by reducing colors (quantize).
                
                # Option B: Quantize (Reduce to 256 colors like GIF, significant size drop for PNG)
                img_quantized = img.quantize(colors=256, method=2)
                img_quantized.save(file_path, optimize=True)

            new_size = os.path.getsize(file_path)
            reduction = (original_size - new_size) / original_size * 100
            print(f"  Done. Size: {original_size/1024:.2f}KB -> {new_size/1024:.2f}KB ({reduction:.2f}% reduced)")
        except Exception as e:
            print(f"  Error processing {file_path}: {e}")
    else:
        print(f"File not found: {file_path}")
