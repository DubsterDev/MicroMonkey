# Flashing MicroPython

MicroMonkey includes support for flashing MicroPython to ESP32s out of the box using `esptool.js`. To get started, connect your board to MicroMonkey using the `Connect to Board` button and then use the command palette (`Control+Shift+P`) to select `Flash MicroPython`.

You'll need to grab a copy of MicroPython from the [MicroPython website](https://micropython.org/download/), which you need to upload to MicroMonkey on the flasher page.

Then click the Continue button. On most devices you'll need to manually enter bootloader mode on the device.

On ESP32 development boards this can be done by holding the BOOT button on the board, and on ESP32s that are not on development boards, you need to connect GPIO0 to ground.

MicroMonkey should then show a progress bar. Keep your board connected and the tab active or you will have to retry. When it gets done, MicroMonkey will let you know and you can reboot your device and MicroPython will be running on it.