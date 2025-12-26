#!/usr/bin/env python3
"""
Generate og.jpg image (1200x630) with dark green background and logo text
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    has_pil = True
except ImportError:
    has_pil = False
    print("PIL/Pillow not installed. Install with: pip install Pillow")
    exit(1)

# Create image
width, height = 1200, 630
img = Image.new('RGB', (width, height), color='#0f4f30')
draw = ImageDraw.Draw(img)

# Try to use a nice font, fallback to default
try:
    # Try to use system font (works on Windows/Mac/Linux)
    font_size = 72
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()
except:
    font = ImageFont.load_default()

# Draw text "DushanbeMotion" centered
text = "DushanbeMotion"
text_bbox = draw.textbbox((0, 0), text, font=font)
text_width = text_bbox[2] - text_bbox[0]
text_height = text_bbox[3] - text_bbox[1]
text_x = (width - text_width) // 2
text_y = (height - text_height) // 2

draw.text((text_x, text_y), text, fill='#ffffff', font=font)

# Save as JPG
output_path = '../public/og.jpg'
img.save(output_path, 'JPEG', quality=90)
print(f"Created: {output_path}")

