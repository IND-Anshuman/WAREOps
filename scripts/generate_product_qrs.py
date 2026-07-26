import os
import random
import string
import qrcode
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm

# Output directories
BASE_OUTPUT_DIR = r"c:\Users\HP\Desktop\WAREOps\output\qrcodes"
PNG_DIR = os.path.join(BASE_OUTPUT_DIR, "individual_pngs")
PDF_DIR = os.path.join(BASE_OUTPUT_DIR, "individual_pdfs")

os.makedirs(PNG_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)

# 1. Generate unique 5-digit alphanumeric codes (excluding confusing characters: O, 0, I, 1, L)
def generate_unique_codes(count):
    allowed_chars = [c for c in string.ascii_uppercase + string.digits if c not in ['O', '0', 'I', '1', 'L']]
    random.seed(12345)  # Seed for deterministic generation
    codes = set()
    while len(codes) < count:
        code = "".join(random.choices(allowed_chars, k=5))
        codes.add(code)
    return sorted(list(codes))

total_locations = 2 * 2 * 4 * 3  # 48 locations
unique_codes = generate_unique_codes(total_locations)

# 2. Build the warehouse locations
locations = []
code_idx = 0

for aisle_num in [1, 2]:
    for side in ['Left', 'Right']:
        for row_num in range(1, 5):  # 4 rows: 1 to 4
            for shelf_num in range(1, 4):  # 3 shelves: 1 to 3
                id_code = unique_codes[code_idx]
                code_idx += 1
                
                locations.append({
                    "id_code": id_code,
                    "aisle": f"Aisle {aisle_num}",
                    "side": f"{side} Rack",
                    "row": f"Row {row_num}",
                    "shelf": f"Shelf {shelf_num}",
                    "location_text": f"Aisle {aisle_num} • {side} Rack • Row {row_num} • Shelf {shelf_num}",
                })

print(f"Generated layout metadata for {len(locations)} locations.")

# 3. Generate high-res PNGs (945x945 pixels @ 300 DPI = 8x8 cm)
TARGET_PIXELS = 945
QR_SIZE = 640

# Try to load Arial font
try:
    font_id = ImageFont.truetype("arial.ttf", 80)
    font_loc = ImageFont.truetype("arial.ttf", 32)
except IOError:
    # Fallback to default
    font_id = ImageFont.load_default()
    font_loc = ImageFont.load_default()

png_paths = {}

for loc in locations:
    id_code = loc["id_code"]
    
    # Create canvas
    img = Image.new("RGB", (TARGET_PIXELS, TARGET_PIXELS), "white")
    draw = ImageDraw.Draw(img)
    
    # Generate QR Code (only encoding the 5-digit alphanumeric ID)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=15,
        border=4,
    )
    qr.add_data(id_code)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    
    # Resize QR code
    qr_img_resized = qr_img.resize((QR_SIZE, QR_SIZE), Image.Resampling.LANCZOS)
    
    # Paste QR Code (centered, offset slightly to top)
    qr_x = (TARGET_PIXELS - QR_SIZE) // 2
    qr_y = 50
    img.paste(qr_img_resized, (qr_x, qr_y))
    
    # Draw border (light gray, 2 pixels wide)
    draw.rectangle([0, 0, TARGET_PIXELS - 1, TARGET_PIXELS - 1], outline="#CCCCCC", width=2)
    
    # Draw 5-digit code text (centered)
    id_w = draw.textlength(id_code, font=font_id) if hasattr(draw, "textlength") else 150
    id_x = (TARGET_PIXELS - id_w) // 2
    id_y = qr_y + QR_SIZE + 20
    draw.text((id_x, id_y), id_code, fill="black", font=font_id)
    
    # Draw location text (centered)
    loc_text = loc["location_text"]
    loc_w = draw.textlength(loc_text, font=font_loc) if hasattr(draw, "textlength") else 350
    loc_x = (TARGET_PIXELS - loc_w) // 2
    loc_y = id_y + 90
    draw.text((loc_x, loc_y), loc_text, fill="#666666", font=font_loc)
    
    # Save PNG
    png_path = os.path.join(PNG_DIR, f"{id_code}.png")
    img.save(png_path, "PNG", dpi=(300, 300))
    png_paths[id_code] = png_path

print(f"Generated {len(locations)} PNGs in: {PNG_DIR}")

# 4. Generate individual 8x8 cm PDFs
label_size = 8 * cm
for loc in locations:
    id_code = loc["id_code"]
    pdf_path = os.path.join(PDF_DIR, f"{id_code}.pdf")
    c = canvas.Canvas(pdf_path, pagesize=(label_size, label_size))
    c.drawImage(png_paths[id_code], 0, 0, width=label_size, height=label_size)
    c.showPage()
    c.save()

print(f"Generated {len(locations)} individual PDFs in: {PDF_DIR}")

# 5. Generate print-ready A4 Grid PDF (6 QRs per page, 2x3 grid)
grid_pdf_path = os.path.join(BASE_OUTPUT_DIR, "qrcodes_grid_a4.pdf")
c = canvas.Canvas(grid_pdf_path, pagesize=A4)
width_a4, height_a4 = A4

left_margin = 2.5 * cm
bottom_margin = 2.85 * cm
items_per_page = 6

for idx, loc in enumerate(locations):
    id_code = loc["id_code"]
    page_item_idx = idx % items_per_page
    
    # Grid position
    col = page_item_idx % 2
    row = page_item_idx // 2  # 0, 1, or 2 (bottom to top)
    
    # Calculate coords
    x = left_margin + col * label_size
    y = bottom_margin + row * label_size
    
    # Draw label image
    c.drawImage(png_paths[id_code], x, y, width=label_size, height=label_size)
    
    # Draw dashed cutting marks
    c.saveState()
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.setLineWidth(0.5)
    c.setDash(2, 2)
    c.rect(x, y, label_size, label_size)
    c.restoreState()
    
    # Page control
    if page_item_idx == items_per_page - 1 or idx == len(locations) - 1:
        c.showPage()

c.save()
print(f"Generated print-ready 2x3 A4 grid PDF at: {grid_pdf_path}")
print("All tasks completed successfully!")
