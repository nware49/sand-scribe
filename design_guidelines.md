# Beach Messages - Design Guidelines

## Brand Identity
**Purpose**: A romantic communication app that sends heartfelt messages to a loved one's BLE-connected display device.

**Aesthetic Direction**: Soft coastal romance - gentle gradients, flowing curves, serene ocean-inspired palette. The app should feel like a love letter delivered by the sea - warm, intimate, and calming.

**Memorable Element**: The heart animation that ripples across the screen like a wave when a message sends successfully.

## Navigation Architecture
**Type**: Stack-Only (single primary screen with modal overlays)

**Screens**:
1. **Main Message Screen** - Compose and send messages, view connection status
2. **Message History Modal** - View recently sent messages (nice-to-have)
3. **Scheduled Messages Modal** - Schedule future messages (nice-to-have)

## Screen-by-Screen Specifications

### Main Message Screen
**Purpose**: Connect to BLE device, compose, and send romantic messages.

**Layout**:
- No navigation header (full-screen branded experience)
- Scrollable content with gradient background
- Top safe area inset: insets.top + Spacing.xl
- Bottom safe area inset: insets.bottom + Spacing.xl

**Components (top to bottom)**:
1. **Connection Status Banner** (top, floating card)
   - Icon (Bluetooth symbol) + status text
   - Green when connected ("Connected to Helen's Display")
   - Gray when disconnected ("Searching for device...")
   - Subtle pulse animation when searching
   - Drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 4)

2. **App Title** - "Beach Messages" in decorative font, centered

3. **Message Input Card** (elevated white card)
   - Multi-line text input (up to 100 characters)
   - Character counter in bottom-right ("45/100" format)
   - Placeholder: "Write your message..."
   - Soft rounded corners (16px)

4. **Send Button** (full-width, below input)
   - Large, prominent ocean blue button
   - Disabled state (gray) when not connected
   - Haptic feedback on press
   - Floating shadow when enabled

5. **Suggested Messages Section**
   - Header: "Quick Messages" (small, uppercase, light text)
   - Horizontal scrollable chips/pills for each suggestion
   - Each chip has wave icon + message text
   - Suggestions: "I love you", "Thinking of you", "Miss you!", "You're amazing", "Have a great day!"
   - Tapping fills the input field

6. **History Button** (floating bottom-right corner)
   - Circular button with list icon
   - Opens message history modal
   - Drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)

**Animations**:
- **Success**: Full-screen heart animation with ripple effect (like waves), dissolves after 2 seconds
- **Error**: Shake animation on input card + haptic error feedback

### Message History Modal (Nice-to-have)
**Purpose**: View recently sent messages.

**Layout**:
- Standard modal presentation
- Header with "Recent Messages" title + close button
- List of messages with timestamp
- Empty state illustration if no messages

## Color Palette
- **Primary (Ocean Blue)**: #4A90A4 - Send button, active states
- **Secondary (Sunset Coral)**: #F28E7D - Accents, success states
- **Background Gradient**: Linear gradient from #F5E6D3 (sandy beige, top) to #A4D4E6 (light ocean blue, bottom)
- **Surface (Card)**: #FFFFFF with 90% opacity - Input cards, status banner
- **Text Primary**: #2C3E50 - Main content
- **Text Secondary**: #7B8A9A - Labels, placeholders
- **Success**: #6ECFA0 - Connection status
- **Error**: #E74C3C - Disconnection, errors

## Typography
- **Display Font**: Pacifico (Google Font) - App title only
- **Body Font**: SF Pro (System) - All other text
- **Type Scale**:
  - Title (app name): 32pt, Pacifico
  - Headline (section headers): 18pt, SF Pro Bold
  - Body: 16pt, SF Pro Regular
  - Caption (character counter): 14pt, SF Pro Light

## Visual Design
- Soft rounded corners (16px) on all cards
- Minimal drop shadows for depth
- Wave-shaped dividers between sections (optional decorative element)
- All buttons use haptic feedback
- Input focus state: subtle ocean blue glow

## Assets to Generate

**App Icon** (icon.png)
- Stylized heart with wave pattern inside, ocean blue and sunset coral gradient
- WHERE USED: Device home screen

**Splash Icon** (splash-icon.png)
- Same as app icon but simplified for launch screen
- WHERE USED: App launch screen

**Empty History Illustration** (empty-history.png)
- Message in a bottle on sandy beach, soft watercolor style
- WHERE USED: Message History modal when no messages sent

**Success Heart Animation** (success-heart.png)
- Large heart shape with concentric wave rings (like ripples in water)
- WHERE USED: Full-screen overlay after successful message send

**Wave Decorative Element** (wave-accent.svg)
- Subtle wave pattern for section dividers
- Ocean blue with transparency
- WHERE USED: Between message input and suggestions section

**Connection Icon States**:
- bluetooth-connected.png - Green Bluetooth symbol
- bluetooth-searching.png - Gray Bluetooth symbol with pulse
- WHERE USED: Connection status banner