import cv2
import os
import sys

def extract_frames(video_path, output_dir, step=1):
    if not os.path.exists(video_path):
        print(f"Error: Video file '{video_path}' not found.")
        return

    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file '{video_path}'.")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if fps > 0 else 0

    print(f"Video Details:")
    print(f" - Resolution: {width}x{height}")
    print(f" - FPS: {fps:.2f}")
    print(f" - Total Frames: {total_frames}")
    print(f" - Duration: {duration:.2f} seconds")
    print(f" - Extracting every {step} frame(s)...")

    frame_idx = 0
    saved_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step == 0:
            frame_filename = os.path.join(output_dir, f"frame_{saved_count+1:04d}.png")
            cv2.imwrite(frame_filename, frame)
            saved_count += 1
            if saved_count % 20 == 0 or saved_count == 1:
                print(f"Extracted {saved_count} frames...")

        frame_idx += 1

    cap.release()
    print(f"Done! Successfully extracted {saved_count} frames into '{output_dir}'.")

if __name__ == "__main__":
    video_file = "Car_components_hovering_in_mid-air_20260929195029.mp4"
    out_dir = "frames"
    step = 1
    if len(sys.argv) > 1:
        try:
            step = int(sys.argv[1])
        except ValueError:
            pass
    extract_frames(video_file, out_dir, step=step)
