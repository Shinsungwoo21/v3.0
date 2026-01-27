from PIL import Image
import os
import shutil

# Mapping: Source File -> Target Filename
image_map = {
    "빛의 시어터 [파라오의 이집트] 포스터.png": "exhibition-1.png",
    "빛의 벙커 [칸딘스키] 포스터.png": "exhibition-2.png",
    "사랑의 단상 포스터.png": "exhibition-3.png",
    "빈센트 발 [SHADOWGRAM] 포스터.png": "exhibition-4.png"
}

source_dir = "c:/bedrock_space"
target_dir = "c:/bedrock_space/apps/web/public/posters"

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

for src_name, target_name in image_map.items():
    src_path = os.path.join(source_dir, src_name)
    target_path = os.path.join(target_dir, target_name)
    
    if os.path.exists(src_path):
        print(f"Processing {src_name} -> {target_name}...")
        try:
            with Image.open(src_path) as img:
                # Resize if width > 800 (sufficient for cards)
                if img.width > 800:
                    ratio = 800 / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((800, new_height), Image.Resampling.LANCZOS)
                    print(f"  Resized to 800x{new_height}")
                
                # Convert to RGB if needed (JPEG doesn't support RGBA)
                # But we are saving as PNG, so meaningful mainly for size.
                # Let's save as PNG with optimization
                
                # Check current size
                original_size = os.path.getsize(src_path)
                
                # Quantize to reduce size significantly (similar to previous success)
                img = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
                img.save(target_path, optimize=True)
                
                new_size = os.path.getsize(target_path)
                reduction = (original_size - new_size) / original_size * 100
                print(f"  Done. Size: {original_size/1024:.2f}KB -> {new_size/1024:.2f}KB ({reduction:.2f}% reduced)")
                
        except Exception as e:
            print(f"  Error processing {src_name}: {e}")
    else:
        print(f"File not found: {src_path}")
