import os
from PIL import Image, ImageDraw, ImageFilter

def tune_assets():
    src_path = r"C:\Users\SAMI ALGHAMDI\.gemini\antigravity\brain\856e494f-3c3a-41bd-97d4-d16ee849d8d7\.user_uploaded\media_1794069696516_54a11aa1.jpg"
    orig = Image.open(src_path).convert("RGBA")
    w, h = orig.size

    # --- 1. Clean up outer white background by creating a high-res anti-aliased squircle mask ---
    # The squircle is from x=16 to 1008, y=24 to 1000, corner radius ~ 220
    scale = 2
    mask_hr = Image.new("L", (w * scale, h * scale), 0)
    draw_hr = ImageDraw.Draw(mask_hr)
    
    # Coordinates scaled up
    x0, y0 = 16 * scale, 24 * scale
    x1, y1 = 1008 * scale, 1000 * scale
    radius = 215 * scale
    
    draw_hr.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=255)
    mask = mask_hr.resize((w, h), Image.Resampling.LANCZOS)
    
    # Full artwork with transparent corners
    full_transparent = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    full_transparent.paste(orig, (0, 0), mask=mask)
    
    # Save transparent full logo to public/logo.png
    os.makedirs(r"public", exist_ok=True)
    full_transparent.resize((512, 512), Image.Resampling.LANCZOS).save(r"public\logo.png", format="PNG")
    print("Saved public/logo.png (512x512 transparent squircle)")

    # --- 2. Create Full Logo with solid cosmic background extended to edges (for standard Android launcher) ---
    # Cosmic dark background: #060822
    cosmic_bg = Image.new("RGBA", (w, h), (6, 8, 34, 255))
    full_cosmic = Image.alpha_composite(cosmic_bg, full_transparent)
    
    # --- 3. Create 'logo-icon.png' (The glowing 3D 'N' with orbit centered, for UI badges and header) ---
    # The N and orbit are located at x=(170, 876), y=(240, 630). Center is roughly (512, 435)
    # Let's crop a square region centered on the N and orbit: from x=80 to 944, y=40 to 904
    # Or create a dedicated square badge
    icon_box = (100, 160, 924, 700) # (left, top, right, bottom)
    n_cropped = orig.crop(icon_box) # width 824, height 540
    
    # Center n_cropped onto a square 824x824 with cosmic background #060822
    sq_size = 824
    icon_square = Image.new("RGBA", (sq_size, sq_size), (6, 8, 34, 255))
    paste_y = (sq_size - n_cropped.height) // 2
    icon_square.paste(n_cropped, (0, paste_y))
    
    # Apply rounded squircle mask to the icon badge
    mask_icon_hr = Image.new("L", (sq_size * scale, sq_size * scale), 0)
    draw_icon = ImageDraw.Draw(mask_icon_hr)
    draw_icon.rounded_rectangle([0, 0, sq_size * scale, sq_size * scale], radius=180 * scale, fill=255)
    mask_icon = mask_icon_hr.resize((sq_size, sq_size), Image.Resampling.LANCZOS)
    
    icon_badge = Image.new("RGBA", (sq_size, sq_size), (0, 0, 0, 0))
    icon_badge.paste(icon_square, (0, 0), mask=mask_icon)
    icon_badge.resize((256, 256), Image.Resampling.LANCZOS).save(r"public\logo-icon.png", format="PNG")
    print("Saved public/logo-icon.png (256x256 iconic N badge)")

    # --- 4. Android Mipmap Generation ---
    # Android adaptive icons need:
    # A) ic_launcher_foreground.png: Artwork centered in 66% safe zone with transparent background
    # B) ic_launcher.png / ic_launcher_round.png: Artwork with cosmic background to edges, zero white
    
    # Foreground: Place full artwork scaled to ~70% of 1024x1024 centered on transparent canvas
    fg_canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    fg_scale = 0.68
    fg_w, fg_h = int(w * fg_scale), int(h * fg_scale)
    fg_scaled = full_transparent.resize((fg_w, fg_h), Image.Resampling.LANCZOS)
    fg_x = (1024 - fg_w) // 2
    fg_y = (1024 - fg_h) // 2
    fg_canvas.paste(fg_scaled, (fg_x, fg_y), mask=fg_scaled)

    # Densities for Android
    densities = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }

    base_res = r"android\app\src\main\res"
    for folder, (l_size, fg_size) in densities.items():
        dir_path = os.path.join(base_res, folder)
        os.makedirs(dir_path, exist_ok=True)
        
        # 1. ic_launcher.png (Cosmic background to edges, no white corners)
        launcher_img = full_cosmic.resize((l_size, l_size), Image.Resampling.LANCZOS)
        launcher_img.save(os.path.join(dir_path, "ic_launcher.png"), format="PNG")
        
        # 2. ic_launcher_round.png
        # Circular mask applied to launcher
        round_mask = Image.new("L", (l_size * 2, l_size * 2), 0)
        draw_round = ImageDraw.Draw(round_mask)
        draw_round.ellipse([0, 0, l_size * 2, l_size * 2], fill=255)
        round_mask = round_mask.resize((l_size, l_size), Image.Resampling.LANCZOS)
        
        round_img = Image.new("RGBA", (l_size, l_size), (0, 0, 0, 0))
        round_img.paste(launcher_img, (0, 0), mask=round_mask)
        round_img.save(os.path.join(dir_path, "ic_launcher_round.png"), format="PNG")
        
        # 3. ic_launcher_foreground.png (Safe zone scaled, transparent background)
        fg_img = fg_canvas.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
        fg_img.save(os.path.join(dir_path, "ic_launcher_foreground.png"), format="PNG")
        
        print(f"Generated icons for {folder}: {l_size}x{l_size} launcher, {fg_size}x{fg_size} foreground")

    print("All image assets tuned and generated with zero white borders!")

if __name__ == "__main__":
    tune_assets()
