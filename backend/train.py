import  tensorflow as tf
from model.model import build

#configuration
TRAIN_PATH='dataset/train'
VAL_PATH='dataset/val'
TEST_PATH='dataset/test'

IMAGE_SIZE=(224,224)
BATCH_SIZE=32
EPOCHS=15

#load the data
train_ds=tf.keras.utils.image_dataset_from_directory(
    TRAIN_PATH,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode='int',
    shuffle=True,
    seed=42
)

val_ds=tf.keras.utils.image_dataset_from_directory(
    VAL_PATH,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode='int',
    shuffle=False
)

test_ds=tf.keras.utils.image_dataset_from_directory(
    TEST_PATH,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode='int',
    shuffle=False
)

#get the class and count
class_names=train_ds.class_names
num_class=len(class_names)
print(f"\n Found {num_class}  classes:{class_names}")

# Normalize pixel values to [-1, 1] range (required by MobileNetV2)
normalization = tf.keras.layers.Rescaling(1./127.5, offset=-1)
train_ds = train_ds.map(lambda x, y: (normalization(x), y))
val_ds = val_ds.map(lambda x, y: (normalization(x), y))
test_ds = test_ds.map(lambda x, y: (normalization(x), y))

#performance optimization
AUTOTUNE=tf.data.AUTOTUNE
train_ds=train_ds.prefetch(buffer_size=AUTOTUNE)
val_ds=val_ds.prefetch(buffer_size=AUTOTUNE)
test_ds=test_ds.prefetch(buffer_size=AUTOTUNE)

# model & compile
model= build(num_class)
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
model.summary()

#train
print("\n starting the train process")
history= model.fit(train_ds,validation_data=val_ds,epochs=EPOCHS)

#evaluate
print("\n starting the test")
test_loss,test_acc=model.evaluate(test_ds)
print(f"\n test loss: {test_loss:.4f}")
print(f"\n test accuracy: {test_acc:.4f}")

#save model
model.save("model/cattle_classifier.keras")
print("\n model saved as model/cattle_classifier.keras")