from PIL import Image
import os

# Ruta de la imagen original
image_path = r'..\super-coldy-mobile\assets\dev-logo.jpeg'

# Abrir la imagen
img = Image.open(image_path)
print(f"Dimensiones originales: {img.size}")

# Convertir a una imagen cuadrada cortando el centro
width, height = img.size
size = min(width, height)

# Calcular el crop centrado
left = (width - size) // 2
top = (height - size) // 2
right = left + size
bottom = top + size

# Hacer crop
img_cropped = img.crop((left, top, right, bottom))
print(f"Imagen recortada a: {img_cropped.size}")

# Crear carpeta para íconos si no existe
icon_dir = r'..\super-coldy-mobile\assets\icons'
os.makedirs(icon_dir, exist_ok=True)

# Guardar en diferentes tamaños para Expo
sizes = {
    'app-icon-192.png': (192, 192),
    'app-icon-256.png': (256, 256),
    'app-icon-512.png': (512, 512),
    'app-icon-1024.png': (1024, 1024),
}

for filename, size_tuple in sizes.items():
    resized = img_cropped.resize(size_tuple, Image.Resampling.LANCZOS)
    resized.save(os.path.join(icon_dir, filename))
    print(f"Icono guardado: {filename} ({size_tuple[0]}x{size_tuple[1]})")

print("✅ Todos los iconos han sido creados exitosamente")
