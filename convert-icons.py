#!/usr/bin/env python3
"""
Convert SVG icons to PNG format for Chrome extension.
This script uses only Python's built-in libraries.
"""

import re
import base64

# Simple SVG to PNG converter using basic shapes
# This is a simplified approach that creates colored squares with text
# For production, use a proper tool like ImageMagick or cairosvg

def create_simple_png(width, height, color, letter):
    """
    Create a simple PNG with a colored background and letter.
    This is a minimal implementation - for production use proper tools.
    """
    # PNG header
    png_signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = (
        width.to_bytes(4, 'big') +
        height.to_bytes(4, 'big') +
        b'\x08\x02\x00\x00\x00'
    )
    ihdr = b'IHDR' + ihdr_data + (len(ihdr_data).to_bytes(4, 'big'))
    ihdr += (ihdr[4:].__xor__(0xffffffff).to_bytes(4, 'big')).__xor__(0xffffffff).to_bytes(4, 'big')
    # Simplified - actually need proper CRC
    ihdr = b'IHDR' + ihdr_data + b'\x00\x00\x00\r'
    crc = 0
    for byte in b'IHDR' + ihdr_data:
        crc ^= byte << 24
        for _ in range(8):
            if crc & 0x80000000:
                crc = (crc << 1) ^ 0x04C11DB7
            else:
                crc <<= 1
            crc &= 0xFFFFFFFF
    ihdr = b'IHDR' + ihdr_data + crc.to_bytes(4, 'big')

    # Create image data (simplified - solid color)
    # Using base64 encoded minimal PNG
    return None  # Would need proper PNG encoding

# Instead, let's create a simple HTML page that can be used to generate PNGs

html_generator = """<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            background: #f0f0f0;
            font-family: Arial, sans-serif;
        }
        .icon-pair {
            display: flex;
            gap: 20px;
            background: white;
            padding: 20px;
            border-radius: 8px;
        }
        .icon-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        canvas {
            border: 1px solid #ccc;
        }
        button {
            padding: 8px 16px;
            background: #4A90E2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #357ABD;
        }
    </style>
</head>
<body>
    <h1>Chrome Extension Icon Generator</h1>
    <p>Click each button to download the PNG icon</p>

    <div class="icon-pair">
        <div class="icon-box">
            <canvas id="icon16" width="16" height="16"></canvas>
            <button onclick="downloadIcon('icon16', 'icon16.png')">Download 16x16</button>
        </div>
        <div class="icon-box">
            <canvas id="icon48" width="48" height="48"></canvas>
            <button onclick="downloadIcon('icon48', 'icon48.png')">Download 48x48</button>
        </div>
        <div class="icon-box">
            <canvas id="icon128" width="128" height="128"></canvas>
            <button onclick="downloadIcon('icon128', 'icon128.png')">Download 128x128</button>
        </div>
    </div>

    <div class="icon-pair">
        <div class="icon-box">
            <canvas id="icon16-locked" width="16" height="16"></canvas>
            <button onclick="downloadIcon('icon16-locked', 'icon16-locked.png')">Download 16x16 Locked</button>
        </div>
        <div class="icon-box">
            <canvas id="icon48-locked" width="48" height="48"></canvas>
            <button onclick="downloadIcon('icon48-locked', 'icon48-locked.png')">Download 48x48 Locked</button>
        </div>
    </div>

    <script>
        // Draw lock icons
        function drawLockIcon(ctx, size, color, locked) {
            const scale = size / 24;
            ctx.scale(scale, scale);

            // Lock body
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(3, 11, 18, 11, 2);
            ctx.fill();

            // Lock shackle
            if (locked) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(7, 11);
                ctx.lineTo(7, 7);
                ctx.arc(12, 7, 5, Math.PI, 0);
                ctx.lineTo(17, 11);
                ctx.fill();
            } else {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(7, 11);
                ctx.lineTo(7, 7);
                ctx.arc(12, 7, 5, Math.PI, 0);
                ctx.lineTo(17, 11);
                ctx.stroke();
            }
        }

        // Draw all icons
        const icons = [
            { id: 'icon16', size: 16, color: '#e94560', locked: false },
            { id: 'icon48', size: 48, color: '#e94560', locked: false },
            { id: 'icon128', size: 128, color: '#e94560', locked: false },
            { id: 'icon16-locked', size: 16, color: '#4A90E2', locked: true },
            { id: 'icon48-locked', size: 48, color: '#4A90E2', locked: true },
        ];

        icons.forEach(icon => {
            const canvas = document.getElementById(icon.id);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, icon.size, icon.size);
            drawLockIcon(ctx, icon.size, icon.color, icon.locked);
        });

        // Download function
        function downloadIcon(canvasId, filename) {
            const canvas = document.getElementById(canvasId);
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    </script>
</body>
</html>
"""

# Write the HTML generator
with open('icon-generator.html', 'w') as f:
    f.write(html_generator)

print("=" * 60)
print("Chrome Extension Icon Generator")
print("=" * 60)
print()
print("Since Python's built-in libraries cannot create PNGs easily,")
print("an HTML file 'icon-generator.html' has been created.")
print()
print("To generate the PNG icons:")
print("1. Open 'icon-generator.html' in a web browser")
print("2. Click each download button to save the PNG files")
print("3. Move the downloaded PNG files to the 'icons/' folder")
print()
print("Alternatively, use ImageMagick:")
print("  cd icons")
print("  magick convert icon16.svg icon16.png")
print("  magick convert icon48.svg icon48.png")
print("  magick convert icon128.svg icon128.png")
print("  magick convert icon16-locked.svg icon16-locked.png")
print("  magick convert icon48-locked.svg icon48-locked.png")
print()
print("=" * 60)