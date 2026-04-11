# Troubleshooting

## Device is not found

The issue varies by operating system. Check the sections below.

:::details Windows
You probably need to install the driver for your USB to serial chip.
:::

:::details Linux
You probably need to `chown` the owner of `/dev/ttyUSB*` to yourself and change permissions of it as well.
:::

:::details MacOS
I haven't tried it on MacOS.
:::

## Nothing displayed in serial monitor

This is typically fixed by pressing the reboot button on your board.

## File explorer doesn't load

Press the reload button in the file explorer header once or twice.