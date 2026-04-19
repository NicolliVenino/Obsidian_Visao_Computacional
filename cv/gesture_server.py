import cv2
import mediapipe as mp
import asyncio
import websockets
import json

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7)

def detect_gesture(landmarks):
    tips = [8, 12, 16, 20] 
    fingers_up = sum(1 for t in tips if landmarks[t].y < landmarks[t - 2].y)
    
    if fingers_up == 5:
        return "pan"
    elif fingers_up == 1:
        return "select"
    elif fingers_up == 0:
        return "drag"
    
    thumb = landmarks[4]
    index = landmarks[8]
    dist = ((thumb.x - index.x)**2 + (thumb.y - index.y)**2)**0.5
    if dist < 0.05:
        return "zoom_in"
    
    return "none"

async def handler(websocket):
    cap = cv2.VideoCapture(0)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb)
        
        if result.multi_hand_landmarks:
            for hand in result.multi_hand_landmarks:
                gesture = detect_gesture(hand.landmark)
                lm = hand.landmark[9]  
                payload = {
                    "gesture": gesture,
                    "x": round(lm.x, 3),
                    "y": round(lm.y, 3)
                }
                await websocket.send(json.dumps(payload))
        
        await asyncio.sleep(0.033) 
    cap.release()

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        print("Servidor rodando em ws://localhost:8765")
        await asyncio.Future()

asyncio.run(main())