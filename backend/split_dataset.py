import os
import shutil
import random

# Main Configuration
SOURCE_DIR="dataset/cattle"
OUTPUT_DIR="dataset"
TRAIN_RATIO=0.70
VAL_RATIO=0.15
TEST_RATIO=0.15
SEED=42


random.seed(SEED)

IMAGE_EXTENSION={'.jpeg','.png','.jpg','.webp','.bmp','.tiff'}

for class_name in os.listdir(SOURCE_DIR):
    class_path=os.path.join(SOURCE_DIR,class_name)
    #ignore for cache folder
    if not os.path.isdir(class_path) or class_name.startswith('.'):
        continue

    image=[f for f in os.listdir(class_path) if os.path.splitext(f)[1].lower() in IMAGE_EXTENSION]
    random.shuffle(image)

    total=len(image)
    train_end=int(total*TRAIN_RATIO)
    val_end=train_end+int(total*VAL_RATIO)

    split={
        "train":image[:train_end],
        "val":image[train_end:val_end],
        "test":image[val_end:]

    }

    for split_name,files in split.items():
        target_dir=os.path.join(OUTPUT_DIR,split_name,class_name)
        os.makedirs(target_dir,exist_ok=True)

        for file in files:
            src=os.path.join(class_path,file)
            dst=os.path.join(target_dir,file)
            shutil.copy2(src,dst)

    print(f"{class_name:25s} → train: {len(split['train']):4d}  |  "f"val: {len(split['val']):4d}  |  test: {len(split['test']):4d}  |  "f"total: {total}")
print("Dataset split completed")