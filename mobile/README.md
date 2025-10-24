# Mobile (Expo) setup

This folder will contain the Expo mobile app. To keep the repo small and avoid running heavy installs in this environment, please run the following locally on your machine inside this `mobile/` folder.

1. Ensure Node.js (LTS) and Git are installed on your machine.
2. Open a terminal in this folder and run:

```bash
# initialize an Expo TypeScript app in the current folder
npx create-expo-app . --template blank-ts
```

3. Install the extra dependencies we use for socket.io and navigation:

```bash
npx expo install socket.io-client @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

4. Replace `App.tsx` contents with the example in `App.example.tsx` below, and set `SERVER_URL` to your deployed Railway URL (for example: `https://your-project.up.railway.app`).

5. Start the Expo dev server:

```bash
npx expo start
```

6. Open the Expo Go app on your phone and scan the QR code shown in the terminal.

Notes:
- Do NOT commit secrets or your `.env` file.
- If you need to edit native configs later, follow Expo docs.
