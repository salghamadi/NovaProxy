import os
from PIL import Image, ImageDraw, ImageOps, ImageChops, ImageFilter

# Master Icon
master_path = 'public/playstore_icon_512x512.png'
master = Image.open(master_path).convert('RGBA')

# Target mipmap directories and sizes
# Standard launcher: mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192
# Adaptive foreground: mdpi 108, hdpi 162, xhdpi 216, xxhdpi 324, xxxhdpi 432
densities = {
    'mipmap-mdpi': {'launcher': 48, 'fg': 108},
    'mipmap-hdpi': {'launcher': 72, 'fg': 162},
    'mipmap-xhdpi': {'launcher': 96, 'fg': 216},
    'mipmap-xxhdpi': {'launcher': 144, 'fg': 324},
    'mipmap-xxxhdpi': {'launcher': 192, 'fg': 432},
}

res_base = 'android/app/src/main/res'

def create_squircle_mask(size, radius_ratio=0.22):
    scale = 4
    large_size = size * scale
    radius = int(large_size * radius_ratio)
    mask = Image.new('L', (large_size, large_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (large_size - 1, large_size - 1)], radius=radius, fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)

def create_circle_mask(size):
    scale = 4
    large_size = size * scale
    mask = Image.new('L', (large_size, large_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([(0, 0), (large_size - 1, large_size - 1)], fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)

def make_smooth_foreground(target_size):
    # In adaptive icon: canvas is 108dp, safe zone is 72dp (66.7%)
    # Let's scale master so the content fits cleanly in the 66% inner circle
    content_size = int(target_size * 0.68)
    resized_content = master.resize((content_size, content_size), Image.Resampling.LANCZOS)
    
    # Smooth radial/soft-edge mask for the content so its outer dark edges fade to 0 alpha
    # Content has background (0, 4, 8). Let's fade out the outer 10%
    w, h = content_size, content_size
    fade_mask = Image.new('L', (w, h), 255)
    draw = ImageDraw.Draw(fade_mask)
    
    # Create soft rounded edge to melt into background
    soft_radius = int(w * 0.25)
    draw.rounded_rectangle([(2, 2), (w - 3, h - 3)], radius=soft_radius, fill=255)
    
    # Gaussian blur the mask slightly at boundaries
    blurred_mask = fade_mask.filter(ImageFilter.GaussianBlur(radius=w * 0.04))
    
    # Apply fade mask to alpha channel
    r, g, b, a = resized_content.split()
    combined_a = ImageChops.multiply(a, blurred_mask)
    resized_content.putalpha(combined_a)
    
    # Paste onto transparent canvas of target_size
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    offset = (target_size - content_size) // 2
    canvas.paste(resized_content, (offset, offset), resized_content)
    return canvas

# 1. Generate Mipmaps
for folder, sizes in densities.items():
    folder_path = os.path.join(res_base, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # A. Squircle ic_launcher.png
    l_size = sizes['launcher']
    resized_launcher = master.resize((l_size, l_size), Image.Resampling.LANCZOS)
    mask = create_squircle_mask(l_size, 0.22)
    squircle_launcher = Image.new('RGBA', (l_size, l_size), (0, 0, 0, 0))
    squircle_launcher.paste(resized_launcher, (0, 0), mask)
    squircle_launcher.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
    
    # B. Circular ic_launcher_round.png
    circle_mask = create_circle_mask(l_size)
    round_launcher = Image.new('RGBA', (l_size, l_size), (0, 0, 0, 0))
    round_launcher.paste(resized_launcher, (0, 0), circle_mask)
    round_launcher.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
    
    # C. Adaptive foreground ic_launcher_foreground.png
    fg_size = sizes['fg']
    fg_img = make_smooth_foreground(fg_size)
    fg_img.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')

print("All Android mipmaps successfully generated.")

# 2. Update ic_launcher_background.xml to match exact background (#000408)
bg_xml_path = os.path.join(res_base, 'values', 'ic_launcher_background.xml')
with open(bg_xml_path, 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#000408</color>\n</resources>\n')
print("Updated ic_launcher_background.xml to #000408")

# 3. Generate themed app icons for public/
# Themed variants with subtle hue / tint variations:
# default: Cosmic Indigo/Violet
# purple: Vivid Magenta/Purple
# green: Neon Lime/Matrix Emerald
# solar: Radiant Gold/Amber
# dark: Stealth Titanium/Carbon Silver

def create_themed_variant(tint_color, name):
    base = master.copy()
    # Tint the highlights
    # Apply a subtle color overlay with blend mode
    overlay = Image.new('RGBA', base.size, tint_color)
    blended = Image.blend(base, overlay, 0.25)
    # Restore dark background
    w, h = base.size
    final_img = Image.new('RGBA', (w, h), (0, 4, 8, 255))
    final_img.paste(blended, (0, 0))
    final_img.save(f'public/app_icon_{name}.png', 'PNG')
    print(f"Generated public/app_icon_{name}.png")

# Base default
master.save('public/app_icon_default.png', 'PNG')
master.save('public/logo.png', 'PNG')
master.save('public/logo-icon.png', 'PNG')

create_themed_variant((168, 85, 247, 180), 'purple')  # Vivid Magenta/Violet
create_themed_variant((34, 197, 94, 180), 'green')     # Neon Emerald
create_themed_variant((245, 158, 11, 180), 'solar')    # Radiant Gold
create_themed_variant((148, 163, 184, 140), 'dark')    # Stealth Slate/Titanium

print("All app icons and themed variants generated successfully!")
