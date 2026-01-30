# Sand Scribe - Design Guidelines

## Brand Identity
**Purpose**: A romantic communication app that sends heartfelt messages to a loved one's BLE-connected display device via a message queue.

**Aesthetic Direction**: Soft coastal romance - gentle gradients, flowing curves, serene ocean-inspired palette. The app should feel like a love letter delivered by the sea - warm, intimate, and calming.

**Memorable Element**: The heart animation that ripples across the screen like a wave when a message sends successfully.

## App Architecture
**Two Roles**:
1. **Sender Mode** - Compose messages that get queued on the server (no Bluetooth needed)
2. **Receiver Mode** - Connect to ESP32 via BLE, fetch pending messages, send to display

## Navigation Architecture
**Type**: Tab-based with Stack overlays

**Tabs**:
1. **Send Tab** - Compose and queue messages
2. **Receive Tab** - Connect to device and deliver pending messages
3. **History Tab** - View sent/delivered messages

## Screen-by-Screen Specifications

### Send Screen (Sender Mode)
**Purpose**: Compose and queue messages for delivery.

**Layout**:
- Gradient background (sandy beige to ocean blue)
- Top safe area inset
- Bottom tab bar with safe area

**Components (top to bottom)**:
1. **App Title** - "Sand Scribe" in Pacifico font, centered with icon

2. **Message Input Card** (elevated white card)
   - Multi-line text input (up to 100 characters)
   - Character counter in bottom-right ("45/100" format)
   - Placeholder: "Write your message..."
   - Soft rounded corners (16px)

3. **Send Button** (full-width)
   - Large, prominent ocean blue button
   - "Queue Message" text
   - Haptic feedback on press

4. **Suggested Messages Section**
   - Header: "QUICK MESSAGES"
   - Horizontal scrollable chips
   - Tapping fills the input field

### Receive Screen (Receiver Mode)
**Purpose**: Connect to ESP32 and deliver pending messages.

**Components**:
1. **Connection Status Banner**
   - Bluetooth icon + status text
   - Green when connected, gray when searching

2. **Pending Messages List**
   - Cards showing queued messages
   - "Deliver" button on each message
   - Badge showing count of pending messages

3. **Auto-deliver Toggle**
   - Option to automatically send all pending messages when connected

### History Screen
**Purpose**: View message history.

**Components**:
- List of all messages with status (pending/delivered)
- Timestamp for each message
- Empty state with message-in-bottle illustration

## Color Palette
- **Primary (Ocean Blue)**: #4A90A4 - Buttons, active states
- **Secondary (Sunset Coral)**: #F28E7D - Accents, hearts
- **Background Gradient**: Linear from #F5E6D3 (sandy beige) to #A4D4E6 (light ocean)
- **Surface (Card)**: #FFFFFF with 90% opacity
- **Text Primary**: #2C3E50
- **Text Secondary**: #7B8A9A
- **Success**: #6ECFA0 - Delivered status
- **Error**: #E74C3C - Errors

## Typography
- **Display Font**: Pacifico (Google Font) - App title only
- **Body Font**: System font - All other text

## Visual Design
- Soft rounded corners (16px) on all cards
- Minimal drop shadows for depth
- All buttons use haptic feedback
- Success animation: Heart with ripple effect

## Assets
- **App Icon** (icon.png): Heart with wave pattern
- **Splash Icon** (splash-icon.png): Same as app icon
- **Empty History** (empty-history.png): Message in bottle illustration
- **Success Heart** (success-heart.png): Heart with ripple rings
