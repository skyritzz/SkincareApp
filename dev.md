EVERY SESSION RUN IN ORDER:

1. emulator -avd $(emulator -list-avds | head -1) -memory 4096 -cores 4
   [wait for home screen]

2. adb reverse tcp:8081 tcp:8081

3. npx react-native start --reset-cache
   [wait for Metro ready]

4. npx react-native run-android


